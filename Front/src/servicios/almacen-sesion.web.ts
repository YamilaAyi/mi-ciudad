// En web se usa localStorage; el ingreso biométrico está disponible solo en dispositivos.
const TOKEN_KEY = 'mi-ciudad-token';
const TOKEN_RECORDADO_KEY = 'mi-ciudad-token-recordado';
const TOKEN_ANTERIOR_KEY = 'token-sesion';

export async function obtenerTokenSesion(): Promise<string | null> {
  globalThis.localStorage.removeItem(TOKEN_ANTERIOR_KEY);
  return globalThis.localStorage.getItem(TOKEN_KEY);
}

export async function guardarTokenSesion(token: string | null): Promise<void> {
  globalThis.localStorage.removeItem(TOKEN_ANTERIOR_KEY);
  if (token) {
    globalThis.localStorage.setItem(TOKEN_KEY, token);
  } else {
    globalThis.localStorage.removeItem(TOKEN_KEY);
  }
}

export async function borrarTokenSesion(): Promise<void> {
  globalThis.localStorage.removeItem(TOKEN_ANTERIOR_KEY);
  globalThis.localStorage.removeItem(TOKEN_KEY);
}

export async function obtenerTokenRecordado(): Promise<string | null> {
  globalThis.localStorage.removeItem(TOKEN_ANTERIOR_KEY);
  return globalThis.localStorage.getItem(TOKEN_RECORDADO_KEY);
}

export async function guardarTokenRecordado(token: string): Promise<void> {
  globalThis.localStorage.removeItem(TOKEN_ANTERIOR_KEY);
  globalThis.localStorage.setItem(TOKEN_RECORDADO_KEY, token);
}

export async function borrarTokenRecordado(): Promise<void> {
  globalThis.localStorage.removeItem(TOKEN_ANTERIOR_KEY);
  globalThis.localStorage.removeItem(TOKEN_RECORDADO_KEY);
}
