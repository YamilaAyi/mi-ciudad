import * as SecureStore from 'expo-secure-store';

// SecureStore cifra estos tokens en el dispositivo; ninguno contiene la contraseña.
const TOKEN_KEY = 'mi-ciudad-token';
const TOKEN_RECORDADO_KEY = 'mi-ciudad-token-recordado';
const TOKEN_ANTERIOR_KEY = 'token-sesion';
let limpiarTokenAnterior: Promise<void> | null = null;

function limpiarTokenAnteriorGuardado(): Promise<void> {
  if (!limpiarTokenAnterior) {
    limpiarTokenAnterior = SecureStore.deleteItemAsync(TOKEN_ANTERIOR_KEY);
  }
  return limpiarTokenAnterior;
}

export async function obtenerTokenSesion(): Promise<string | null> {
  await limpiarTokenAnteriorGuardado();
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function guardarTokenSesion(token: string | null): Promise<void> {
  await limpiarTokenAnteriorGuardado();
  return token
    ? SecureStore.setItemAsync(TOKEN_KEY, token)
    : SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function borrarTokenSesion(): Promise<void> {
  await limpiarTokenAnteriorGuardado();
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function obtenerTokenRecordado(): Promise<string | null> {
  await limpiarTokenAnteriorGuardado();
  return SecureStore.getItemAsync(TOKEN_RECORDADO_KEY);
}

export async function guardarTokenRecordado(token: string): Promise<void> {
  await limpiarTokenAnteriorGuardado();
  await SecureStore.setItemAsync(TOKEN_RECORDADO_KEY, token);
}

export async function borrarTokenRecordado(): Promise<void> {
  await limpiarTokenAnteriorGuardado();
  await SecureStore.deleteItemAsync(TOKEN_RECORDADO_KEY);
}
