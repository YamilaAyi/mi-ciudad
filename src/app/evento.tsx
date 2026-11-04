
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useEventos } from '@/context/eventos-context';
import {
  ETIQUETA_ESTADO,
  ubicacionDeEvento,
  type EstadoEvento,
} from '@/data/eventos';
import { duracionTexto, fechaLarga, finDeEvento, hora } from '@/lib/fechas';
import { MINUTOS_AVISO } from '@/lib/notificaciones';
import { ErrorApi } from '@/servicios/cliente';

export default function EventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { eventos, estaGuardado, alternarGuardado, simularEstado } =
    useEventos();
  const [guardando, setGuardando] = useState(false);

  const evento = eventos.find((e) => e.id === id);

  if (!evento) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.vacio}>Evento no encontrado.</Text>
      </View>
    );
  }

  const inicio = new Date(evento.inicio);
  const fin = finDeEvento(evento.inicio, evento.duracionMin);
  const ubicacion = ubicacionDeEvento(evento);
  const guardado = estaGuardado(evento.id);
  const anulado = evento.estado !== 'programado';

  async function onAlternar() {
    if (!evento || guardando) return;

    setGuardando(true);

    try {
      const resultado = await alternarGuardado(evento);

      if (!resultado.guardado) return;

      if (resultado.permisoDenegado) {
        Alert.alert(
          'Evento guardado',
          'No pudimos programar el recordatorio porque las notificaciones están desactivadas. Podés activarlas desde los ajustes del teléfono.',
        );
      } else if (!resultado.avisoProgramado) {
        Alert.alert(
          'Evento guardado',
          'El evento se guardó en tu agenda, pero no pudimos programar el recordatorio. Vamos a revisar el motivo.',
        );
      } else {
        Alert.alert(
          'Evento guardado',
          `Te vamos a avisar ${MINUTOS_AVISO} minutos antes de que empiece.`,
        );
      }
    } catch (error) {
      console.error('Error al guardar el evento o programar el aviso:', error);

      // Los mensajes de la API están pensados para mostrarse tal cual.
      Alert.alert(
        'No se pudo completar la operación',
        error instanceof ErrorApi
          ? error.message
          : 'Ocurrió un error al guardar el evento. Volvé a intentarlo.',
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <View>
        <Image
          source={evento.imagen}
          style={styles.imagen}
          resizeMode="cover"
        />
        <Pressable
          style={styles.corazon}
          onPress={onAlternar}
          hitSlop={8}
          disabled={guardando}
        >
          <Ionicons
            name={guardado ? 'heart' : 'heart-outline'}
            size={24}
            color={guardado ? '#D64550' : '#333333'}
          />
        </Pressable>
      </View>

      {anulado && (
        <View style={styles.banner}>
          <Ionicons
            name={
              evento.estado === 'suspendido_lluvia'
                ? 'rainy-outline'
                : 'close-circle-outline'
            }
            size={20}
            color="#B42318"
          />
          <Text style={styles.bannerTexto}>
            {ETIQUETA_ESTADO[evento.estado]}
          </Text>
        </View>
      )}

      {evento.categoria ? <Text style={styles.categoria}>{evento.categoria}</Text> : null}
      <Text style={[styles.titulo, anulado && styles.tituloAnulado]}>
        {evento.titulo}
      </Text>

      <View style={styles.fila}>
        <Ionicons name="calendar-outline" size={22} color="#176B87" />
        <Text style={styles.filaTexto}>{fechaLarga(inicio)}</Text>
      </View>

      <View style={styles.fila}>
        <Ionicons name="time-outline" size={22} color="#176B87" />
        <Text style={styles.filaTexto}>
          {hora(inicio)} - {hora(fin)} ({duracionTexto(evento.duracionMin)})
        </Text>
      </View>

      <View style={styles.fila}>
        <Ionicons name="location-outline" size={22} color="#176B87" />
        {ubicacion.lugarId ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/detalle',
                params: { id: String(ubicacion.lugarId) },
              })
            }
          >
            <Text style={[styles.filaTexto, styles.enlace]}>
              {ubicacion.texto} · Ver lugar
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.filaTexto}>{ubicacion.texto}</Text>
        )}
      </View>

      <View style={styles.fila}>
        <Ionicons name="ticket-outline" size={22} color="#176B87" />
        <View style={[styles.chip, evento.gratuito && styles.chipGratis]}>
          <Text
            style={[
              styles.chipTexto,
              evento.gratuito && styles.chipGratisTexto,
            ]}
          >
            {evento.gratuito ? 'Gratuito' : (evento.precio ?? 'Con costo')}
          </Text>
        </View>
      </View>

      <Text style={styles.descripcion}>{evento.descripcion}</Text>

      <Pressable
        style={[
          styles.boton,
          guardado && styles.botonSecundario,
          (anulado || guardando) && styles.botonDeshabilitado,
        ]}
        onPress={onAlternar}
        disabled={guardando || (anulado && !guardado)}
      >
        <Text
          style={[
            styles.botonTexto,
            guardado && styles.botonSecundarioTexto,
          ]}
        >
          {guardando
            ? 'Procesando...'
            : anulado && !guardado
              ? 'Evento no disponible'
              : guardado
                ? 'Quitar de mi agenda'
                : 'Agregar a mi agenda'}
        </Text>
      </Pressable>

      {__DEV__ && (
        <View style={styles.dev}>
          <Text style={styles.devTitulo}>
            Solo desarrollo · simular panel admin
          </Text>
          <View style={styles.devBotones}>
            {(
              ['programado', 'suspendido_lluvia', 'cancelado'] as EstadoEvento[]
            ).map((estado) => (
              <Pressable
                key={estado}
                style={[
                  styles.devBoton,
                  evento.estado === estado && styles.devBotonActivo,
                ]}
                onPress={() => simularEstado(evento.id, estado)}
              >
                <Text style={styles.devBotonTexto}>
                  {ETIQUETA_ESTADO[estado]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#FFFFFF' },
  contenido: { padding: 20, gap: 14, paddingBottom: 50 },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vacio: { color: '#666666', fontSize: 16 },

  imagen: { width: '100%', height: 200, borderRadius: 12 },
  corazon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDE8E8',
    borderRadius: 10,
    padding: 12,
  },
  bannerTexto: { color: '#B42318', fontWeight: 'bold', fontSize: 15 },

  categoria: { fontSize: 14, fontWeight: '600', color: '#666666' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#176B87' },
  tituloAnulado: { textDecorationLine: 'line-through', color: '#777777' },

  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filaTexto: { fontSize: 16, color: '#333333', flexShrink: 1 },
  enlace: {
    color: '#176B87',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  chip: {
    backgroundColor: '#F0F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipGratis: { backgroundColor: '#E3F4EA' },
  chipTexto: { fontSize: 14, fontWeight: '600', color: '#176B87' },
  chipGratisTexto: { color: '#1E7B4B' },

  descripcion: { fontSize: 16, color: '#333333', lineHeight: 24 },

  boton: {
    backgroundColor: '#176B87',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  botonSecundario: {
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#176B87',
  },
  botonDeshabilitado: { backgroundColor: '#B7C4C9' },
  botonTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  botonSecundarioTexto: { color: '#176B87' },

  dev: {
    marginTop: 24,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BBBBBB',
    gap: 8,
  },
  devTitulo: { fontSize: 12, color: '#777777' },
  devBotones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  devBoton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F3',
  },
  devBotonActivo: { backgroundColor: '#D5E5EB' },
  devBotonTexto: { fontSize: 13, color: '#333333' },
});
