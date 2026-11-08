import { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface Props {
  uri: string | null;
  estilo: StyleProp<ViewStyle>;
  textoChico?: boolean;
}

export default function FotoVisita({ uri, estilo, textoChico }: Props) {
  const [fallo, setFallo] = useState(false);

  // Si cambia la foto, volvemos a intentar cargarla.
  useEffect(() => {
    setFallo(false);
  }, [uri]);

  if (!uri || fallo) {
    return (
      <View style={[estilo, styles.sinFoto]}>
        <Text style={[styles.texto, textoChico && styles.textoChico]}>Sin foto</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={estilo as StyleProp<ImageStyle>}
      resizeMode="cover"
      onError={() => setFallo(true)}
      accessibilityLabel="Foto de la visita"
    />
  );
}

const styles = StyleSheet.create({
  sinFoto: {
    backgroundColor: '#E3EEF2',
    borderWidth: 1,
    borderColor: '#D5E5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  texto: {
    fontSize: 16,
    color: '#666666',
  },
  textoChico: {
    fontSize: 13,
  },
});