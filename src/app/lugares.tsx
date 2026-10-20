import { useState } from 'react';
import { Text, StyleSheet, ScrollView, TextInput , View , Pressable} from 'react-native';
import TarjetaLugar from '../components/TarjetaLugar';

const lugares = [
  {
    id: 1,
    nombre: 'Molino Forclaz',
    categoria: 'Museos y patrimonio',
    imagen: require('../../assets/images/molino-forclaz.jpg'),
  },
  {
    id: 2,
    nombre: 'Termas de Colón',
    categoria: 'Termas y bienestar',
    imagen: require('../../assets/images/termas-colon.jpg'),
  },
  {
    id: 3,
    nombre: 'Parque Nacional El Palmar',
    categoria: 'Naturaleza',
    imagen: require('../../assets/images/el-palmar.jpg'),
  },
];

export default function LugaresScreen() {
      const [busqueda, setBusqueda] = useState('')
      const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
   const lugaresFiltrados = lugares.filter((lugar) =>
  lugar.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
  (categoriaSeleccionada === 'Todas' ||
    lugar.categoria === categoriaSeleccionada)
);

  return (
    <ScrollView style={styles.container}>
  

<TextInput
  style={styles.buscador}
  placeholder="Buscar lugares turísticos..."
  value={busqueda}
  onChangeText={setBusqueda}
/>
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 }}>
  {['Todas', 'Termas y bienestar', 'Naturaleza', 'Museos y patrimonio'].map((categoria) => (
    <Pressable
      key={categoria}
      onPress={() => setCategoriaSeleccionada(categoria)}
      style={{
        backgroundColor: categoriaSeleccionada === categoria ? '#176B87' : '#F0F7FA',
        padding: 10,
        borderRadius: 10,
      }}
    >
      <Text style={{
        color: categoriaSeleccionada === categoria ? '#FFFFFF' : '#176B87',
      }}>
        {categoria}
      </Text>
    </Pressable>
  ))}
</View>

{lugaresFiltrados.length === 0 && (
  <Text style={{ textAlign: 'center', marginTop: 30, color: '#666666' }}>
    No se encontraron lugares turísticos.
  </Text>
)}
{lugaresFiltrados.map((lugar) => (
  <TarjetaLugar
    key={lugar.id}
    id={lugar.id}
    nombre={lugar.nombre}
    categoria={lugar.categoria}
    imagen={lugar.imagen}
  />
))}
 
</ScrollView>

  );

 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#176B87',
  },
  buscador: {
  backgroundColor: '#F0F7FA',
  borderWidth: 1,
  borderColor: '#D5E5EB',
  borderRadius: 10,
  padding: 12,
  fontSize: 16,
  marginTop: 20,
},

});