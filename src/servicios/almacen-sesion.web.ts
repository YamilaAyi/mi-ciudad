const TOKEN_KEY = 'mi-ciudad-token';

export async function obtenerTokenSesion(): Promise<string | null> {
  return globalThis.localStorage.getItem(TOKEN_KEY);
}

export async function guardarTokenSesion(token: string): Promise<void> {
  globalThis.localStorage.setItem(TOKEN_KEY, token);
}

export async function borrarTokenSesion(): Promise<void> {
  globalThis.localStorage.removeItem(TOKEN_KEY);
}
