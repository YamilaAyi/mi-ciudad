import { View, Text, StyleSheet } from 'react-native';

export default function AgendaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Agenda de eventos
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#176B87',
  },
});