import AsyncStorage from '@react-native-async-storage/async-storage';

import { EVENTOS_DEMO, type EstadoEvento, type Evento } from '@/data/eventos';
import { apiRequest } from '@/servicios/api';
import { guardarCache, leerCache } from '@/servicios/baseLocal';
import { pedir } from '@/servicios/cliente';
import { obtenerLugares } from '@/servicios/lugares';
import type { EstadoEvento as EstadoApi, Evento as EventoApi, Lugar } from '@/tipos/entities';

/**
 * ÚNICO punto de acceso a los eventos. Sigue el patrón de lugares.ts:
 * API -> guarda caché -> si falla, lee la caché. Como último recurso (si la API no
 * está disponible y no hay caché) usa los eventos de demo.
 */
const CLAVE_OVERRIDES = 'agenda:overrides';
const DURACION_POR_DEFECTO_MIN = 120;

export let usandoCacheEventos = false;

// true cuando la lista actual salió de EVENTOS_DEMO: esos ids no existen en el servidor.
let modoDemo = false;
export function enModoDemo(): boolean {
  return modoDemo;
}

type Overrides = Record<string, EstadoEvento>;
type RespuestaEventos = { datos: EventoApi[]; meta: unknown };

const IMAGEN_POR_DEFECTO = require('../../assets/images/colon-inicio.jpg');

// "finalizado" no es una anulación: la UI distingue lo pasado por la fecha, y si
// pasara como distinto de "programado" se vería (y avisaría) como cancelado.
const ESTADO_UI: Record<EstadoApi, EstadoEvento> = {
  programado: 'programado',
  cancelado: 'cancelado',
  suspendido: 'suspendido_lluvia',
  finalizado: 'programado',
};

const ESTADO_API: Record<EstadoEvento, EstadoApi> = {
  programado: 'programado',
  cancelado: 'cancelado',
  suspendido_lluvia: 'suspendido',
};

function aEvento(api: EventoApi, lugares: Lugar[]): Evento {
  const inicioMs = new Date(api.inicio).getTime();
  const duracionMin = api.fin
    ? Math.max(15, Math.round((new Date(api.fin).getTime() - inicioMs) / 60_000))
    : DURACION_POR_DEFECTO_MIN;
  const lugar = api.lugarId ? lugares.find((l) => l.id === api.lugarId) : undefined;

  return {
    id: api.id,
    titulo: api.titulo,
    descripcion: api.descripcion,
    inicio: api.inicio,
    duracionMin,
    gratuito: !api.precio,
    precio: api.precio ? `$${api.precio.toLocaleString('es-AR')}` : undefined,
    lugarId: api.lugarId ?? undefined,
    direccion: lugar?.nombre ?? api.direccionLibre ?? undefined,
    imagen: api.imagenUrl ? { uri: api.imagenUrl } : IMAGEN_POR_DEFECTO,
    estado: ESTADO_UI[api.estado] ?? 'programado',
  };
}

async function leerOverrides(): Promise<Overrides> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_OVERRIDES);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

function ordenar(eventos: Evento[]): Evento[] {
  return [...eventos].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime(),
  );
}

async function eventosDemo(): Promise<Evento[]> {
  const overrides = await leerOverrides();
  return ordenar(EVENTOS_DEMO.map((e) => ({ ...e, estado: overrides[e.id] ?? e.estado })));
}

async function traerEventosApi(): Promise<EventoApi[]> {
  try {
    const respuesta = await apiRequest<RespuestaEventos>('/eventos?porPagina=100');
    const lista = respuesta?.datos ?? [];
    await guardarCache('eventos', JSON.stringify(lista));
    usandoCacheEventos = false;
    return lista;
  } catch (error) {
    const guardados = await leerCache('eventos');
    if (guardados !== null) {
      usandoCacheEventos = true;
      return JSON.parse(guardados) as EventoApi[];
    }
    throw error;
  }
}

export async function obtenerEventos(): Promise<Evento[]> {
  try {
    const lista = await traerEventosApi();
    const lugares = await obtenerLugares().catch(() => [] as Lugar[]);
    modoDemo = false;
    return ordenar(lista.map((e) => aEvento(e, lugares)));
  } catch (error) {
    console.log('Eventos: sin API ni caché, uso datos de demo.', error);
    modoDemo = true;
    return eventosDemo();
  }
}

/* ---------------------------------------------------------------------------
 * Eventos guardados (viven en el servidor, requieren sesión).
 * Los errores se propagan como ErrorApi: sus mensajes se pueden mostrar tal cual
 * (por ejemplo NO_AUTENTICADO o EVENTO_NO_VIGENTE).
 * ------------------------------------------------------------------------- */

export async function guardarEnServidor(eventoId: string): Promise<void> {
  await pedir(`/yo/eventos-guardados/${encodeURIComponent(eventoId)}`, { metodo: 'PUT' });
}

export async function quitarDelServidor(eventoId: string): Promise<void> {
  await pedir(`/yo/eventos-guardados/${encodeURIComponent(eventoId)}`, { metodo: 'DELETE' });
}

/** Ids guardados en el servidor, o null si no se pudo saber (sin sesión o sin conexión). */
export async function obtenerIdsGuardadosServidor(): Promise<string[] | null> {
  try {
    const respuesta = await pedir<{ datos: EventoApi[] }>('/yo/eventos-guardados?porPagina=100');
    return respuesta.datos.map((e) => e.id);
  } catch (error) {
    console.log('No se pudieron leer los eventos guardados del servidor.', error);
    return null;
  }
}

/**
 * Solo para pruebas en desarrollo. Con la API, cambia el estado de verdad
 * (hay que haber ingresado con turismo@colon.demo.ar); con datos de demo, lo simula.
 */
export async function simularEstado(id: string, estado: EstadoEvento): Promise<void> {
  if (!modoDemo) {
    await pedir(`/eventos/${encodeURIComponent(id)}/estado`, {
      metodo: 'PATCH',
      cuerpo: { estado: ESTADO_API[estado] },
    });
    return;
  }
  const overrides = await leerOverrides();
  overrides[id] = estado;
  await AsyncStorage.setItem(CLAVE_OVERRIDES, JSON.stringify(overrides));
}
