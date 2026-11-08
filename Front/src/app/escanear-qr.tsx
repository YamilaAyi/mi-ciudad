import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ErrorQr, lugarDeQr } from '../servicios/qr';

export default function EscanearQrScreen() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [codigoPrueba, setCodigoPrueba] = useState('');
  // La cámara dispara muchas lecturas por segundo: esto evita procesar varias a la vez.
  const ocupado = useRef(false);

  async function procesar(texto: string) {
    if (ocupado.current) return;
    ocupado.current = true;
    setLeyendo(true);
    setMensaje(null);
    try {
      const lugar = await lugarDeQr(texto);
      router.replace({
        pathname: '/registrar-visita',
        params: { lugarId: lugar.id, origen: 'qr' },
      });
    } catch (e) {
      setMensaje(
        e instanceof ErrorQr ? e.message : 'No pudimos leer ese código. Probá de nuevo.'
      );
      // Esperamos un momento antes de aceptar otra lectura, para que se alcance a leer el aviso.
      setTimeout(() => {
        ocupado.current = false;
      }, 1500);
    } finally {
      setLeyendo(false);
    }
  }

  // Todavía no se sabe si hay permiso
  if (!permiso) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.texto}>Preparando la cámara...</Text>
      </View>
    );
  }

  // Sin permiso: la app sigue funcionando con la carga manual
  if (!permiso.granted) {
    return (
      <ScrollView contentContainerStyle={styles.centrado}>
        <Text style={styles.titulo} accessibilityRole="header">
          Necesitamos la cámara
        </Text>
        <Text style={styles.texto}>
          Para leer el código QR del cartel hace falta el permiso de la cámara. Si preferís, podés
          registrar tu visita a mano desde Mi recorrido.
        </Text>
        {permiso.canAskAgain ? (
          <Pressable style={styles.boton} onPress={pedirPermiso} accessibilityRole="button">
            <Text style={styles.textoBoton}>Dar permiso</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.boton} onPress={() => Linking.openSettings()} accessibilityRole="button">
            <Text style={styles.textoBoton}>Abrir ajustes</Text>
          </Pressable>
        )}
        <Pressable style={styles.botonSecundario} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.textoBotonSecundario}>Volver</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={styles.contenedor}>
      <CameraView
        style={styles.camara}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => procesar(data)}
      />

      <ScrollView
        style={styles.panelScroll}
        contentContainerStyle={styles.panel}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo} accessibilityRole="header">
          Apuntá al código QR del cartel
        </Text>
        {leyendo && <Text style={styles.texto}>Leyendo código...</Text>}
        {mensaje && (
          <Text style={styles.error} accessibilityRole="alert">
            {mensaje}
          </Text>
        )}

        {/* Solo en desarrollo: sirve para probar en el emulador, que no tiene un cartel para escanear. */}
        {__DEV__ && (
          <View style={styles.prueba}>
            <Text style={styles.textoChico}>Solo para pruebas (no aparece en la app final)</Text>
            <TextInput
              style={styles.entrada}
              placeholder="Por ejemplo: COLON:lug-004"
              value={codigoPrueba}
              onChangeText={setCodigoPrueba}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={styles.botonSecundario}
              onPress={() => {
                ocupado.current = false;
                procesar(codigoPrueba);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.textoBotonSecundario}>Probar este código</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camara: {
    flex: 1,
  },
  panelScroll: {
    flexGrow: 0,
    maxHeight: '55%',
    backgroundColor: '#FFFFFF',
  },
  panel: {
    padding: 20,
    gap: 10,
  },
  centrado: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#176B87',
  },
  texto: {
    fontSize: 17,
    color: '#333333',
    lineHeight: 24,
  },
  textoChico: {
    fontSize: 13,
    color: '#666666',
  },
  error: {
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F5C2BD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#B3261E',
  },
  prueba: {
    gap: 8,
    marginTop: 6,
  },
  entrada: {
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#D5E5EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  boton: {
    backgroundColor: '#176B87',
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botonSecundario: {
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#176B87',
    minHeight: 52,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonSecundario: {
    color: '#176B87',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});