import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { obtenerLugares } from "../../servicios/lugares";
import type { Lugar } from "../../tipos/entities";

export default function MapaScreen() {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  useEffect(() => {
    async function cargarLugares() {
      try {
        const datos = await obtenerLugares();
        console.log("MAPA - Lugares recibidos:", datos.length);
        setLugares(datos);
      } catch (error) {
        console.error("Error al cargar lugares del mapa:", error);
      }
    }

    cargarLugares();
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mapa turístico</Text>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.mapa}
        initialRegion={{
          latitude: -32.2231,
          longitude: -58.1443,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{
            latitude: -32.2231,
            longitude: -58.1443,
          }}
          title="Marcador de prueba"
        />

        {lugares.map((lugar) => (
          <Marker
            key={lugar.id}
            coordinate={{
              latitude: lugar.coordenadas.latitud,
              longitude: lugar.coordenadas.longitud,
            }}
            title={lugar.nombre}
            description={lugar.descripcionCorta}
          />
        ))}
      </MapView>
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
