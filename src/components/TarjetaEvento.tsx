import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ETIQUETA_ESTADO, ubicacionDeEvento, type Evento } from '@/data/eventos';
import { finDeEvento, hora } from '@/lib/fechas';

export default function TarjetaEvento({
  evento,
  guardado,
}: {
  evento: Evento;
  guardado: boolean;
}) {
  const inicio = new Date(evento.inicio);
  const fin = finDeEvento(evento.inicio, evento.duracionMin);
  const anulado = evento.estado !== 'programado';

  return (
    <Pressable
      style={styles.tarjeta}
      onPress={() => router.push({ pathname: '/evento', params: { id: evento.id } })}
    >
      <Image source={evento.imagen} style={[styles.imagen, anulado && styles.imagenAnulada]} />

      <View style={styles.info}>
        <Text style={[styles.titulo, anulado && styles.tituloAnulado]} numberOfLines={2}>
          {evento.titulo}
        </Text>
        <Text style={styles.detalle}>
          {hora(inicio)} - {hora(fin)}
        </Text>
        <Text style={styles.detalle} numberOfLines={1}>
          {ubicacionDeEvento(evento).texto}
        </Text>

        {anulado && (
          <View style={styles.chipEstado}>
            <Text style={styles.chipEstadoTexto}>{ETIQUETA_ESTADO[evento.estado]}</Text>
          </View>
        )}
      </View>

      {guardado && <Ionicons name="heart" size={18} color="#D64550" />}
      <Ionicons name="chevron-forward" size={20} color="#176B87" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#D5E5EB',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  imagen: { width: 72, height: 72, borderRadius: 10 },
  imagenAnulada: { opacity: 0.5 },
  info: { flex: 1, gap: 2 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: '#333333' },
  tituloAnulado: { textDecorationLine: 'line-through', color: '#777777' },
  detalle: { fontSize: 14, color: '#666666' },
  chipEstado: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDE8E8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  chipEstadoTexto: { fontSize: 12, fontWeight: 'bold', color: '#B42318' },
});
