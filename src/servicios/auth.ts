import type { Usuario } from '../tipos/entities';
import { apiRequest, ApiError } from './api';
import {
  borrarTokenSesion,
  guardarTokenSesion,
  obtenerTokenSesion,
} from './almacen-sesion';
import { borrarCache, guardarCache } from './baseLocal';

interface RespuestaUno<T> {
  datos: T;
  meta: null;
}

interface Sesion {
  token: string;
  usuario: Usuario;
}

export async function ingresar(email: string, contrasena: string): Promise<Usuario> {
  const respuesta = await apiRequest<RespuestaUno<Sesion>>('/auth/ingreso', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), contrasena }),
  });

  if (!respuesta) {
    throw new Error('La API no devolvió los datos de la sesión.');
  }

  await guardarTokenSesion(respuesta.datos.token);
  await guardarCache('usuarioId', respuesta.datos.usuario.id);
  return respuesta.datos.usuario;
}

export async function registrar(
  nombre: string,
  email: string,
  contrasena: string
): Promise<Usuario> {
  const respuesta = await apiRequest<RespuestaUno<Sesion>>('/auth/registro', {
    method: 'POST',
    body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), contrasena }),
  });

  if (!respuesta) {
    throw new Error('La API no devolvió los datos de la sesión.');
  }

  await guardarTokenSesion(respuesta.datos.token);
  await guardarCache('usuarioId', respuesta.datos.usuario.id);
  return respuesta.datos.usuario;
}

export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  if (!(await obtenerTokenSesion())) {
    return null;
  }

  try {
    const respuesta = await apiRequest<RespuestaUno<Usuario>>('/yo');
    if (!respuesta) {
      throw new Error('La API no devolvió los datos del usuario.');
    }
    return respuesta.datos;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await borrarTokenSesion();
      return null;
    }
    throw error;
  }
}

export async function cerrarSesion(): Promise<void> {
  await borrarTokenSesion();
  await borrarCache('usuarioId');
}
