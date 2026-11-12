import { useEffect, useState, useRef } from "react";
import {
  useAudioPlayer,
  setAudioModeAsync,
  useAudioPlayerStatus,
} from "expo-audio";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Network from "expo-network";

import { obtenerLugarDesdeCache } from "../servicios/lugares";
import { obtenerAudioLocal, buscarAudioLocal } from "../servicios/audioguias";
import type { Lugar } from "../tipos/entities";

export default function AudioguiaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = useAudioPlayer(null);
  const estadoAudio = useAudioPlayerStatus(player);

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [descargando, setDescargando] = useState(false);
  const [audioLocalUri, setAudioLocalUri] = useState<string | null>(null);
  const [mensajeDescarga, setMensajeDescarga] = useState<string | null>(null);
  const [anchoBarra, setAnchoBarra] = useState(0);
  const [hayInternet, setHayInternet] = useState(true);
  const [verificandoConexion, setVerificandoConexion] = useState(true);
  const posicionGuardada = useRef(0);
  const urlCargada = useRef<string | null>(null);
  const conexionAnterior = useRef<boolean | null>(null);

  const puedeReproducir = !!audioLocalUri || hayInternet;

  useEffect(() => {
    let activo = true;

    async function comprobarConexion() {
      try {
        const estado = await Network.getNetworkStateAsync();

        if (!activo) return;

        setHayInternet(
          estado.isConnected === true && estado.isInternetReachable !== false,
        );
      } catch (error) {
        console.error("Error al comprobar conexión:", error);
        if (activo) {
          setHayInternet(false);
        }
      } finally {
        if (activo) {
          setVerificandoConexion(false);
        }
      }
    }

    void comprobarConexion();

    const suscripcion = Network.addNetworkStateListener((estado) => {
      setHayInternet(
        estado.isConnected === true && estado.isInternetReachable !== false,
      );
      setVerificandoConexion(false);
    });

    return () => {
      activo = false;
      suscripcion.remove();
    };
  }, []);

  useEffect(() => {
    let activo = true;

    async function cargarLugar() {
      try {
        const encontrado = await obtenerLugarDesdeCache(id);

        if (!activo) return;

        if (encontrado) {
          setLugar(encontrado);
        } else {
          setError("No se encontró el lugar turístico.");
        }
      } catch {
        if (activo) {
          setError("No se pudo cargar la información.");
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargarLugar();

    return () => {
      activo = false;
    };
  }, [id]);

  useEffect(() => {
    let activo = true;

    async function gestionarAudioguia() {
      if (!lugar?.audioguia || verificandoConexion) return;

      const url = lugar.audioguia.url;
      const audioGuardado = buscarAudioLocal(url);

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "doNotMix",
        });

        if (!activo) return;

        // Si existe una copia local, utilizarla sin depender de Internet.
        if (audioGuardado) {
          if (urlCargada.current !== audioGuardado) {
            player.replace(audioGuardado);
            urlCargada.current = audioGuardado;
            player.play();
          }

          conexionAnterior.current = hayInternet;
          return;
        }

        // Si no está descargada y se pierde Internet, guardar la posición.
        if (!hayInternet) {
          if (urlCargada.current === url) {
            posicionGuardada.current = estadoAudio.currentTime;
            player.pause();
          }

          conexionAnterior.current = false;
          return;
        }

        // Primera reproducción por streaming.
        if (urlCargada.current !== url) {
          player.replace(url);
          urlCargada.current = url;
          posicionGuardada.current = 0;
          player.play();
        }
        // Recuperación de conexión: volver a cargar y recuperar la posición.
        else if (conexionAnterior.current === false) {
          player.replace(url);

          await player.seekTo(posicionGuardada.current);

          if (!activo) return;

          player.play();
        }

        conexionAnterior.current = true;
      } catch (error) {
        console.error("Error al gestionar audioguía:", error);
      }
    }

    void gestionarAudioguia();

    return () => {
      activo = false;
    };
  }, [lugar, player, hayInternet, verificandoConexion]);

  useEffect(() => {
    if (!lugar?.audioguia) return;

    const audioGuardado = buscarAudioLocal(lugar.audioguia.url);

    setAudioLocalUri(audioGuardado);
  }, [lugar]);

  useEffect(() => {
    if (audioLocalUri) {
      setMensajeDescarga("Audioguía disponible sin conexión.");
    } else if (hayInternet) {
      setMensajeDescarga(null);
    } else {
      setMensajeDescarga(
        "Esta audioguía no está descargada. Conectate a Internet para escucharla.",
      );
    }
  }, [hayInternet, audioLocalUri]);

  async function descargarAudioguia() {
    if (!lugar?.audioguia || descargando || audioLocalUri) return;

    if (!hayInternet) {
      setMensajeDescarga(
        "Necesitás conexión a Internet para descargar esta audioguía.",
      );
      return;
    }
    try {
      setDescargando(true);
      setMensajeDescarga("Descargando audioguía...");

      const uri = await obtenerAudioLocal(lugar.audioguia.url);

      setAudioLocalUri(uri);
      setMensajeDescarga("Audioguía disponible sin conexión.");
    } catch (error) {
      console.error("Error al descargar audioguía:", error);
      setMensajeDescarga("No se pudo descargar la audioguía.");
    } finally {
      setDescargando(false);
    }
  }

  function alternarReproduccion() {
    if (estadoAudio.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  function retrocederAudio() {
    player.seekTo(Math.max(0, estadoAudio.currentTime - 15));
  }

  function adelantarAudio() {
    const nuevoTiempo = estadoAudio.currentTime + 15;

    player.seekTo(
      estadoAudio.duration > 0
        ? Math.min(nuevoTiempo, estadoAudio.duration)
        : nuevoTiempo,
    );
  }

  function formatearTiempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = Math.floor(segundos % 60);

    return `${minutos}:${String(segundosRestantes).padStart(2, "0")}`;
  }

  function cambiarPosicionAudio(evento: {
    nativeEvent: { locationX: number };
  }) {
    if (estadoAudio.duration <= 0 || anchoBarra <= 0) return;

    const posicion = Math.max(
      0,
      Math.min(evento.nativeEvent.locationX / anchoBarra, 1),
    );

    player.seekTo(posicion * estadoAudio.duration);
  }

  if (cargando) {
    return (
      <View style={styles.contenedor}>
        <Text>Cargando audioguía...</Text>
      </View>
    );
  }

  if (error || !lugar) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.error}>{error ?? "No se encontró el lugar."}</Text>
      </View>
    );
  }

  if (!lugar.audioguia) {
    return (
      <View style={styles.contenedor}>
        <Text>Este lugar todavía no tiene audioguía.</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Audioguía</Text>

      <Text style={styles.nombre}>{lugar.nombre}</Text>

      <Text>
        Duración: {Math.floor(lugar.audioguia.duracionSegundos / 60)}:
        {String(lugar.audioguia.duracionSegundos % 60).padStart(2, "0")}
      </Text>

      <Text>Idioma: {lugar.audioguia.idioma.toUpperCase()}</Text>

      <View style={styles.progresoContenedor}>
        <Pressable
          style={styles.barraFondo}
          onLayout={(evento) => setAnchoBarra(evento.nativeEvent.layout.width)}
          onPress={cambiarPosicionAudio}
        >
          <View
            style={[
              styles.barraProgreso,
              {
                width: `${
                  estadoAudio.duration > 0
                    ? (estadoAudio.currentTime / estadoAudio.duration) * 100
                    : 0
                }%`,
              },
            ]}
          />
        </Pressable>

        <View style={styles.tiempos}>
          <Text style={styles.textoTiempo}>
            {formatearTiempo(estadoAudio.currentTime)}
          </Text>

          <Text style={styles.textoTiempo}>
            -
            {formatearTiempo(
              Math.max(0, estadoAudio.duration - estadoAudio.currentTime),
            )}
          </Text>
        </View>
      </View>
      <View style={styles.controles}>
        <Pressable
          style={[
            styles.botonControl,
            !puedeReproducir && styles.botonDesactivado,
          ]}
          onPress={retrocederAudio}
          disabled={!puedeReproducir}
        >
          <Text style={styles.textoControl}>-15 s</Text>
        </Pressable>

        <Pressable
          style={[
            styles.botonControl,
            !puedeReproducir && styles.botonDesactivado,
          ]}
          onPress={alternarReproduccion}
          disabled={!puedeReproducir}
        >
          <Text style={styles.textoControl}>
            {estadoAudio.playing ? "Pausar" : "Reproducir"}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.botonControl,
            !puedeReproducir && styles.botonDesactivado,
          ]}
          onPress={adelantarAudio}
          disabled={!puedeReproducir}
        >
          <Text style={styles.textoControl}>+15 s</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={descargarAudioguia}
        disabled={descargando || !!audioLocalUri || !hayInternet}
        style={[
          styles.boton,
          (descargando || !!audioLocalUri || !hayInternet) &&
            styles.botonDesactivado,
        ]}
      >
        <Text style={styles.textoBoton}>
          {descargando
            ? "Descargando..."
            : audioLocalUri
              ? "Audioguía descargada"
              : "Descargar para escuchar sin conexión"}
        </Text>
      </Pressable>

      {mensajeDescarga && (
        <View
          style={[
            styles.mensajeContenedor,
            audioLocalUri ? styles.mensajeExito : styles.mensajeError,
          ]}
        >
          <Text
            style={[
              styles.mensajeTexto,
              audioLocalUri ? styles.textoExito : styles.textoError,
            ]}
          >
            {audioLocalUri ? "✓ " : "⚠ "}
            {mensajeDescarga}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    gap: 16,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#176B87",
  },
  nombre: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  error: {
    color: "#C62828",
    textAlign: "center",
  },
  boton: {
    backgroundColor: "#176B87",
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  textoBoton: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  controles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 12,
  },
  botonControl: {
    backgroundColor: "#176B87",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  textoControl: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  progresoContenedor: {
    width: "100%",
    marginTop: 16,
  },
  barraFondo: {
    height: 8,
    backgroundColor: "#D9E5E9",
    borderRadius: 10,
    overflow: "hidden",
  },
  barraProgreso: {
    height: "100%",
    backgroundColor: "#176B87",
    borderRadius: 10,
  },
  tiempos: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  textoTiempo: {
    fontSize: 13,
    color: "#555555",
  },
  botonDesactivado: {
    backgroundColor: "#AABCC2",
    opacity: 0.55,
  },
  errorContenedor: {
    backgroundColor: "#FDECEC",
    borderColor: "#DC3545",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    width: "100%",
  },

  errorTexto: {
    color: "#B02A37",
    fontSize: 14,
    textAlign: "center",
  },
  mensajeContenedor: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    width: "100%",
  },

  mensajeExito: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },

  mensajeError: {
    backgroundColor: "#FDECEC",
    borderColor: "#DC3545",
  },

  mensajeTexto: {
    fontSize: 14,
    textAlign: "center",
  },

  textoExito: {
    color: "#2E7D32",
  },

  textoError: {
    color: "#B02A37",
  },
});
