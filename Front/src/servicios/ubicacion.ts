import * as Location from 'expo-location';
import type { Coordenadas } from '../tipos/entities';

// A cuántos metros del lugar se considera que la persona está "ahí".
export const DISTANCIA_MAXIMA_METROS = 150;

// Distancia en metros entre dos puntos (fórmula de Haversine).
export function distanciaEnMetros(a: Coordenadas, b: Coordenadas): number {
  const RADIO_TIERRA = 6371000;
  const aRadianes = (grados: number) => (grados * Math.PI) / 180;

  const dLat = aRadianes(b.latitud - a.latitud);
  const dLon = aRadianes(b.longitud - a.longitud);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.latitud)) *
      Math.cos(aRadianes(b.latitud)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * RADIO_TIERRA * Math.asin(Math.sqrt(x));
}

// Para mostrar: "85 m" o "2,3 km".
export function formatearDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}

export class ErrorUbicacion extends Error {
  codigo: 'SIN_PERMISO' | 'GPS_APAGADO' | 'NO_DISPONIBLE';

  constructor(
    codigo: 'SIN_PERMISO' | 'GPS_APAGADO' | 'NO_DISPONIBLE',
    mensaje: string
  ) {
    super(mensaje);
    this.codigo = codigo;
  }
}

type OpcionesUbicacion = {
  permitirUltimaUbicacion?: boolean;
};

// Obtiene la ubicación actual.
// En mapas y lugares cercanos se puede permitir una ubicación reciente.
// Para confirmar visitas, seguimos exigiendo una ubicación nueva.
export async function obtenerUbicacionActual(
  opciones: OpcionesUbicacion = {}
): Promise<Coordenadas> {
  let permiso = await Location.getForegroundPermissionsAsync();

  if (!permiso.granted) {
    permiso = await Location.requestForegroundPermissionsAsync();
  }

  if (!permiso.granted) {
    throw new ErrorUbicacion(
      'SIN_PERMISO',
      'No tenemos permiso para usar tu ubicación. Podés guardar la visita a mano.'
    );
  }

  const activado = await Location.hasServicesEnabledAsync();

  if (!activado) {
    throw new ErrorUbicacion(
      'GPS_APAGADO',
      'Tenés la ubicación apagada en el teléfono. Prendela o guardá la visita a mano.'
    );
  }

  let temporizador: ReturnType<typeof setTimeout> | undefined;

  try {
    // Damos hasta 25 segundos para obtener una posición nueva.
    const posicion = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<never>((_, rechazar) => {
        temporizador = setTimeout(
          () => rechazar(new Error('Tiempo de espera agotado')),
          25000
        );
      }),
    ]);

    return {
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
    };
  } catch (error) {
    console.warn('No se pudo obtener una ubicación nueva:', error);

    // Solo usamos una ubicación reciente cuando la pantalla lo permite.
    if (opciones.permitirUltimaUbicacion) {
      try {
        const ultimaUbicacion = await Location.getLastKnownPositionAsync({
          maxAge: 120000,
          requiredAccuracy: 1000,
        });

        if (ultimaUbicacion) {
          return {
            latitud: ultimaUbicacion.coords.latitude,
            longitud: ultimaUbicacion.coords.longitude,
          };
        }
      } catch (errorUltimaUbicacion) {
        console.warn(
          'No se pudo recuperar la última ubicación:',
          errorUltimaUbicacion
        );
      }
    }

    throw new ErrorUbicacion(
      'NO_DISPONIBLE',
      'No pudimos saber dónde estás. Probá de nuevo al aire libre o guardá la visita a mano.'
    );
  } finally {
    if (temporizador) {
      clearTimeout(temporizador);
    }
  }
}
