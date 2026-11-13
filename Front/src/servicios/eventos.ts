import type { Evento, EstadoEvento } from '../tipos/entities';
import { apiRequest } from './api';

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

/** Obtiene los eventos futuros desde hoy, ordenados por inicio por la API. */
export async function obtenerEventos(): Promise<Evento[]> {
  const respuesta = await apiRequest<RespuestaLista<Evento>>(
    '/eventos?pagina=1&porPagina=100'
  );

  if (!respuesta) {
    throw new Error('La API no devolvió la agenda de eventos.');
  }

  return respuesta.datos;
}

/** Obtiene el detalle actualizado de un evento. */
export async function obtenerEvento(id: string): Promise<Evento> {
  const respuesta = await apiRequest<RespuestaUno<Evento>>(
    `/eventos/${encodeURIComponent(id)}`
  );

  if (!respuesta) {
    throw new Error('La API no devolvió el evento solicitado.');
  }

  return respuesta.datos;
}

/** Obtiene los eventos guardados por el usuario autenticado. */
export async function obtenerEventosGuardados(): Promise<Evento[]> {
  const respuesta = await apiRequest<RespuestaLista<Evento>>(
    '/yo/eventos-guardados?pagina=1&porPagina=100'
  );

  if (!respuesta) {
    throw new Error('La API no devolvió tus eventos guardados.');
  }

  return respuesta.datos;
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
