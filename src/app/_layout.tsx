import { DarkTheme, DefaultTheme, ThemeProvider , Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';


SplashScreen.preventAutoHideAsync();

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
</Stack>
    </ThemeProvider>
  );
}
 