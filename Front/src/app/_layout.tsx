import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
          name="evento/[id]"
          options={{ title: 'Detalle del evento' }}
        />

        <Stack.Screen name="visita/[id]" options={{ title: 'Detalle de la visita' }} />
        <Stack.Screen name="registrar-visita" options={{ title: 'Registrar visita' }} />
        <Stack.Screen name="escanear-qr" options={{ title: 'Escanear QR' }} />
      </Stack>
    </ThemeProvider>
  );
}
