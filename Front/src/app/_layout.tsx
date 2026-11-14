import { useEffect, useRef } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AppState, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import {
  obtenerEventoActualizado,
  obtenerEventosGuardados,
  usandoCacheEventosGuardados,
} from '@/servicios/eventos';
import {
  cancelarAvisoEvento,
  programarAvisoEvento,
  sincronizarAvisosEventos,
} from '@/servicios/notificaciones-eventos';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const respuestaNotificacion = Notifications.useLastNotificationResponse();
  const respuestaProcesada = useRef<string | null>(null);

  // Al tocar un aviso (push del servidor o recordatorio local) se abre el evento.
  useEffect(() => {
    if (!respuestaNotificacion) return;
    if (
      respuestaNotificacion.actionIdentifier !==
      Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }

    // Cada toque se atiende una sola vez, aunque el efecto se vuelva a ejecutar.
    const idRespuesta = respuestaNotificacion.notification.request.identifier;
    if (respuestaProcesada.current === idRespuesta) return;
    respuestaProcesada.current = idRespuesta;

    const eventoId =
      respuestaNotificacion.notification.request.content.data?.eventoId;

    if (typeof eventoId === 'string' && eventoId.trim()) {
      try {
        router.push({ pathname: '/evento/[id]', params: { id: eventoId } });
      } catch (error) {
        console.warn('No se pudo abrir el evento de la notificación:', error);
      }
    }

    // Se limpia la respuesta para que no vuelva a abrirse al remontar el layout.
    try {
      Notifications.clearLastNotificationResponse();
    } catch (error) {
      console.warn('No se pudo limpiar la respuesta de la notificación:', error);
    }
  }, [respuestaNotificacion, router]);


  // Actualiza los recordatorios al recibir cambios de estado por push.
  useEffect(() => {
    const procesarPushEvento = async (notificacion: Notifications.Notification) => {
      const datos = notificacion.request.content.data;
      const eventoId = datos?.eventoId;
      const estado = datos?.estado;

      if (datos?.tipo !== 'evento-estado' ||
          typeof eventoId !== 'string' ||
          typeof estado !== 'string') return;

      await cancelarAvisoEvento(eventoId);
      if (estado !== 'programado') return;

      try {
        const guardados = await obtenerEventosGuardados();
        if (usandoCacheEventosGuardados ||
            !guardados.some((evento) => evento.id === eventoId)) return;

        const evento = await obtenerEventoActualizado(eventoId);
        if (evento.estado === 'programado') {
          await programarAvisoEvento(evento);
        }
      } catch (error) {
        console.warn('No se pudo actualizar el recordatorio:', error);
      }
    };

    const suscripcionPush =
      Notifications.addNotificationReceivedListener((notificacion) => {
        void procesarPushEvento(notificacion);
      });

    const suscripcionApp = AppState.addEventListener('change', async (estado) => {
      if (estado !== 'active') return;
      try {
        const guardados = await obtenerEventosGuardados();
        if (!usandoCacheEventosGuardados) {
          await sincronizarAvisosEventos(guardados);
        }
      } catch (error) {
        console.warn('No se pudieron sincronizar los recordatorios:', error);
      }
    });

    return () => {
      suscripcionPush.remove();
      suscripcionApp.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />

        <Stack.Screen
          name="lugares"
          options={{
            title: 'Lugares turísticos',
            headerShown: true,
            headerTitleStyle: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#176B87',
            },
          }}
        />
        <Stack.Screen
          name="lugares-cercanos"
          options={{
            title: "Lugares cercanos",
            headerShown: true,
            headerTitleStyle: {
              fontSize: 24,
              fontWeight: "bold",
              color: "#176B87",
            },
          }}
        />
        <Stack.Screen
          name="detalle"
          options={{
            title: 'Detalle del lugar',
            headerShown: true,
            headerTitleStyle: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#176B87',
            },
          }}
        />
        <Stack.Screen
          name="audioguia"
          options={{
            title: 'Audioguía',
            headerShown: true,
            headerTitleStyle: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#176B87',
            },
          }}
        />

        <Stack.Screen
          name="evento/[id]"
          options={{ title: 'Detalle del evento' }}
        />

        <Stack.Screen name="visita/[id]" options={{ title: 'Detalle de la visita' }} />
        <Stack.Screen name="registrar-visita" options={{ title: 'Registrar visita' }} />
        <Stack.Screen name="escanear-qr" options={{ title: 'Escanear QR' }} />
      </Stack>
      <NetworkStatusBanner />
    </ThemeProvider>
  );
}