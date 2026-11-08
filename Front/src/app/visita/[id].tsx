import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FotoVisita from '../../components/FotoVisita';
import { obtenerLugares } from '../../servicios/lugares';
import { obtenerVisitaPorId } from '../../servicios/visitas';
import type { Lugar, OrigenVisita, Visita } from '../../tipos/entities';
import { formatearFechaHora } from '../../utilidades/fechas';

const textoOrigen: Record<OrigenVisita, string> = {
  qr: 'Escaneando el código QR',
  gps: 'Estando cerca del lugar',
  manual: 'Cargada a mano',
};

function mensajeDeError(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return 'Algo salió mal. Probá de nuevo.';
}

export default function VisitaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [visita, setVisita] = useState<Visita | null>(null);
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datosVisita = await obtenerVisitaPorId(id);
      setVisita(datosVisita);

      if (datosVisita) {
        try {
          const lugares = await obtenerLugares();
          setLugar(lugares.find((l) => l.id === datosVisita.lugarId) ?? null);
        } catch {
          // sin conexión y sin catálogo guardado: se muestra la visita sin datos del lugar
          setLugar(null);
        }
      }
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.mensaje}>Cargando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centrado}>
        <View style={styles.cuadroError} accessibilityRole="alert">
          <Text style={styles.textoError}>{error}</Text>
          <Pressable style={styles.botonReintentar} onPress={cargar} accessibilityRole="button">
            <Text style={styles.textoBoton}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!visita) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.mensaje}>No encontramos esta visita.</Text>
        <Pressable style={styles.boton} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.textoBoton}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <FotoVisita uri={visita.fotoUri} estilo={styles.foto} />

      <Text style={styles.nombreLugar} accessibilityRole="header">
        {lugar?.nombre ?? 'Lugar no disponible'}
      </Text>
      <Text style={styles.fecha}>{formatearFechaHora(visita.fechaHora)}</Text>

      <View style={styles.bloque}>
        <Text style={styles.etiqueta}>Cómo la registraste</Text>
        <Text style={styles.valor}>{textoOrigen[visita.origen] ?? 'Cargada a mano'}</Text>
      </View>

      <View style={styles.bloque}>
        <Text style={styles.etiqueta}>Tu nota</Text>
        <Text style={styles.valor}>{visita.nota ?? 'No escribiste ninguna nota.'}</Text>
      </View>

      {!visita.sincronizada && (
        <Text style={styles.aviso}>
          Esta visita está guardada en tu teléfono y se subirá cuando haya conexión.
        </Text>
      )}

      {lugar && (
        <Pressable
          style={styles.boton}
          onPress={() => router.push({ pathname: '/detalle', params: { id: lugar.id } })}
          accessibilityRole="button"
        >
          <Text style={styles.textoBoton}>Ver el lugar</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 20,
    gap: 12,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 20,
    gap: 16,
  },
  mensaje: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  cuadroError: {
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F5C2BD',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  textoError: {
    fontSize: 16,
    color: '#B3261E',
    lineHeight: 22,
  },
  botonReintentar: {
    backgroundColor: '#B3261E',
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foto: {
    width: '100%',
    height: 240,
    borderRadius: 12,
  },
  nombreLugar: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#176B87',
  },
  fecha: {
    fontSize: 16,
    color: '#666666',
  },
  bloque: {
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#D5E5EB',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  valor: {
    fontSize: 18,
    color: '#333333',
    lineHeight: 26,
  },
  aviso: {
    fontSize: 15,
    color: '#B26A00',
  },
  boton: {
    backgroundColor: '#176B87',
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});