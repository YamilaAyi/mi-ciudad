import type { ImageSourcePropType } from 'react-native';

import { buscarLugar } from '@/data/lugares';

export type EstadoEvento = 'programado' | 'cancelado' | 'suspendido_lluvia';

export type CategoriaEvento =
  | 'Peña'
  | 'Feria'
  | 'Recital'
  | 'Visita guiada'
  | 'Naturaleza'
  | 'Fiesta';

/**
 * Un evento se ubica con `lugarId` (lugar del catálogo) O con `direccion`
 * (texto libre: un campo, la costanera, etc.). Si vienen los dos, manda lugarId.
 */
export type Evento = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaEvento;
  /** ISO 8601 con zona horaria, ej: 2026-10-21T18:00:00-03:00 */
  inicio: string;
  duracionMin: number;
  gratuito: boolean;
  /** Texto libre cuando no es gratuito, ej: "$3.000" */
  precio?: string;
  lugarId?: number;
  direccion?: string;
  imagen: ImageSourcePropType;
  estado: EstadoEvento;
};

export const ETIQUETA_ESTADO: Record<EstadoEvento, string> = {
  programado: 'Confirmado',
  cancelado: 'Cancelado',
  suspendido_lluvia: 'Suspendido por lluvia',
};

export function ubicacionDeEvento(e: Evento): { texto: string; lugarId?: number } {
  const lugar = buscarLugar(e.lugarId);
  if (lugar) return { texto: lugar.nombre, lugarId: lugar.id };
  return { texto: e.direccion ?? 'Ubicación a confirmar' };
}

/* ---------------------------------------------------------------------------
 * DATOS DE DEMO
 * Fechas relativas a "hoy" para que la agenda siempre tenga algo para mostrar.
 * Reemplazar por datos reales (ver services/eventos-service.ts).
 * ------------------------------------------------------------------------- */

function en(dias: number, h: number, m = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const EVENTOS_DEMO: Evento[] = [
  {
    id: 'ev-feria-artesanos',
    titulo: 'Feria de Artesanos',
    descripcion: 'Puestos de artesanos locales, comidas regionales y música en vivo.',
    categoria: 'Feria',
    inicio: en(0, 10),
    duracionMin: 240,
    gratuito: true,
    direccion: 'Plaza San Martín',
    imagen: require('../../assets/images/colon-inicio.jpg'),
    estado: 'programado',
  },
  {
    id: 'ev-visita-molino',
    titulo: 'Visita guiada al Molino Forclaz',
    descripcion: 'Recorrido guiado por la historia del molino y su entorno.',
    categoria: 'Visita guiada',
    inicio: en(0, 19),
    duracionMin: 120,
    gratuito: false,
    precio: '$3.000',
    lugarId: 1,
    imagen: require('../../assets/images/molino-forclaz.jpg'),
    estado: 'programado',
  },
  {
    id: 'ev-recital-anfiteatro',
    titulo: 'Recital en el Anfiteatro',
    descripcion: 'Concierto de música local con artistas de la ciudad. Una oportunidad única para disfrutar de nuestra cultura.',
    categoria: 'Recital',
    inicio: en(1, 21),
    duracionMin: 180,
    gratuito: true,
    direccion: 'Anfiteatro de la costanera',
    imagen: require('../../assets/images/colon-fondo.jpg'),
    estado: 'programado',
  },
  {
    id: 'ev-avistaje-palmar',
    titulo: 'Avistaje de aves en El Palmar',
    descripcion: 'Salida de observación de aves con guía. Llevar agua, repelente y calzado cómodo.',
    categoria: 'Naturaleza',
    inicio: en(2, 6, 30),
    duracionMin: 180,
    gratuito: false,
    precio: 'Ingreso al parque',
    lugarId: 3,
    imagen: require('../../assets/images/el-palmar.jpg'),
    estado: 'programado',
  },
  {
    id: 'ev-pena-campo',
    titulo: 'Peña folklórica',
    descripcion: 'Noche de folklore, empanadas y guitarreada bajo las estrellas.',
    categoria: 'Peña',
    inicio: en(2, 21, 30),
    duracionMin: 240,
    gratuito: false,
    precio: '$5.000',
    direccion: 'Zona rural, camino a El Palmar',
    imagen: require('../../assets/images/colon-fondo-inicio.jpg'),
    estado: 'programado',
  },
  {
    id: 'ev-fiesta-artesania',
    titulo: 'Fiesta Nacional de la Artesanía',
    descripcion: 'Artesanos de todo el país, espectáculos y gastronomía en la costanera.',
    categoria: 'Fiesta',
    inicio: en(4, 17),
    duracionMin: 360,
    gratuito: true,
    direccion: 'Costanera',
    imagen: require('../../assets/images/colon-inicio.jpg'),
    estado: 'programado',
  },
];
