import { Text , StyleSheet } from 'react-native';


export type DatoLugarProps = {
  titulo: string;
  valor: string | null;
};

export function DatoLugar({ titulo, valor }: DatoLugarProps) {
  return (
    <Text style={styles.texto}>
  {titulo}: {valor ?? 'Información no disponible'}
</Text>
    
  );
}


const styles = StyleSheet.create({
  texto: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
});