import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from 'react-native-maps';

export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mapa turístico</Text>

      <MapView
        style={styles.mapa}
        initialRegion={{
          latitude: -32.2231,
          longitude: -58.1443,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#176B87",
    textAlign: "center",
    padding: 20,
  },
  mapa: {
    flex: 1,
  },
});
