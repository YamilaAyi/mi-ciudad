import * as SQLite from 'expo-sqlite';
import type { Favorito, Lugar } from '../tipos/entities';
import type { LugarResumen } from '../tipos/usuario';
import { leerCache } from './baseLocal';
import { ApiError, apiRequest } from './api';

// Los favoritos se sincronizan con la API y se guardan en SQLite para usarlos sin conexión.
interface RespuestaLista<T> {
  datos: T[];
  meta: {
    total: number;
    pagina: number;
    porPagina: number;
  };
}

interface RespuestaUno<T> {
  datos: T;
  meta: null;
}

type AccionPendiente = 'agregar' | 'quitar' | null;

interface FilaFavorito {
  usuarioId: string;
  lugarId: string;
  lugar: string | null;
  accionPendiente: AccionPendiente;
}

let baseFavoritosPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function abrirBaseFavoritos(): Promise<SQLite.SQLiteDatabase> {
  if (!baseFavoritosPromise) {
    baseFavoritosPromise = (async () => {
      const base = await SQLite.openDatabaseAsync('mi-ciudad-favoritos.db');
      await base.execAsync(`
        -- Una fila representa el estado local de un favorito para un usuario.
        -- accionPendiente conserva el cambio si no se pudo enviar a la API.
        CREATE TABLE IF NOT EXISTS favoritos (
          usuarioId TEXT NOT NULL,
          lugarId TEXT NOT NULL,
          lugar TEXT,
          accionPendiente TEXT,
          PRIMARY KEY (usuarioId, lugarId)
        );
        -- Permite saber si ya se descargó alguna vez la lista desde el servidor.
        CREATE TABLE IF NOT EXISTS favoritos_sync (
          usuarioId TEXT PRIMARY KEY NOT NULL,
          sincronizadoEn TEXT NOT NULL
        );
      `);
      return base;
    })();
  }
  return baseFavoritosPromise;
}

function esErrorDeConexion(error: unknown): boolean {
  // Solo los fallos de conexión se resuelven con datos locales; otros errores
  // de la API deben mostrarse para no ocultar, por ejemplo, una sesión vencida.
  return (
    (error instanceof Error &&
      error.message.startsWith('No se pudo conectar con la API')) ||
    (error instanceof ApiError && error.codigo === 'SIN_CONEXION')
  );
}

function lugarPendiente(lugarId: string): LugarResumen {
  return {
    id: lugarId,
    nombre: 'Lugar guardado (pendiente de sincronizar)',
    categoriaId: 'Pendiente',
    imagenes: [],
  };
}

function leerLugar(fila: FilaFavorito): LugarResumen {
  if (!fila.lugar) return lugarPendiente(fila.lugarId);

  let valor: unknown;
  try {
    valor = JSON.parse(fila.lugar);
  } catch {
    throw new Error(`Los datos locales del favorito ${fila.lugarId} están dañados.`);
  }

  if (
    typeof valor !== 'object' ||
    valor === null ||
    !('id' in valor) ||
    typeof valor.id !== 'string' ||
    !('nombre' in valor) ||
    typeof valor.nombre !== 'string' ||
    !('categoriaId' in valor) ||
    typeof valor.categoriaId !== 'string' ||
    !('imagenes' in valor) ||
    !Array.isArray(valor.imagenes) ||
    !valor.imagenes.every((imagen) => typeof imagen === 'string')
  ) {
    throw new Error(`Los datos locales del favorito ${fila.lugarId} tienen un formato inválido.`);
  }

  return {
    id: valor.id,
    nombre: valor.nombre,
    categoriaId: valor.categoriaId,
    imagenes: valor.imagenes,
  };
}

async function obtenerUsuarioId(): Promise<string> {
  const usuarioId = await leerCache('usuarioId');
  if (!usuarioId) {
    throw new ApiError(
      'Iniciá sesión con conexión antes de consultar tus favoritos.',
      401,
      'NO_AUTENTICADO'
    );
  }
  return usuarioId;
}

async function leerFilas(usuarioId: string): Promise<FilaFavorito[]> {
  const base = await abrirBaseFavoritos();
  return base.getAllAsync<FilaFavorito>(
    'SELECT * FROM favoritos WHERE usuarioId = ? ORDER BY rowid',
    [usuarioId]
  );
}

async function guardarFavoritoLocal(
  usuarioId: string,
  lugarId: string,
  lugar: LugarResumen | null,
  accionPendiente: AccionPendiente
): Promise<void> {
  const base = await abrirBaseFavoritos();
  // Al actualizar la misma clave se conserva el lugar ya guardado si no se
  // recibió otro, pero siempre se reemplaza la acción pendiente más reciente.
  await base.runAsync(
    `INSERT INTO favoritos (usuarioId, lugarId, lugar, accionPendiente)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(usuarioId, lugarId) DO UPDATE SET
       lugar = COALESCE(excluded.lugar, favoritos.lugar),
       accionPendiente = excluded.accionPendiente`,
    [usuarioId, lugarId, lugar ? JSON.stringify(lugar) : null, accionPendiente]
  );
}

async function borrarFavoritoLocal(usuarioId: string, lugarId: string): Promise<void> {
  const base = await abrirBaseFavoritos();
  await base.runAsync(
    'DELETE FROM favoritos WHERE usuarioId = ? AND lugarId = ?',
    [usuarioId, lugarId]
  );
}

