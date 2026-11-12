import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiRequest } from './api';

export async function registrarDispositivoPush(): Promise<void> {
  try {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn('No se encontró el ID del proyecto EAS.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(
        'expo_notifications_fallback_notification_channel',
        {
          name: 'Notificaciones',
          importance: Notifications.AndroidImportance.MAX,
        }
      );
    }

    let permisos = await Notifications.getPermissionsAsync();

    if (!permisos.granted) {
      permisos = await Notifications.requestPermissionsAsync();
    }

    if (!permisos.granted) {
      console.log('El usuario no autorizó las notificaciones push.');
      return;
    }

    const respuesta = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    await apiRequest('/dispositivos', {
      method: 'POST',
      body: JSON.stringify({
        tokenExpo: respuesta.data,
        plataforma: Platform.OS,
      }),
    });

    console.log('Dispositivo registrado para notificaciones push.');
  } catch (error) {
    console.warn('No se pudo registrar el dispositivo push:', error);
  }
}
