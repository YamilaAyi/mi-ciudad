import type { Lugar } from './entities';

export type { Usuario } from './entities';

export type LugarResumen = Pick<Lugar, 'id' | 'nombre' | 'categoriaId' | 'imagenes'>;
