import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'mi-ciudad-token';

export function obtenerTokenSesion(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function guardarTokenSesion(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function borrarTokenSesion(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
