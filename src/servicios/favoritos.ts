import type { Favorito, Lugar } from '../tipos/entities';
import type { LugarResumen } from '../tipos/usuario';
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

export async function obtenerIdsFavoritos(): Promise<string[]> {
  const respuesta = await apiRequest<RespuestaLista<Favorito>>('/yo/favoritos');
  if (!respuesta) {
    throw new Error('La API no devolvió la lista de favoritos.');
  }
  return respuesta.datos.map((favorito) => favorito.lugarId);
}

export async function obtenerFavoritos(): Promise<{ lugares: LugarResumen[] }> {
  const ids = await obtenerIdsFavoritos();
  const lugares = await Promise.all(
    ids.map(async (id) => {
      const respuesta = await apiRequest<RespuestaUno<Lugar>>(
        `/lugares/${encodeURIComponent(id)}`
      );
      if (!respuesta) {
        throw new Error(`La API no devolvió los datos del lugar ${id}.`);
      }
      return respuesta.datos;
    })
  );

  return { lugares };
}

export async function alternarFavorito(
  lugarId: string,
  yaEsFavorito: boolean
): Promise<boolean> {
  const ruta = `/yo/favoritos/${encodeURIComponent(lugarId)}`;
  if (yaEsFavorito) {
    await apiRequest<null>(ruta, { method: 'DELETE' });
    return false;
  }

  const respuesta = await apiRequest<RespuestaUno<Favorito>>(ruta, { method: 'PUT' });
  if (!respuesta) {
    throw new Error('La API no confirmó que se guardó el favorito.');
  }
  return true;
}
