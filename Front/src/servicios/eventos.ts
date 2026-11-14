import type { Evento, EstadoEvento } from '../tipos/entities';
import { ApiError, apiRequest } from './api';
import { guardarCache, leerCache } from './baseLocal';

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

// Valen true cuando la última lectura salió de la copia guardada en el
// teléfono porque no hubo conexión (mismo patrón que lugares.ts).
export let usandoCacheEventos = false;
export let usandoCacheEventosGuardados = false;

// Solo se usa la copia guardada si falló la red o el servidor, no ante
// cualquier error (por ejemplo, un 404 de un evento que no existe).
function fallaPorRed(e: unknown): boolean {
  return (
    e instanceof ApiError && (e.codigo === 'SIN_CONEXION' || e.status >= 500)
  );
}

// Leer la copia nunca debe romper la pantalla: si está dañada o no se puede
// leer, se trata como si no existiera.
async function leerLista(clave: string): Promise<Evento[] | null> {
  try {
    const guardado = await leerCache(clave);
    if (guardado === null) return null;

    const datos: unknown = JSON.parse(guardado);
    return Array.isArray(datos) ? (datos as Evento[]) : null;
  } catch (error) {
    console.warn('No se pudo leer la copia guardada de eventos:', error);
    return null;
  }
}

// Guardar la copia es un extra: si falla, los datos que ya llegaron de la API
// se muestran igual.
async function guardarCopia(clave: string, datos: Evento[]): Promise<void> {
  try {
    await guardarCache(clave, JSON.stringify(datos));
  } catch (error) {
    console.warn('No se pudo guardar la copia de eventos:', error);
  }
}

/**
 * Pide la lista a la API. Si funciona, devuelve los datos de la API aunque no
 * se pueda guardar la copia. Si falla la red, devuelve la última copia
 * guardada (cuando hay una). `clave` en null significa "sin copia local".
 */
async function obtenerListaConCopia(
  clave: string | null,
  pedir: () => Promise<Evento[]>,
  marcarCopia: (usandoCopia: boolean) => void
): Promise<Evento[]> {
  let datos: Evento[];

  try {
    datos = await pedir();
  } catch (e) {
    if (clave && fallaPorRed(e)) {
      const guardados = await leerLista(clave);

      if (guardados) {
        marcarCopia(true);
        return guardados;
      }
    }

    throw e;
  }

  marcarCopia(false);
  if (clave) await guardarCopia(clave, datos);
  return datos;
}

/** Obtiene los eventos futuros desde hoy, ordenados por inicio por la API. */
export async function obtenerEventos(): Promise<Evento[]> {
  return obtenerListaConCopia(
    'eventos',
    async () => {
      const respuesta = await apiRequest<RespuestaLista<Evento>>(
        '/eventos?pagina=1&porPagina=100'
      );

      if (!respuesta) {
        throw new Error('La API no devolvió la agenda de eventos.');
      }

      return respuesta.datos;
    },
    (usandoCopia) => {
      usandoCacheEventos = usandoCopia;
    }
  );
}

/**
 * Consulta el evento directamente a la API.
 * No utiliza caché: evita rearmar recordatorios con datos desactualizados.
 */
export async function obtenerEventoActualizado(id: string): Promise<Evento> {
  const respuesta = await apiRequest<RespuestaUno<Evento>>(
    `/eventos/${encodeURIComponent(id)}`
  );

  if (!respuesta) {
    throw new Error('La API no devolvió el evento solicitado.');
  }

  return respuesta.datos;
}

/** Obtiene el detalle actualizado de un evento. */
export async function obtenerEvento(id: string): Promise<Evento> {
  try {
    const respuesta = await apiRequest<RespuestaUno<Evento>>(
      `/eventos/${encodeURIComponent(id)}`
    );

    if (!respuesta) {
      throw new Error('La API no devolvió el evento solicitado.');
    }

    return respuesta.datos;
  } catch (e) {
    if (fallaPorRed(e)) {
      const enCache = (await leerLista('eventos'))?.find(
        (evento) => evento.id === id
      );

      if (enCache) return enCache;
    }

    throw e;
  }
}

// La copia de guardados lleva el id del usuario para no mezclar cuentas en un
// mismo teléfono. Si no se puede saber quién es, no se usa copia (null).
async function claveEventosGuardados(): Promise<string | null> {
  try {
    const usuarioId = await leerCache('usuarioId');
    return usuarioId ? `eventos-guardados:${usuarioId}` : null;
  } catch (error) {
    console.warn('No se pudo leer el usuario para la copia de guardados:', error);
    return null;
  }
}

/** Obtiene los eventos guardados por el usuario autenticado. */
export async function obtenerEventosGuardados(): Promise<Evento[]> {
  const clave = await claveEventosGuardados();

  return obtenerListaConCopia(
    clave,
    async () => {
      const respuesta = await apiRequest<RespuestaLista<Evento>>(
        '/yo/eventos-guardados?pagina=1&porPagina=100'
      );

      if (!respuesta) {
        throw new Error('La API no devolvió tus eventos guardados.');
      }

      return respuesta.datos;
    },
    (usandoCopia) => {
      usandoCacheEventosGuardados = usandoCopia;
    }
  );
}

/** Guarda un evento para el usuario autenticado. */
export async function guardarEvento(id: string): Promise<Evento> {
  const respuesta = await apiRequest<RespuestaUno<Evento>>(
    `/yo/eventos-guardados/${encodeURIComponent(id)}`,
    { method: 'PUT' }
  );

  if (!respuesta) {
    throw new Error('La API no confirmó que el evento se guardó.');
  }

  return respuesta.datos;
}

/** Quita un evento de los guardados del usuario. */
export async function quitarEventoGuardado(id: string): Promise<void> {
  await apiRequest<null>(
    `/yo/eventos-guardados/${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  );
}

/**
 * Cambia el estado de un evento.
 * El backend exige rol administrador y rechaza esta acción para turistas.
 */
export async function cambiarEstadoEvento(
  id: string,
  estado: Exclude<EstadoEvento, 'finalizado'>
): Promise<Evento> {
  const respuesta = await apiRequest<RespuestaUno<Evento>>(
    `/eventos/${encodeURIComponent(id)}/estado`,
    {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }
  );

  if (!respuesta) {
    throw new Error('La API no confirmó el cambio de estado.');
  }

  return respuesta.datos;
}