import { useState } from 'react';
import { Text, StyleSheet, ScrollView, TextInput , View , Pressable} from 'react-native';
import TarjetaLugar from '../components/TarjetaLugar';
import { useEffect } from 'react';
import { obtenerLugares } from '../servicios/lugares';
import type { Lugar } from '../tipos/entities';


function obtenerNombreCategoria(categoriaId: string): string {
  switch (categoriaId) {
    case 'historia':
      return 'Museos y patrimonio';
    case 'termas':
      return 'Termas y bienestar';
    case 'naturaleza':
      return 'Naturaleza';
    default:
      return 'Otras';
  }
}

function obtenerImagenLugar(id: string) {
  switch (id) {
    case '1':
      return require('../../assets/images/molino-forclaz.jpg');
    case '2':
      return require('../../assets/images/termas-colon.jpg');
    case '3':
      return require('../../assets/images/el-palmar.jpg');
    default:
      return require('../../assets/images/molino-forclaz.jpg');
  }
}

export default function LugaresScreen() {
      const [busqueda, setBusqueda] = useState('')
      const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
      const [lugaresDelServicio, setLugaresDelServicio] = useState<Lugar[]>([]);
      

      useEffect(() => {
  async function cargarLugares() {
    const datos = await obtenerLugares();
    console.log('Lugares del servicio:', datos);
    setLugaresDelServicio(datos);
  }

  cargarLugares();
}, []);
   const lugaresFiltrados = lugaresDelServicio.filter((lugar) =>
  lugar.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
  (categoriaSeleccionada === 'Todas' ||
   obtenerNombreCategoria(lugar.categoriaId) === categoriaSeleccionada)
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
    categoria={obtenerNombreCategoria(lugar.categoriaId)}
    imagen={obtenerImagenLugar(lugar.id)}
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