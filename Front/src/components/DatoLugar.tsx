import { Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


export type DatoLugarProps = {
  titulo: string;
  valor: string | null;
  icono?: React.ComponentProps<typeof Ionicons>['name'];
};
export function DatoLugar({ titulo, valor, icono }: DatoLugarProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      {icono && (
        <Ionicons
          name={icono}
          size={20}
          color="#176B87"
          style={{ marginTop: 2 }}
        />
      )}

      <Text style={[styles.texto, { flex: 1 }]}>
        {titulo}: {valor ?? 'Información no disponible'}
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  texto: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
});