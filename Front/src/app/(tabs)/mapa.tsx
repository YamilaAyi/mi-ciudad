import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { obtenerLugares } from "../../servicios/lugares";
import type { Lugar } from "../../tipos/entities";
import { router } from "expo-router";

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

      <Pressable
        style={styles.botonCercanos}
        onPress={() => router.push("/lugares-cercanos")}
      >
        <Text style={styles.textoBotonCercanos}>
          Ver lugares cercanos
        </Text>
      </Pressable>

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
  botonCercanos: {
    backgroundColor: "#176B87",
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  textoBotonCercanos: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
