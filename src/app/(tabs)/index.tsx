import { router } from 'expo-router';
import { StyleSheet , Pressable, TextInput , Image , ImageBackground} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { View, Text } from 'react-native';
import { ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
     <View style={styles.safeArea}>
        <View style={styles.heroSection}>
<ImageBackground
  source={require('../../../assets/images/colon-fondo-inicio.jpg')}
  style={styles.fondo}
  resizeMode="cover"
>

                 
          <Text style={styles.title}>
            ¡Bienvenidos a Colón!
          </Text>
          
          <Text style={styles.subtitulo}>
  Descubrí Colón, Entre Ríos
          </Text>

<View style={styles.contenedorBotones}>

<View style={styles.contenedorBotones}>

  {/* Lugares turísticos */}
  <Pressable
    style={styles.botonExplorar}
    onPress={() => router.push('/lugares')}
  >
    <Ionicons
      name="location-outline"
      size={28}
      color="#176B87"
    />
    <Text style={styles.textoBoton}>
      Lugares turísticos
    </Text>
  </Pressable>

  {/* Agenda de eventos */}
  <Pressable
    style={styles.botonExplorar}
    onPress={() => router.push('/agenda')}
  >
    <Ionicons
      name="calendar-outline"
      size={28}
      color="#176B87"
    />
    <Text style={styles.textoBoton}>
      Agenda de eventos
    </Text>
  </Pressable>

  {/* Mapa */}
  <Pressable style={styles.botonExplorar}>
    <Ionicons
      name="map-outline"
      size={28}
      color="#176B87"
    />
    <Text style={styles.textoBoton}>
      Mapa
    </Text>
  </Pressable>

  {/* Mi recorrido */}
  <Pressable style={styles.botonExplorar}>
    <Ionicons
      name="navigate-outline"
      size={28}
      color="#176B87"
    />
    <Text style={styles.textoBoton}>
      Mi recorrido
    </Text>
  </Pressable>

</View>

</View>





</ImageBackground>
          
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
safeArea: {
  flex: 1,
  width: '100%',
},
 heroSection: {
  flex: 1,
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
},
  fondo: {
  flex: 1,
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
  imagenInicio: {
  width: 300,
  height: 220,
  borderRadius: 15,
  resizeMode: 'cover',
},
title: {
  textAlign: 'center',
  fontSize: 26,
  fontWeight: 'bold',
  color: '#FFFFFF',
  textShadowColor: '#000000',
  textShadowOffset: { width: 1, height: 2 },
  textShadowRadius: 5,
},

subtitulo: {
  fontSize: 18,
  color: '#FFFFFF',
  fontWeight: 'bold',
  textAlign: 'center',
  textShadowColor: '#000000',
  textShadowOffset: { width: 1, height: 2 },
  textShadowRadius: 5,
},
buscador: {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#CCCCCC',
  borderRadius: 10,
  padding: 12,
  width: 300,
},
botonExplorar: {
  backgroundColor: '#FFFFFF',
  width: 140,
  height: 110,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  padding: 10,
},
contenedorBotones: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 12,
  width: 300,
},
tituloCategorias: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#FFFFFF',
  textAlign: 'center',
  marginTop: 20,
},

textoBoton: {
  color: '#176B87',
  fontSize: 15,
  fontWeight: 'bold',
  textAlign: 'center',
},

});
