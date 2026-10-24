import * as SecureStore from 'expo-secure-store';
import { URL_API } from '../config/api';

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

const CLAVE_TOKEN = 'token-sesion';
const TIEMPO_LIMITE_MS = 8000;

let token: string | null = null;
let alVencerSesion: (() => void) | null = null;

// Para que sesion.ts se entere cuando la API dice que la sesión venció.
export function registrarAlVencerSesion(funcion: () => void) {
  alVencerSesion = funcion;
}

// Guarda el token en memoria y, cifrado, en el teléfono. Con null, lo borra.
export async function guardarToken(nuevo: string | null): Promise<void> {
  token = nuevo;
  try {
    if (nuevo) {
      await SecureStore.setItemAsync(CLAVE_TOKEN, nuevo);
    } else {
      await SecureStore.deleteItemAsync(CLAVE_TOKEN);
    }
  } catch (e) {
    console.log('No se pudo guardar el token en el teléfono:', e);
  }
}

// Lee el token guardado la última vez (por ejemplo, al abrir la app de nuevo).
export async function cargarTokenGuardado(): Promise<string | null> {
  if (token) return token;
  try {
    token = await SecureStore.getItemAsync(CLAVE_TOKEN);
  } catch {
    token = null;
  }
  return token;
}

export function obtenerToken(): string | null {
  return token;
}

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
   } catch (e) {
    // No hubo respuesta: sin señal, tiempo agotado, API apagada o IP incorrecta.
    console.log('Fallo de red al llamar a', url, '->', e);
    throw new ErrorApi('SIN_CONEXION', 'No pudimos conectarnos. Revisá tu conexión.', 0);
  }
}

export async function pedir<T>(
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opciones.cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const respuesta = await fetchConTiempoLimite(`${URL_API}${ruta}`, {
    method: opciones.metodo ?? 'GET',
    headers,
    body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
  });

  // 204 = respuesta sin cuerpo (por ejemplo, al borrar algo)
  if (respuesta.status === 204) return null as T;

  let contenido: any = null;
  try {
    contenido = await respuesta.json();
  } catch {
    // la respuesta no era JSON
  }

  if (!respuesta.ok) {
    const error = contenido?.error;

    // La sesión venció (el token dura 30 días): se borra y se avisa.
    if (respuesta.status === 401 && error?.codigo === 'NO_AUTENTICADO' && token) {
      await guardarToken(null);
      alVencerSesion?.();
    }

    throw new ErrorApi(
      error?.codigo ?? 'ERROR_DESCONOCIDO',
      error?.mensaje ?? 'Algo salió mal. Probá de nuevo.',
      respuesta.status
    );
  }

  return contenido as T;
}