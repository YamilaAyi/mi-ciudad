import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Mismo aspecto que el aviso de Lugares y del detalle del lugar.
export default function AvisoDatosGuardados({ onReintentar }: { onReintentar?: () => void }) {
  return (
    <View style={styles.caja} accessibilityRole="alert">
      <View style={styles.fila}>
        <Ionicons name="server-outline" size={22} color="#664D03" />
        <Text style={styles.texto}>
          Estás viendo información guardada. Se actualizará cuando vuelva la conexión.
        </Text>
      </View>

      {onReintentar && (
        <Pressable style={styles.boton} onPress={onReintentar} accessibilityRole="button">
          <Text style={styles.textoBoton}>Reintentar conexión</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F5E6B3',
    gap: 10,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  texto: {
    flex: 1,
    color: '#664D03',
    fontSize: 14,
    lineHeight: 20,
  },
  boton: {
    backgroundColor: '#176B87',
    minHeight: 44,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});