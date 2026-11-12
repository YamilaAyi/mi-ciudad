import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function noHayConexion(state: Network.NetworkState): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}

export function NetworkStatusBanner() {
  const insets = useSafeAreaInsets();
  const [sinConexion, setSinConexion] = useState(false);

  useEffect(() => {
    let activa = true;
    let recibioEvento = false;

    const subscription = Network.addNetworkStateListener((state) => {
      recibioEvento = true;
      if (activa) setSinConexion(noHayConexion(state));
    });

    void Network.getNetworkStateAsync()
      .then((state) => {
        if (activa && !recibioEvento) setSinConexion(noHayConexion(state));
      })
      .catch((error: unknown) => {
        console.warn('No se pudo consultar el estado de la red.', error);
      });

    return () => {
      activa = false;
      subscription.remove();
    };
  }, []);

  if (!sinConexion) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { top: insets.top }]}
      pointerEvents="none"
    >
      <Text style={styles.text}>Sin conexión a internet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#B42318',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
