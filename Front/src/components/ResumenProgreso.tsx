import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

// Resumen de cuántos lugares visitó la persona, con una barra de avance.
export default function ResumenProgreso({
  visitados,
  total,
}: {
  visitados: number;
  total: number;
}) {
  if (total <= 0) return null;

  const porcentaje = Math.min(100, Math.round((visitados / total) * 100));
  const completo = visitados >= total;

  return (
    <View style={styles.caja}>
      <View style={styles.fila}>
        <Ionicons
          name={completo ? 'trophy-outline' : 'footsteps-outline'}
          size={24}
          color="#176B87"
        />
        <View style={styles.textos}>
          <Text style={styles.titulo}>
            {completo
              ? '¡Completaste el recorrido!'
              : `Visitaste ${visitados} de ${total} lugares`}
          </Text>
          <Text style={styles.subtitulo}>
            {completo
              ? `Conociste los ${total} lugares de la guía.`
              : visitados === 0
                ? 'Empezá tu recorrido por Colón.'
                : `Te faltan ${total - visitados} para completar la guía.`}
          </Text>
        </View>
        <Text style={styles.porcentaje}>{porcentaje}%</Text>
      </View>

      <View
        style={styles.pista}
        accessibilityRole="progressbar"
        accessibilityLabel="Progreso del recorrido"
        accessibilityValue={{ min: 0, max: total, now: Math.min(visitados, total) }}
      >
        <View style={[styles.relleno, { width: `${porcentaje}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#D5E5EB',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textos: {
    flex: 1,
  },
  titulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitulo: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  porcentaje: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#176B87',
  },
  pista: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#D5E5EB',
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#176B87',
  },
});