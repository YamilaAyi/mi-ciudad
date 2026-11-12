import type { OrigenVisita, Visita } from '../tipos/entities';
import { abrirBase } from './baseLocal';
import { ErrorApi, pedir } from './cliente';
import { subirFoto } from './fotos';
import { asegurarSesion, obtenerUsuarioId } from './sesion';
export let usandoCacheVisitas = false;

interface FilaVisita {
  id: string;
  usuarioId: string;
  lugarId: string;
  fechaHora: string;
  origen: string;
  fotoUri: string | null;
  nota: string | null;
  sincronizada: number; // en SQLite: 0 = falta subir, 1 = ya está en la API
}

interface RespuestaLista {
  datos: Visita[];
}

function aVisita(fila: FilaVisita): Visita {
  return {
    ...fila,
    origen: fila.origen as OrigenVisita,
    sincronizada: fila.sincronizada === 1,
  };
}

function esSinConexion(e: unknown): boolean {
  return e instanceof ErrorApi && e.codigo === 'SIN_CONEXION';
}

// Sube una visita a la API. El id lo generó el teléfono: si se repite, no se duplica.
async function subir(visita: Visita): Promise<void> {
  // Si la foto está solo en el teléfono, primero se sube y se usa su dirección pública.
  let fotoUrl: string | null = visita.fotoUri;
  if (fotoUrl && fotoUrl.startsWith('file:')) {
    fotoUrl = await subirFoto(fotoUrl);
  }

  await pedir('/yo/visitas', {
    metodo: 'POST',
    cuerpo: {
      id: visita.id,
      lugarId: visita.lugarId,
      fechaHora: visita.fechaHora,
      origen: visita.origen,
      nota: visita.nota,
      fotoUri: fotoUrl,
    },
  });
}

// Sube lo que quedó pendiente y baja lo que haya en la API.
async function sincronizar(usuarioId: string): Promise<void> {
  const base = await abrirBase();
  await asegurarSesion();

  const pendientes = await base.getAllAsync<FilaVisita>(
    'SELECT * FROM visitas WHERE usuarioId = ? AND sincronizada = 0',
    [usuarioId]
  );
  for (const fila of pendientes) {
    try {
      await subir(aVisita(fila));
      await base.runAsync('UPDATE visitas SET sincronizada = 1 WHERE id = ?', [fila.id]);
    } catch (e) {
      console.log('No se pudo subir la visita pendiente', fila.id, '->', e);
            if (esSinConexion(e)) throw e;  // sin señal: lo intentamos la próxima vez
      // otro error: la dejamos pendiente y seguimos con las demás
    }
  }

  const respuesta = await pedir<RespuestaLista>('/yo/visitas?porPagina=500');
  for (const v of respuesta.datos) {
    await base.runAsync(
      `INSERT INTO visitas
        (id, usuarioId, lugarId, fechaHora, origen, fotoUri, nota, sincronizada)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(id) DO UPDATE SET
         usuarioId = excluded.usuarioId,
         lugarId = excluded.lugarId,
         fechaHora = excluded.fechaHora,
         origen = excluded.origen,
         nota = excluded.nota,
         sincronizada = 1,
         -- si la foto está solo en el teléfono, la conservamos
         fotoUri = CASE
           WHEN visitas.fotoUri LIKE 'file:%' THEN visitas.fotoUri
           ELSE excluded.fotoUri
         END`,
      [v.id, v.usuarioId, v.lugarId, v.fechaHora, v.origen, v.fotoUri, v.nota]
    );
  }
}

export async function obtenerVisitas(): Promise<Visita[]> {
  // Sin sesión lanza NO_AUTENTICADO; sin conexión usa el usuario guardado.
  const usuarioId = await obtenerUsuarioId();
  if (!usuarioId) {
    throw new ErrorApi(
      'SIN_CONEXION',
      'Necesitamos conexión la primera vez para cargar tu recorrido.',
      0
    );
  }

   try {
    await sincronizar(usuarioId);
    usandoCacheVisitas = false;
  } catch (e) {
    console.log('No se pudo sincronizar:', e);
    // sin conexión u otro problema: mostramos lo que hay guardado en el teléfono
    usandoCacheVisitas = true;
  }

  const base = await abrirBase();
  const filas = await base.getAllAsync<FilaVisita>(
    'SELECT * FROM visitas WHERE usuarioId = ?',
    [usuarioId]
  );
  return filas.map(aVisita);
}

export async function obtenerVisitaPorId(id: string): Promise<Visita | null> {
  const base = await abrirBase();
  const fila = await base.getFirstAsync<FilaVisita>('SELECT * FROM visitas WHERE id = ?', [id]);
  return fila ? aVisita(fila) : null;
}

export async function registrarVisita(datos: {
  lugarId: string;
  origen: OrigenVisita;
  nota: string | null;
  fotoUri?: string | null;
}): Promise<Visita> {
  // Sin sesión lanza NO_AUTENTICADO; sin conexión usa el usuario guardado.
  const usuarioId = await obtenerUsuarioId();
  if (!usuarioId) {
    throw new ErrorApi(
      'SIN_CONEXION',
      'Necesitamos conexión la primera vez para iniciar tu sesión.',
      0
    );
  }

  const nueva: Visita = {
    id: `vis-${Date.now()}`,
    usuarioId,
    lugarId: datos.lugarId,
    fechaHora: new Date().toISOString(),
    origen: datos.origen,
    fotoUri: datos.fotoUri ?? null,
    nota: datos.nota,
    sincronizada: false,
  };

  // 1) Primero se guarda en el teléfono: pase lo que pase, no se pierde.
  const base = await abrirBase();
  await base.runAsync(
    `INSERT INTO visitas
      (id, usuarioId, lugarId, fechaHora, origen, fotoUri, nota, sincronizada)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [nueva.id, nueva.usuarioId, nueva.lugarId, nueva.fechaHora, nueva.origen, nueva.fotoUri, nueva.nota]
  );

  // 2) Después se intenta subir.
  try {
    await subir(nueva);
    await base.runAsync('UPDATE visitas SET sincronizada = 1 WHERE id = ?', [nueva.id]);
    return { ...nueva, sincronizada: true };
  } catch (e) {
    console.log('No se pudo subir la visita nueva', nueva.id, '->', e);
    // La API la rechazó por el contenido (por ejemplo, un lugar que no existe): no tiene
    // sentido guardarla. El 401 (sesión vencida) es distinto: se conserva y se sube después.
    if (e instanceof ErrorApi && e.estado >= 400 && e.estado < 500 && e.estado !== 401) {
      await base.runAsync('DELETE FROM visitas WHERE id = ?', [nueva.id]);
      throw e;
    }
    // Sin conexión, sesión vencida o error del servidor: queda guardada y se sube después.
    return nueva;
  }
}

// Ids de los lugares que la persona ya visitó. Si no se puede saber (sin sesión o sin
// datos), devuelve null y las pantallas simplemente no muestran el indicador.
export async function obtenerIdsVisitados(): Promise<Set<string> | null> {
  try {
    const visitas = await obtenerVisitas();
    return new Set(visitas.map((v) => v.lugarId));
  } catch {
    return null;
  }
}