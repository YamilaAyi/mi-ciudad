import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'mi-ciudad-token';
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
