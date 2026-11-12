import Constants from 'expo-constants';
import { Platform } from 'react-native';

function calcularUrlApi(): string {
  const urlManual = process.env.EXPO_PUBLIC_API_URL;
  if (urlManual) return urlManual;

  // Android Emulator: esta dirección apunta a la Mac anfitriona.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:3000`;

  return 'http://localhost:3000';
}

export const URL_API = calcularUrlApi();