async function guardarIdsDelServidor(usuarioId: string, ids: string[]): Promise<void> {
  const base = await abrirBaseFavoritos();
  const filasLocales = await leerFilas(usuarioId);
  const idsServidor = new Set(ids);

  // Se actualiza la copia local con el servidor sin borrar cambios que aún
  // están en cola para sincronizar.
  for (const id of ids) {
    await guardarFavoritoLocal(usuarioId, id, null, null);
  }

  for (const fila of filasLocales) {
    if (!idsServidor.has(fila.lugarId) && fila.accionPendiente === null) {
      await borrarFavoritoLocal(usuarioId, fila.lugarId);
    }
  }
  await base.runAsync(
    `INSERT OR REPLACE INTO favoritos_sync (usuarioId, sincronizadoEn)
     VALUES (?, ?)`,
    [usuarioId, new Date().toISOString()]
  );
}

async function sincronizarPendientes(usuarioId: string): Promise<void> {
  const filas = await leerFilas(usuarioId);
  for (const fila of filas) {
    if (!fila.accionPendiente) continue;

    const ruta = `/yo/favoritos/${encodeURIComponent(fila.lugarId)}`;
    // Cada cambio offline queda en cola y se confirma localmente al sincronizarlo.
    if (fila.accionPendiente === 'agregar') {
      await apiRequest<RespuestaUno<Favorito>>(ruta, { method: 'PUT' });
      // Se quita de la cola solo después de que la API confirme el agregado.
      await guardarFavoritoLocal(usuarioId, fila.lugarId, null, null);
    } else {
      await apiRequest<null>(ruta, { method: 'DELETE' });
      // Si falla la petición, la fila permanece para volver a intentarlo luego.
      await borrarFavoritoLocal(usuarioId, fila.lugarId);
    }
  }
}

export async function obtenerIdsFavoritos(): Promise<string[]> {
  const usuarioId = await obtenerUsuarioId();
  try {
    // Cada consulta vuelve a intentar primero los cambios que quedaron en cola.
    await sincronizarPendientes(usuarioId);
    const respuesta = await apiRequest<RespuestaLista<Favorito>>('/yo/favoritos');
    if (!respuesta) {
      throw new Error('La API no devolvió la lista de favoritos.');
    }
    const ids = respuesta.datos.map((favorito) => favorito.lugarId);
    await guardarIdsDelServidor(usuarioId, ids);
    return ids;
  } catch (error) {
    if (!esErrorDeConexion(error)) throw error;
    // Si la API no está disponible, se muestran los datos locales y se respetan las bajas pendientes.
    const filas = await leerFilas(usuarioId);
    const base = await abrirBaseFavoritos();
    const ultimaSincronizacion = await base.getFirstAsync<{ usuarioId: string }>(
      'SELECT usuarioId FROM favoritos_sync WHERE usuarioId = ?',
      [usuarioId]
    );
    // Sin conexión se usa la copia local, pero solo si hay datos locales previos.
    if (!ultimaSincronizacion && filas.length === 0) throw error;
    return filas
      .filter((fila) => fila.accionPendiente !== 'quitar')
      .map((fila) => fila.lugarId);
  }
}

export async function obtenerFavoritos(): Promise<{ lugares: LugarResumen[] }> {
  const usuarioId = await obtenerUsuarioId();
  const ids = await obtenerIdsFavoritos();
  const lugares: LugarResumen[] = [];

  for (const id of ids) {
    try {
      const respuesta = await apiRequest<RespuestaUno<Lugar>>(
        `/lugares/${encodeURIComponent(id)}`
      );
      if (!respuesta) {
        throw new Error(`La API no devolvió los datos del lugar ${id}.`);
      }
      const resumen: LugarResumen = {
        id: respuesta.datos.id,
        nombre: respuesta.datos.nombre,
        categoriaId: respuesta.datos.categoriaId,
        imagenes: respuesta.datos.imagenes,
      };
      await guardarFavoritoLocal(usuarioId, id, resumen, null);
      lugares.push(resumen);
    } catch (error) {
      if (!esErrorDeConexion(error)) throw error;
      // El detalle puede no estar cacheado aún; en ese caso se muestra un
      // resumen provisional para que el favorito siga visible sin conexión.
      const fila = (await leerFilas(usuarioId)).find((favorito) => favorito.lugarId === id);
      lugares.push(fila ? leerLugar(fila) : lugarPendiente(id));
    }
  }

  return { lugares };
}

export async function alternarFavorito(
  lugarId: string,
  yaEsFavorito: boolean
): Promise<boolean> {
  const usuarioId = await obtenerUsuarioId();
  const filaAnterior = (await leerFilas(usuarioId)).find((fila) => fila.lugarId === lugarId);
  const ruta = `/yo/favoritos/${encodeURIComponent(lugarId)}`;

  try {
    if (yaEsFavorito) {
      await apiRequest<null>(ruta, { method: 'DELETE' });
      await borrarFavoritoLocal(usuarioId, lugarId);
      return false;
    }

    const respuesta = await apiRequest<RespuestaUno<Favorito>>(ruta, { method: 'PUT' });
    if (!respuesta) {
      throw new Error('La API no confirmó que se guardó el favorito.');
    }
    await guardarFavoritoLocal(
      usuarioId,
      lugarId,
      filaAnterior ? leerLugar(filaAnterior) : lugarPendiente(lugarId),
      null
    );
    return true;
  } catch (error) {
    if (!esErrorDeConexion(error)) throw error;
    // Refleja el cambio inmediatamente y lo deja en cola para reintentar la
    // sincronización cuando se vuelvan a consultar los favoritos.
    await guardarFavoritoLocal(
      usuarioId,
      lugarId,
      filaAnterior ? leerLugar(filaAnterior) : lugarPendiente(lugarId),
      yaEsFavorito ? 'quitar' : 'agregar'
    );
    return !yaEsFavorito;
  }
}
