import { URL_API } from '../config/api';
import { borrarTokenSesion, obtenerTokenSesion } from './almacen-sesion';

const API_BASE_URL = URL_API.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly codigo: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function leerError(payload: unknown): { codigo: string; mensaje: string } | null {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) {
    return null;
  }

  const error = payload.error;
  if (
    typeof error !== 'object' ||
    error === null ||
    !('mensaje' in error) ||
    typeof error.mensaje !== 'string'
  ) {
    return null;
  }

  return {
    codigo: 'codigo' in error && typeof error.codigo === 'string' ? error.codigo : 'ERROR_API',
    mensaje: error.mensaje,
  };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = await obtenerTokenSesion();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    const detalle = error instanceof Error ? `: ${error.message}` : '';
    throw new Error(
      `No se pudo conectar con la API (${API_BASE_URL})${detalle}. Verificá que esté encendida y que la URL sea accesible desde este dispositivo.`
    );
  }

  if (response.status === 204) {
    return null;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`La API devolvió una respuesta inválida (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      await borrarTokenSesion();
    }

    const apiError = leerError(payload);
    throw new ApiError(
      apiError?.mensaje ?? `La API respondió con el estado ${response.status}.`,
      response.status,
      apiError?.codigo ?? 'ERROR_API'
    );
  }

  return payload as T;
}
