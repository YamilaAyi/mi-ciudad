import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

// Indicador chico: "Visitado" (verde) o "Pendiente" (celeste).
export default function EtiquetaVisita({ visitado }: { visitado: boolean }) {
  return (
    <View style={[styles.etiqueta, visitado ? styles.visitado : styles.pendiente]}>
      <Ionicons
        name={visitado ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={visitado ? '#1B5E20' : '#176B87'}
      />
      <Text style={[styles.texto, { color: visitado ? '#1B5E20' : '#176B87' }]}>
        {visitado ? 'Visitado' : 'Pendiente'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
  },
  visitado: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  pendiente: {
    backgroundColor: '#E3EEF2',
    borderColor: '#B7D9E4',
  },
  texto: {
    fontSize: 13,
    fontWeight: '600',
  },
});