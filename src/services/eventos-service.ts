import AsyncStorage from '@react-native-async-storage/async-storage';

import { EVENTOS_DEMO, type EstadoEvento, type Evento } from '@/data/eventos';

/**
 * ÚNICO punto de acceso a los eventos.
 * Hoy devuelve datos locales; cuando tengas backend, reemplazá el cuerpo de
 * obtenerEventos() por un fetch() y el resto de la app no cambia.
 *
 * Los "overrides" simulan lo que haría un panel de administración
 * (marcar un evento como cancelado / suspendido). Solo para probar.
 */
const CLAVE_OVERRIDES = 'agenda:overrides';

type Overrides = Record<string, EstadoEvento>;

async function leerOverrides(): Promise<Overrides> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_OVERRIDES);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

export async function obtenerEventos(): Promise<Evento[]> {
  const overrides = await leerOverrides();
  return EVENTOS_DEMO.map((e) => ({ ...e, estado: overrides[e.id] ?? e.estado })).sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime(),
  );
}

/** Solo para pruebas locales: simula el cambio de estado hecho desde un panel admin. */
export async function simularEstado(id: string, estado: EstadoEvento): Promise<void> {
  const overrides = await leerOverrides();
  overrides[id] = estado;
  await AsyncStorage.setItem(CLAVE_OVERRIDES, JSON.stringify(overrides));
}
