import Constants from 'expo-constants';


function calcularUrlApi(): string {
  const urlManual = process.env.EXPO_PUBLIC_API_URL;
  if (urlManual) return urlManual;

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:3000`;

  return 'http://localhost:3000';
}

export const URL_API = calcularUrlApi();