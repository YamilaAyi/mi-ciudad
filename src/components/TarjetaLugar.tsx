import { View, Text , StyleSheet , Image , Pressable} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';

export default function TarjetaLugar({
  id,
  nombre,
  categoria,
  imagen,
}: {
  id: number;
  nombre: string;
  categoria: string;
  imagen: ImageSourcePropType;
}) {
  return (
    <View style ={styles.tarjeta}>  
  <Image source={imagen} style={styles.imagenLugar} /> 
 <Text style={styles.nombreLugar}>{nombre}</Text>
  <Text style={styles.categoria}>{categoria}</Text>

<Pressable style={styles.botonDetalle}
      onPress={() =>
  router.push({
    pathname: '/detalle',
    params: { id: id.toString() },
  })
}
      >
 <Text style={styles.textoBotonDetalle}>Ver detalle</Text>
</Pressable>

</View>
    
  );
}


const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: '#F0F7FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#D5E5EB',
  },
  imagenLugar: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  nombreLugar: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#333333',
  marginTop: 10,
},
categoria: {
  fontSize: 14,
  color: '#666666',
  marginTop: 5,
},
botonDetalle: {
  backgroundColor: '#176B87',
  padding: 10,
  borderRadius: 8,
  marginTop: 12,
  alignItems: 'center',
},
textoBotonDetalle: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: 'bold',
},
});