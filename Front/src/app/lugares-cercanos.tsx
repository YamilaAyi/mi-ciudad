import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import TarjetaLugar from "../components/TarjetaLugar";
import { obtenerLugares, usandoCacheLugares } from "../servicios/lugares";
import {
  distanciaEnMetros,
  formatearDistancia,
  obtenerUbicacionActual,
} from "../servicios/ubicacion";
import type { Lugar } from "../tipos/entities";

type LugarCercano = {
  lugar: Lugar;
  distancia: number;
};

const categorias: Record<string, string> = {
  "cat-playas": "Playas",
  "cat-termas": "Termas",
  "cat-museos": "Museos y patrimonio",
  "cat-gastronomia": "Gastronomía",
  "cat-artesanias": "Artesanías",
  "cat-naturaleza": "Naturaleza",
  "cat-alojamiento": "Alojamiento",
  "cat-bodegas": "Bodegas",
};

export default function LugaresCercanosScreen() {
  const [cercanos, setCercanos] = useState<LugarCercano[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrandoCache, setMostrandoCache] = useState(false);

  const cargarLugaresCercanos = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const [ubicacion, lugares] = await Promise.all([
        obtenerUbicacionActual(),
        obtenerLugares(),
      ]);

      const ordenados = lugares
        .filter(
          (lugar) =>
            lugar.activo &&
            Number.isFinite(lugar.coordenadas?.latitud) &&
            Number.isFinite(lugar.coordenadas?.longitud)
        )
        .map((lugar) => ({
          lugar,
          distancia: distanciaEnMetros(
            ubicacion,
            lugar.coordenadas
          ),
        }))
        .sort((a, b) => a.distancia - b.distancia)
        .slice(0, 5);

      setCercanos(ordenados);
      setMostrandoCache(usandoCacheLugares);
    } catch (e) {
      setCercanos([]);
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos obtener los lugares cercanos."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarLugaresCercanos();
  }, [cargarLugaresCercanos]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contenido}
    >

      <Text style={styles.descripcion}>
        Descubrí los cinco lugares turísticos más próximos
        a tu ubicación actual.
      </Text>

      <Pressable
        style={[
          styles.boton,
          cargando && styles.botonDeshabilitado,
        ]}
        onPress={() => void cargarLugaresCercanos()}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>
          {cargando ? "Buscando lugares..." : "Actualizar ubicación"}
        </Text>
      </Pressable>

      {cargando && (
        <ActivityIndicator
          size="large"
          color="#176B87"
          style={styles.indicador}
        />
      )}

      {!cargando && error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {!cargando && !error && mostrandoCache && (
        <Text style={styles.aviso}>
          Estás viendo lugares guardados. Las distancias
          se calcularon con tu ubicación actual.
        </Text>
      )}

      {!cargando && !error && cercanos.length === 0 && (
        <Text style={styles.aviso}>
          No se encontraron lugares turísticos.
        </Text>
      )}

      {!cargando &&
        !error &&
        cercanos.map(({ lugar, distancia }, indice) => (
          <View key={lugar.id} style={styles.tarjeta}>
            <Text style={styles.distancia}>
              {indice + 1}. A {formatearDistancia(distancia)}
              {" "}de tu ubicación
            </Text>

            <TarjetaLugar
              id={lugar.id}
              nombre={lugar.nombre}
              categoria={
                categorias[lugar.categoriaId] ?? "Otros"
              }
              imagen={lugar.imagenes?.[0]}
            />
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#176B87",
    marginBottom: 10,
  },
  descripcion: {
    fontSize: 15,
    color: "#555555",
    marginBottom: 20,
    lineHeight: 22,
  },
  boton: {
    backgroundColor: "#176B87",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBoton: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  indicador: {
    marginTop: 25,
  },
  tarjeta: {
    marginBottom: 20,
  },
  distancia: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#176B87",
    marginBottom: 8,
  },
  error: {
    color: "#C62828",
    fontSize: 15,
    marginTop: 15,
  },
  aviso: {
    color: "#666666",
    marginVertical: 12,
  },
});