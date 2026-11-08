import { useState , useEffect } from 'react';
import { Text, StyleSheet, ScrollView, TextInput , View , Pressable} from 'react-native';
import TarjetaLugar from '../components/TarjetaLugar';
import { obtenerLugares ,  usandoCacheLugares } from '../servicios/lugares';
import type { Lugar } from '../tipos/entities';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

function obtenerNombreCategoria(categoriaId: string): string {
  switch (categoriaId) {
    case 'cat-playas':
      return 'Playas';
    case 'cat-termas':
      return 'Termas';
    case 'cat-museos':
      return 'Museos y patrimonio';
    case 'cat-gastronomia':
      return 'Gastronomía';
    case 'cat-artesanias':
      return 'Artesanías';
    case 'cat-naturaleza':
      return 'Naturaleza';
    case 'cat-alojamiento':
      return 'Alojamiento';
    case 'cat-bodegas':
      return 'Bodegas';
    default:
      return 'Otras';
  }
}


export default function LugaresScreen() {

const {
  busqueda: busquedaInicial,
  categoria: categoriaInicial,
} = useLocalSearchParams<{
  busqueda?: string;
  categoria?: string;
}>();
      const [busqueda, setBusqueda] = useState(busquedaInicial ?? '');
      const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(categoriaInicial ?? 'Todas');
      const [lugaresDelServicio, setLugaresDelServicio] = useState<Lugar[]>([]);
      const [cargando, setCargando] = useState(true);
const [error, setError] = useState<string | null>(null);
const [mostrandoCache, setMostrandoCache] = useState(false);
      

async function cargarLugares() {
  try {
    setCargando(true);
    setError(null);

    const datos = await obtenerLugares();
    setLugaresDelServicio(datos);
    setMostrandoCache(usandoCacheLugares);

  } catch  {
    setLugaresDelServicio([]);
    setError('No se pudieron cargar los lugares turísticos.');

  } finally {
    setCargando(false);
  }
}

useEffect(() => {
  cargarLugares();
}, []);

const lugaresFiltrados = lugaresDelServicio.filter((lugar) =>
  lugar.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
  (
    categoriaSeleccionada === 'Todas' ||
    (
      categoriaSeleccionada === 'Playas y termas' &&
      ['Playas', 'Termas'].includes(
        obtenerNombreCategoria(lugar.categoriaId)
      )
    ) ||
    obtenerNombreCategoria(lugar.categoriaId) === categoriaSeleccionada
  )
);

  return (
    <ScrollView
  style={styles.container}
  contentContainerStyle={{ paddingBottom: 40 }}
>
{mostrandoCache && !cargando && (
  <View
    style={{
      backgroundColor: '#FFF8E1',
      padding: 10,
      borderRadius: 10,
      marginTop: 5,
      marginBottom: 5,
      borderWidth: 1,
      borderColor: '#F5E6B3',
    }}
  >
  <Ionicons
    name="server-outline"
    size={22}
    color="#664D03"
  />

  <Text style={{ color: '#664D03', fontSize: 14, flex: 1 }}>
    Estás viendo información guardada. Algunos datos podrían no estar actualizados.
  </Text>
<Pressable
  onPress={cargarLugares}
  style={{
    backgroundColor: '#176B87',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  }}
>
  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
    Reintentar conexión
  </Text>
</Pressable>
  
</View>
)}
      {cargando && (
  <Text style={{ textAlign: 'center', marginTop: 20 }}>
    Cargando lugares turísticos...
  </Text>
)}
{error && (
  <View style={{ alignItems: 'center', marginTop: 20 }}>
    <Ionicons
  name="alert-circle-outline"
  size={48}
  color="#C62828"
  style={{ marginBottom: 12 }}
/>
    <Text style={{ color: 'red', marginBottom: 10 }}>
      {error}
    </Text>

    <Pressable onPress={cargarLugares}>
      <Text style={{ color: 'blue', fontWeight: 'bold' }}>
        Reintentar
      </Text>
    </Pressable>
  </View>
)}
{!cargando && !error && (
  <>
<TextInput
  style={styles.buscador}
  placeholder="Buscar lugares turísticos..."
  value={busqueda}
  onChangeText={setBusqueda}
/>
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 }}>
  {[
  'Todas',
  'Playas',
  'Termas',
  'Museos y patrimonio',
  'Gastronomía',
  'Artesanías',
  'Naturaleza',
  'Alojamiento',
  'Bodegas',
].map((categoria) => (
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

{!cargando && !error && lugaresFiltrados.length === 0 && (
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
  imagen={lugar.imagenes?.[0]}
/>
))}
  </>
)}
 
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