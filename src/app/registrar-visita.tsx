import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { guardarFotoLocal } from '../servicios/fotos';
import { obtenerLugares } from '../servicios/lugares';
import {
  DISTANCIA_MAXIMA_METROS,
  distanciaEnMetros,
  formatearDistancia,
  obtenerUbicacionActual,
} from '../servicios/ubicacion';
import { registrarVisita } from '../servicios/visitas';
import type { Lugar } from '../tipos/entities';

// La API acepta notas de hasta 280 caracteres.
const LARGO_MAXIMO_NOTA = 280;

type ResultadoGps =
  | { tipo: 'cerca'; metros: number }
  | { tipo: 'lejos'; metros: number }
  | { tipo: 'problema'; mensaje: string };

export default function RegistrarVisitaScreen() {
  const { lugarId, origen: origenParam } = useLocalSearchParams<{
    lugarId: string;
    origen?: string;
  }>();
  const vieneDeQr = origenParam === 'qr';

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [nota, setNota] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [resultadoGps, setResultadoGps] = useState<ResultadoGps | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const lugares = await obtenerLugares();
        setLugar(lugares.find((l) => l.id === lugarId) ?? null);
      } catch (e) {
        setError(mensajeDeError(e));
      }
    }
    cargar();
  }, [lugarId]);

  async function verificarConGps() {
    if (!lugar || buscandoGps) return;
    setBuscandoGps(true);
    setError(null);
    setResultadoGps(null);
    try {
      const miUbicacion = await obtenerUbicacionActual();
      const metros = distanciaEnMetros(miUbicacion, lugar.coordenadas);
      setResultadoGps(
        metros <= DISTANCIA_MAXIMA_METROS ? { tipo: 'cerca', metros } : { tipo: 'lejos', metros }
      );
    } catch (e) {
      setResultadoGps({ tipo: 'problema', mensaje: mensajeDeError(e) });
    } finally {
      setBuscandoGps(false);
    }
  }

  async function sacarFoto() {
    setError(null);
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      setError('Sin permiso para usar la cámara. Podés elegir una foto de la galería o guardar la visita sin foto.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!resultado.canceled) {
      setFoto(resultado.assets[0].uri);
    }
  }

  async function elegirDeGaleria() {
    setError(null);
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!resultado.canceled) {
      setFoto(resultado.assets[0].uri);
    }
  }

  async function guardar() {
    if (guardando || !lugar) return; // evita guardar dos veces si tocan rápido
    setGuardando(true);
    setError(null);
    try {
      const notaLimpia = nota.trim();
      const fotoGuardada = foto ? await guardarFotoLocal(foto) : null;
      await registrarVisita({
        lugarId: lugar.id,
        // "qr" si vino de escanear el cartel, "gps" solo si se comprobó que estaba cerca.
        origen: vieneDeQr ? 'qr' : resultadoGps?.tipo === 'cerca' ? 'gps' : 'manual',
        nota: notaLimpia === '' ? null : notaLimpia,
        fotoUri: fotoGuardada,
      });
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // si el teléfono no vibra, no pasa nada
      }
            router.navigate('/recorrido');
    } catch (e) {
      setError(mensajeDeError(e));
      setGuardando(false); // el botón vuelve a quedar disponible para reintentar
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
      <Text style={styles.etiqueta}>Vas a registrar tu visita a</Text>
      <Text style={styles.nombreLugar} accessibilityRole="header">
        {lugar?.nombre ?? 'Cargando...'}
      </Text>

      {vieneDeQr && (
        <Text style={styles.exito}>Código QR leído. ¡Confirmamos que estás en este lugar!</Text>
      )}

      {!vieneDeQr && (
        <>
          <Pressable
            style={[styles.botonCompleto, (!lugar || buscandoGps) && styles.botonDeshabilitado]}
            onPress={verificarConGps}
            disabled={!lugar || buscandoGps}
            accessibilityRole="button"
          >
            <Text style={styles.textoBotonSecundario}>
              {buscandoGps ? 'Buscando tu ubicación...' : 'Estoy acá (usar GPS)'}
            </Text>
          </Pressable>

          {resultadoGps?.tipo === 'cerca' && (
            <Text style={styles.exito}>
              ¡Confirmado! Estás a {formatearDistancia(resultadoGps.metros)} del lugar.
            </Text>
          )}
          {resultadoGps?.tipo === 'lejos' && (
            <Text style={styles.aviso}>
              Estás a {formatearDistancia(resultadoGps.metros)} del lugar. Acercate para confirmar con
              GPS, o guardá la visita a mano.
            </Text>
          )}
          {resultadoGps?.tipo === 'problema' && (
            <Text style={styles.aviso}>{resultadoGps.mensaje}</Text>
          )}
        </>
      )}

      <Text style={styles.etiqueta}>Foto (opcional)</Text>
      {foto ? (
        <View style={styles.bloqueFoto}>
          <Image
            source={{ uri: foto }}
            style={styles.vistaPrevia}
            resizeMode="cover"
            accessibilityLabel="Vista previa de la foto"
          />
          <Pressable style={styles.botonCompleto} onPress={() => setFoto(null)} accessibilityRole="button">
            <Text style={styles.textoBotonSecundario}>Quitar foto</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.filaBotones}>
          <Pressable style={styles.botonMitad} onPress={sacarFoto} accessibilityRole="button">
            <Text style={styles.textoBotonSecundario}>Sacar foto</Text>
          </Pressable>
          <Pressable style={styles.botonMitad} onPress={elegirDeGaleria} accessibilityRole="button">
            <Text style={styles.textoBotonSecundario}>Elegir de la galería</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.etiqueta}>Nota (opcional)</Text>
      <TextInput
        style={styles.entrada}
        placeholder="Escribí algo para recordar este momento"
        value={nota}
        onChangeText={setNota}
        multiline
        maxLength={LARGO_MAXIMO_NOTA}
      />
      <Text style={styles.contador}>
        {nota.length}/{LARGO_MAXIMO_NOTA}
      </Text>

      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}

      <Pressable
        style={[styles.boton, (guardando || !lugar) && styles.botonDeshabilitado]}
        onPress={guardar}
        disabled={guardando || !lugar}
        accessibilityRole="button"
      >
        <Text style={styles.textoBoton}>
          {guardando ? 'Guardando...' : error ? 'Reintentar' : 'Guardar visita'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// Saca el texto para mostrar. Los errores de la API traen un mensaje listo.
function mensajeDeError(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return 'Algo salió mal. Probá de nuevo.';
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 20,
    gap: 12,
  },
  etiqueta: {
    fontSize: 16,
    color: '#666666',
  },
  nombreLugar: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#176B87',
  },
  filaBotones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloqueFoto: {
    gap: 8,
  },
  vistaPrevia: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  botonMitad: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 52,
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#176B87',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCompleto: {
    minHeight: 52,
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#176B87',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonSecundario: {
    color: '#176B87',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  exito: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1B5E20',
  },
  aviso: {
    backgroundColor: '#FFF4E0',
    borderWidth: 1,
    borderColor: '#F2D49B',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#8A5300',
  },
  entrada: {
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#D5E5EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  contador: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
  },
  error: {
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F5C2BD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#B3261E',
  },
  boton: {
    backgroundColor: '#176B87',
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});