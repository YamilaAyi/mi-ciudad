import axios from 'axios';
import { URL_API } from '../config/api';
import { borrarTokenSesion, obtenerTokenSesion } from './almacen-sesion';

// "codigo" es el de la API (por ejemplo "NO_AUTENTICADO") o "SIN_CONEXION"
// si el teléfono no pudo llegar al servidor.
export class ErrorApi extends Error {
  codigo: string;
  estado: number;

  constructor(codigo: string, mensaje: string, estado: number) {
    super(mensaje);
    this.codigo = codigo;
    this.estado = estado;
  }
}

// Un único cliente para toda la app.
export const clienteHttp = axios.create({
  baseURL: URL_API,
  timeout: 8000, // si no responde en 8 segundos (señal débil), se corta
});

// Antes de cada pedido: agrega el token de sesión, si hay.
clienteHttp.interceptors.request.use(async (config) => {
  const token = await obtenerTokenSesion();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

function aErrorApi(error: unknown): ErrorApi {
  if (axios.isAxiosError(error)) {
    // Sin respuesta: sin señal, tiempo agotado, API apagada o IP incorrecta.
    if (!error.response) {
      console.log('Fallo de red:', error.config?.url, '->', error.message);
      return new ErrorApi('SIN_CONEXION', 'No pudimos conectarnos. Revisá tu conexión.', 0);
    }
    const cuerpo = error.response.data?.error;
    return new ErrorApi(
      cuerpo?.codigo ?? 'ERROR_DESCONOCIDO',
      cuerpo?.mensaje ?? 'Algo salió mal. Probá de nuevo.',
      error.response.status
    );
  }
  return new ErrorApi('ERROR_DESCONOCIDO', 'Algo salió mal. Probá de nuevo.', 0);
}

// Después de cada pedido: traduce los errores y, si la sesión venció, la borra.
clienteHttp.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const errorApi = aErrorApi(error);
    if (errorApi.estado === 401 && errorApi.codigo === 'NO_AUTENTICADO') {
      await borrarTokenSesion();
    }
    return Promise.reject(errorApi);
  }
);

export async function pedir<T>(
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown } = {}
): Promise<T> {
  const respuesta = await clienteHttp.request<T>({
    url: ruta,
    method: opciones.metodo ?? 'GET',
    data: opciones.cuerpo,
  });
  if (respuesta.status === 204) return null as T;
  return respuesta.data;
}