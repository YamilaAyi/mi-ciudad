import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const [busqueda, setBusqueda] = useState('');

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

<TextInput
  style={styles.buscador}
  placeholder="¿Qué lugar querés conocer?"
  value={busqueda}
  onChangeText={setBusqueda}
  returnKeyType="search"
  onSubmitEditing={() =>
    router.push({
      pathname: '/lugares',
      params: { busqueda: busqueda },
    })
  }
/>
<View style={styles.contenedorBotones}>
<Pressable
  style={styles.botonExplorar}
  onPress={() => router.push({
    pathname: '/lugares',
    params: { busqueda: busqueda }
  })}
>
  <Ionicons name="search-outline" size={28} color="#176B87" />
  <Text style={styles.textoBoton}>Buscar</Text>
</Pressable>

<Pressable
  style={styles.botonExplorar}
  onPress={() =>
    router.push({
      pathname: '/lugares',
      params: { categoria: 'Playas y termas' },
    })
  }
>
  <Ionicons name="water-outline" size={28} color="#176B87" />
  <Text style={styles.textoBoton}>Playas y termas</Text>
</Pressable>

<Pressable
  style={styles.botonExplorar}
  onPress={() =>
    router.push({
      pathname: '/lugares',
      params: { categoria: 'Naturaleza' },
    })
  }
>
  <Ionicons
    name="leaf-outline"
    size={28}
    color="#176B87"
  />
  <Text style={styles.textoBoton}>
    Naturaleza
  </Text>
</Pressable>

<Pressable
  style={styles.botonExplorar}
  onPress={() =>
    router.push({
      pathname: '/lugares',
      params: { categoria: 'Museos y patrimonio' },
    })
  }
>
  <Ionicons
    name="business-outline"
    size={28}
    color="#176B87"
  />
  <Text style={styles.textoBoton}>
    Historia y cultura
  </Text>
</Pressable>
</View>

<Pressable
  style={[styles.botonExplorar, { width: 300, height: 55, marginTop: 15 }]}
  onPress={() =>
    router.push({
      pathname: '/lugares',
      params: { categoria: 'Todas', busqueda: '' },
    })
  }
>
  <Text style={styles.textoBoton}>
    Ver todos los lugares turísticos
  </Text>
</Pressable>












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
  height: 85,
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
  marginTop: 20,
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
