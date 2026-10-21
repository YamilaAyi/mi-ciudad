import { View, Text , Image , StyleSheet} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { obtenerLugares } from '../servicios/lugares';
import type { Lugar } from '../tipos/entities';
import { DatoLugar } from '../components/DatoLugar';



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

export default function DetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lugarDelServicio, setLugarDelServicio] = useState<Lugar | null>(null);

  useEffect(() => {
  async function cargarLugar() {
    const datos = await obtenerLugares();
    const lugarEncontrado = datos.find((lugar) => lugar.id === id);       
    setLugarDelServicio(lugarEncontrado ?? null);
  }

  cargarLugar();
}, [id]);
  
 
  return (
    <View style={styles.contenedor}>
 {lugarDelServicio && (
  <Image
    source={obtenerImagenLugar(lugarDelServicio.id)}
    style={styles.imagenLugar}
    resizeMode="cover"
  />
)}
<Text style={styles.nombreLugar}>
  {lugarDelServicio?.nombre ?? 'Cargando lugar...'}
</Text>

 <Text style={styles.categoria}>
  {lugarDelServicio?.categoriaId === 'historia'
    ? 'Museos y patrimonio'
    : lugarDelServicio?.categoriaId === 'termas'
    ? 'Termas y bienestar'
    : lugarDelServicio?.categoriaId === 'naturaleza'
    ? 'Naturaleza'
    : 'Categoría desconocida'}
</Text>

<Text style={styles.descripcion}>
  {lugarDelServicio?.descripcion ?? 'Descripción no disponible'}
</Text>

<DatoLugar
  titulo="📍 Dirección"
  valor={lugarDelServicio?.direccion ?? null}
/>
<DatoLugar
  titulo="🕒 Horarios"
  valor={lugarDelServicio?.horarios.length
    ? 'Consultar horarios'
    : null}
 />
<DatoLugar
  titulo="📞 Teléfono"
  valor={lugarDelServicio?.telefono ?? null}
/>

<DatoLugar
  titulo="💰 Precio de entrada"
  valor={
    lugarDelServicio?.precioEntrada != null
      ? `$${lugarDelServicio.precioEntrada}`
      : null
  }
/>
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