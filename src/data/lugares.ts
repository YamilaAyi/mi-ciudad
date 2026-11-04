import type { ImageSourcePropType } from 'react-native';

export type Lugar = {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  imagen: ImageSourcePropType;
};

/**
 * Catálogo de lugares (fuente única).
 * Hoy lugares.tsx y detalle.tsx tienen cada uno su copia; cuando puedas,
 * conviene que ambos importen desde acá.
 */
export const lugares: Lugar[] = [
  {
    id: 1,
    nombre: 'Molino Forclaz',
    categoria: 'Museos y patrimonio',
    descripcion: 'Monumento histórico de Colón, Entre Ríos.',
    imagen: require('../../assets/images/molino-forclaz.jpg'),
  },
  {
    id: 2,
    nombre: 'Termas de Colón',
    categoria: 'Termas y bienestar',
    descripcion: 'Complejo termal de Colón, ideal para descansar y disfrutar de sus piscinas.',
    imagen: require('../../assets/images/termas-colon.jpg'),
  },
  {
    id: 3,
    nombre: 'Parque Nacional El Palmar',
    categoria: 'Naturaleza',
    descripcion: 'Parque nacional conocido por sus palmeras yatay y sus senderos naturales.',
    imagen: require('../../assets/images/el-palmar.jpg'),
  },
];

export function buscarLugar(id?: number | null): Lugar | undefined {
  if (id == null) return undefined;
  return lugares.find((l) => l.id === id);
}
