import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { obtenerLugares } from "../../servicios/lugares";
import {
  obtenerUbicacionActual,
  distanciaEnMetros,
  formatearDistancia,
} from "../../servicios/ubicacion";
import type { Coordenadas, Lugar } from "../../tipos/entities";

const CATEGORIAS = [
  { id: "Todas", nombre: "Todas" },
  { id: "cat-playas", nombre: "Playas" },
  { id: "cat-termas", nombre: "Termas" },
  { id: "cat-museos", nombre: "Museos y patrimonio" },
  { id: "cat-gastronomia", nombre: "Gastronomía" },
  { id: "cat-artesanias", nombre: "Artesanías" },
  { id: "cat-naturaleza", nombre: "Naturaleza" },
  { id: "cat-alojamiento", nombre: "Alojamiento" },
  { id: "cat-bodegas", nombre: "Bodegas" },
];

export default function MapaScreen() {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Todas");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [lugarSeleccionado, setLugarSeleccionado] =
    useState<Lugar | null>(null);
  const [calculandoDistancia, setCalculandoDistancia] = useState(false);

  const mapaRef = useRef<MapView>(null);

  // Cargar los lugares desde la API.
  useEffect(() => {
    async function cargarLugares() {
      try {
        const datos = await obtenerLugares();
        setLugares(datos);
        console.log("MAPA - Lugares recibidos:", datos.length);
      } catch (error) {
        console.error("Error al cargar lugares del mapa:", error);
      }
    }

    void cargarLugares();
  }, []);

  // Filtrar marcadores por categoría.
  const lugaresVisibles = lugares.filter(
    (lugar) =>
      lugar.activo &&
      Number.isFinite(lugar.coordenadas?.latitud) &&
      Number.isFinite(lugar.coordenadas?.longitud) &&
      (categoriaSeleccionada === "Todas" ||
        lugar.categoriaId === categoriaSeleccionada)
  );

  // Centrar el mapa en la ubicación del usuario.
  async function centrarEnMiUbicacion() {
    try {
      const coordenadas = await obtenerUbicacionActual();
      setUbicacion(coordenadas);

      mapaRef.current?.animateToRegion(
        {
          latitude: coordenadas.latitud,
          longitude: coordenadas.longitud,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        700
      );
    } catch (error) {
      Alert.alert(
        "Ubicación no disponible",
        error instanceof Error
          ? error.message
          : "No pudimos obtener tu ubicación actual."
      );
    }
  }

  // Volver al mapa turístico de Colón.
  function volverAColon() {
    setMostrarFiltros(false);
    setCategoriaSeleccionada("Todas");
    setLugarSeleccionado(null);

    mapaRef.current?.animateToRegion(
      {
        latitude: -32.2231,
        longitude: -58.1443,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      700
    );
  }

  // Seleccionar un marcador y calcular su distancia.
  async function seleccionarLugar(lugar: Lugar) {
    setLugarSeleccionado(lugar);
    setMostrarFiltros(false);

    if (ubicacion !== null) return;

    setCalculandoDistancia(true);

    try {
      const coordenadas = await obtenerUbicacionActual();
      setUbicacion(coordenadas);
    } catch {
      // El lugar se puede consultar aunque no haya permiso de GPS.
    } finally {
      setCalculandoDistancia(false);
    }
  }

  // Abrir la pantalla de detalle que ya tiene el proyecto.
  function abrirDetalle(lugar: Lugar) {
    router.push({
      pathname: "/detalle",
      params: { id: lugar.id },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.titulo}>Mapa turístico</Text>

      <View style={styles.mapaContenedor}>
        <MapView
          ref={mapaRef}
          provider={PROVIDER_GOOGLE}
          style={styles.mapa}
          showsUserLocation={ubicacion !== null}
          showsMyLocationButton={false}
          initialRegion={{
            latitude: -32.2231,
            longitude: -58.1443,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {lugaresVisibles.map((lugar) => (
            <Marker
              key={lugar.id}
              coordinate={{
                latitude: lugar.coordenadas.latitud,
                longitude: lugar.coordenadas.longitud,
              }}
              title={lugar.nombre}
              description={lugar.descripcionCorta}
              onPress={() => void seleccionarLugar(lugar)}
            />
          ))}
        </MapView>

        {/* Controles flotantes */}
        <View style={styles.controles}>
          <Pressable
            style={styles.botonCercanos}
            onPress={() => router.push("/lugares-cercanos")}
            accessibilityRole="button"
            accessibilityLabel="Ver lugares cercanos"
          >
            <Ionicons
              name="location-outline"
              size={19}
              color="#176B87"
            />
            <Text style={styles.textoCercanos}>
              Lugares cercanos
            </Text>
          </Pressable>

          <View style={styles.controlesDerecha}>
            <Pressable
              style={[
                styles.botonIcono,
                categoriaSeleccionada !== "Todas" &&
                  styles.botonFiltroActivo,
              ]}
              onPress={() => setMostrarFiltros(!mostrarFiltros)}
              accessibilityRole="button"
              accessibilityLabel="Filtrar lugares por categoría"
            >
              <Ionicons
                name="options-outline"
                size={23}
                color={
                  categoriaSeleccionada !== "Todas"
                    ? "#FFFFFF"
                    : "#176B87"
                }
              />
            </Pressable>

            {/* Botón para regresar a Colón */}
            {!mostrarFiltros && (
              <Pressable
                style={styles.botonVolverColon}
                onPress={volverAColon}
                accessibilityRole="button"
                accessibilityLabel="Volver al mapa turístico de Colón"
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color="#176B87"
                />
                <Text style={styles.textoVolverColon}>
                  Colón
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.botonIcono}
              onPress={() => void centrarEnMiUbicacion()}
              accessibilityRole="button"
              accessibilityLabel="Centrar mapa en mi ubicación"
            >
              <Ionicons
                name="locate"
                size={24}
                color="#176B87"
              />
            </Pressable>
          </View>
        </View>

        {/* Filtros por categoría */}
        {mostrarFiltros && (
          <View style={styles.panelFiltros}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listaFiltros}
            >
              {CATEGORIAS.map((categoria) => {
                const seleccionada =
                  categoriaSeleccionada === categoria.id;

                return (
                  <Pressable
                    key={categoria.id}
                    style={[
                      styles.filtro,
                      seleccionada && styles.filtroSeleccionado,
                    ]}
                    onPress={() => {
                      setCategoriaSeleccionada(categoria.id);
                      setLugarSeleccionado(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.textoFiltro,
                        seleccionada && styles.textoFiltroSeleccionado,
                      ]}
                    >
                      {categoria.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.contador}>
              Mostrando {lugaresVisibles.length} lugares turísticos
            </Text>
          </View>
        )}

        {/* Tarjeta del lugar seleccionado */}
        {lugarSeleccionado && (
          <View style={styles.tarjetaLugar}>
            <View style={styles.encabezadoTarjeta}>
              <Text style={styles.nombreLugar}>
                {lugarSeleccionado.nombre}
              </Text>

              <Pressable
                onPress={() => setLugarSeleccionado(null)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar información del lugar"
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#666666"
                />
              </Pressable>
            </View>

            <Text style={styles.descripcionLugar}>
              {lugarSeleccionado.descripcionCorta}
            </Text>

            {ubicacion ? (
              <View style={styles.filaDistancia}>
                <Ionicons
                  name="navigate-outline"
                  size={17}
                  color="#176B87"
                />
                <Text style={styles.distancia}>
                  A{" "}
                  {formatearDistancia(
                    distanciaEnMetros(
                      ubicacion,
                      lugarSeleccionado.coordenadas
                    )
                  )}{" "}
                  de tu ubicación
                </Text>
              </View>
            ) : (
              <Text style={styles.avisoDistancia}>
                {calculandoDistancia
                  ? "Calculando distancia..."
                  : "Activá el GPS para conocer la distancia."}
              </Text>
            )}

            <Pressable
              style={styles.botonDetalle}
              onPress={() => abrirDetalle(lugarSeleccionado)}
              accessibilityRole="button"
              accessibilityLabel={`Ver detalle de ${lugarSeleccionado.nombre}`}
            >
              <Text style={styles.textoBotonDetalle}>
                Ver detalle
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
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
    paddingVertical: 15,
  },
  mapaContenedor: {
    flex: 1,
  },
  mapa: {
    flex: 1,
  },
  controles: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  controlesDerecha: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 10,
  },
  botonCercanos: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
  },
  textoCercanos: {
    color: "#176B87",
    fontWeight: "bold",
    fontSize: 13,
  },
  botonIcono: {
    backgroundColor: "#FFFFFF",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  botonVolverColon: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 20,
    elevation: 4,
  },
  textoVolverColon: {
    color: "#176B87",
    fontWeight: "bold",
    fontSize: 12,
  },
  botonFiltroActivo: {
    backgroundColor: "#176B87",
  },
  panelFiltros: {
    position: "absolute",
    top: 70,
    left: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 14,
    elevation: 4,
  },
  listaFiltros: {
    gap: 8,
    paddingVertical: 4,
  },
  filtro: {
    backgroundColor: "#F0F7FA",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
  },
  filtroSeleccionado: {
    backgroundColor: "#176B87",
  },
  textoFiltro: {
    color: "#176B87",
    fontSize: 13,
    fontWeight: "500",
  },
  textoFiltroSeleccionado: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  contador: {
    color: "#666666",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },

  // Tarjeta flotante del marcador seleccionado.
  tarjetaLugar: {
    position: "absolute",
    bottom: 18,
    left: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    elevation: 6,
  },
  encabezadoTarjeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  nombreLugar: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#176B87",
  },
  descripcionLugar: {
    fontSize: 14,
    color: "#555555",
    marginTop: 8,
    lineHeight: 20,
  },
  filaDistancia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  distancia: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#176B87",
  },
  avisoDistancia: {
    fontSize: 13,
    color: "#666666",
    marginTop: 10,
  },
  botonDetalle: {
    backgroundColor: "#176B87",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14,
  },
  textoBotonDetalle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});
