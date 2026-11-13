import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import EtiquetaVisita from './EtiquetaVisita';

export default function TarjetaLugar({
  id,
  nombre,
  categoria,
  imagen,
  visitado,
}: {
  id: string;
  nombre: string;
  categoria: string;
  imagen: ImageSourcePropType | string;
  // true = visitado, false = pendiente, null/undefined = no se sabe (sin sesión)
  visitado?: boolean | null;
}) {
  return (
    <View style={styles.tarjeta}>
      {imagen ? (
        <Image
          source={typeof imagen === 'string' ? { uri: imagen } : imagen}
          style={styles.imagenLugar}
        />
      ) : (
        <View
          style={[
            styles.imagenLugar,
            { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8EEF1' },
          ]}
        >
          <Text>📷 Imagen no disponible</Text>
        </View>
      )}
      <Text style={styles.nombreLugar}>{nombre}</Text>
      <Text style={styles.categoria}>{categoria}</Text>
      {visitado !== null && visitado !== undefined && <EtiquetaVisita visitado={visitado} />}

      <View style={styles.filaBotones}>
        <Pressable
          style={styles.botonDetalle}
          onPress={() =>
            router.push({
              pathname: '/detalle',
              params: { id: id.toString() },
            })
          }
        >
          <Text style={styles.textoBotonDetalle}>Ver detalle</Text>
        </Pressable>

        <Pressable
          style={styles.botonVisitar}
          onPress={() =>
            router.push({
              pathname: '/registrar-visita',
              params: { lugarId: id.toString() },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Visitar ${nombre}`}
        >
          <Text style={styles.textoBotonVisitar}>Visitar</Text>
        </Pressable>
      </View>
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
  filaBotones: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  botonDetalle: {
    flex: 1,
    backgroundColor: '#176B87',
    minHeight: 44,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonDetalle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botonVisitar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#176B87',
    minHeight: 44,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonVisitar: {
    color: '#176B87',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});