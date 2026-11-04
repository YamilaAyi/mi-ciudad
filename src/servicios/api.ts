import { clienteHttp, ErrorApi } from './cliente';

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

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: string } = {}
): Promise<T | null> {
  try {
    const respuesta = await clienteHttp.request<T>({
      url: path,
      method: options.method ?? 'GET',
      data: options.body ? JSON.parse(options.body) : undefined,
    });
    if (respuesta.status === 204) return null;
    return respuesta.data;
  } catch (e) {
    if (e instanceof ErrorApi) throw new ApiError(e.message, e.estado, e.codigo);
    throw e;
  }
}