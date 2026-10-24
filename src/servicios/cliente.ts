import { URL_API } from '../config/api';
import { borrarTokenSesion, obtenerTokenSesion } from './almacen-sesion';

// Error que lanza el cliente. "codigo" es el de la API (por ejemplo "NO_AUTENTICADO")
// o "SIN_CONEXION" si el teléfono no pudo llegar al servidor.
export class ErrorApi extends Error {
  codigo: string;
  estado: number;

  constructor(codigo: string, mensaje: string, estado: number) {
    super(mensaje);
    this.codigo = codigo;
    this.estado = estado;
  }
}

const TIEMPO_LIMITE_MS = 8000;

// Hace un fetch que se corta si el servidor no responde a tiempo (señal débil).
// Si se corta, lanza un ErrorApi SIN_CONEXION.
export async function fetchConTiempoLimite(
  url: string,
  opciones: RequestInit,
  milisegundos: number = TIEMPO_LIMITE_MS
): Promise<Response> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), milisegundos);
  try {
    return await fetch(url, { ...opciones, signal: controlador.signal });
  } catch (error) {
    console.log('Fallo de red al llamar a', url, '->', error);
    throw new ErrorApi('SIN_CONEXION', 'No pudimos conectarnos. Revisá tu conexión.', 0);
  } finally {
    clearTimeout(temporizador);
  }
}

export async function pedir<T>(
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opciones.cuerpo !== undefined) headers['Content-Type'] = 'application/json';

  const token = await obtenerTokenSesion();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const respuesta = await fetchConTiempoLimite(`${URL_API}${ruta}`, {
    method: opciones.metodo ?? 'GET',
    headers,
    body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
  });

  if (respuesta.status === 204) return null as T;

  let contenido: unknown = null;
  try {
    contenido = await respuesta.json();
  } catch {
    // La respuesta no era JSON.
  }

  if (!respuesta.ok) {
    const payloadError =
      typeof contenido === 'object' && contenido !== null && 'error' in contenido
        ? contenido.error
        : null;
    const error =
      typeof payloadError === 'object' && payloadError !== null ? payloadError : null;
    const codigo =
      error && 'codigo' in error && typeof error.codigo === 'string'
        ? error.codigo
        : 'ERROR_DESCONOCIDO';
    const mensaje =
      error && 'mensaje' in error && typeof error.mensaje === 'string'
        ? error.mensaje
        : 'Algo salió mal. Probá de nuevo.';

    if (respuesta.status === 401 && codigo === 'NO_AUTENTICADO' && token) {
      await borrarTokenSesion();
    }

    throw new ErrorApi(codigo, mensaje, respuesta.status);
  }

  return contenido as T;
}
