import { View, Text , Image , StyleSheet} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const lugares = [
  {
    id: 1,
    nombre: 'Molino Forclaz',
    categoria: 'Museos y patrimonio',
    descripcion: 'Monumento histórico de Colón, Entre Ríos.',
    imagen: require('../../assets/images/molino-forclaz.jpg'),
  },
  {
    id: 2,
    nombre: 'Termas de Colón',
    categoria: 'Termas',
    descripcion: 'Complejo termal de Colón, ideal para descansar y disfrutar de sus piscinas.',
    imagen: require('../../assets/images/termas-colon.jpg'),
  },
  {
    id: 3,
    nombre: 'Parque Nacional El Palmar',
    categoria: 'Naturaleza',
    descripcion: 'Parque nacional conocido por sus palmeras yatay y sus senderos naturales.',
    imagen: require('../../assets/images/el-palmar.jpg'),
  },
];

export default function DetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lugar = lugares.find((lugar) => lugar.id === Number(id));
 
  return (
    <View style={styles.contenedor}>
      {lugar?.imagen && (
  <Image
    source={lugar.imagen}
    style={styles.imagenLugar}
    resizeMode="cover"
  />
)}
     <Text style={styles.nombreLugar}>
  {lugar?.nombre ?? 'Lugar desconocido'}
</Text>   
      <Text style={styles.categoria}>
  {lugar?.categoria ?? 'Categoría desconocida'}
</Text>
  <Text style={styles.descripcion}>
  {lugar?.descripcion ?? 'Descripción no disponible'}
</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imagenLugar: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },

  contenedor: {
  flex: 1,
  padding: 20,
  gap: 12,
},
nombreLugar:{
  fontSize :24,
  fontWeight : 'bold',
    color: '#176B87',
},
categoria : {
  fontSize: 16,
  fontWeight: '600',
  color: '#666666',
},
descripcion:{
    fontSize: 16,
  color: '#333333',
  lineHeight: 24,
},
});