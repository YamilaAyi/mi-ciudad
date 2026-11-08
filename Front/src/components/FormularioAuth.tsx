import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ingresar,
  ingresarConBiometria,
  obtenerEstadoBiometrico,
  registrar,
} from '../servicios/auth';

type ModoAuth = 'ingreso' | 'registro';

export function FormularioAuth({ modo }: { modo: ModoAuth }) {
  const router = useRouter();
  const esRegistro = modo === 'registro';
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sesionGuardada, setSesionGuardada] = useState(false);
  const [biometriaDisponible, setBiometriaDisponible] = useState(false);
  const [comprobandoSesion, setComprobandoSesion] = useState(!esRegistro);
  const [usarContrasena, setUsarContrasena] = useState(false);
  const promptBiometricoIniciado = useRef(false);

  useEffect(() => {
    if (esRegistro) return;
    let activo = true;
    async function comprobarSesion() {
      try {
        const estado = await obtenerEstadoBiometrico();
        if (!activo) return;
        setSesionGuardada(estado.sesionGuardada);
        setBiometriaDisponible(estado.disponible);

        if (estado.disponible && !promptBiometricoIniciado.current) {
          promptBiometricoIniciado.current = true;
          setCargando(true);
          setError(null);
          try {
            await ingresarConBiometria();
            if (activo) router.replace('/(tabs)/perfil');
          } catch (biometricError) {
            if (activo) {
              setError(
                biometricError instanceof Error
                  ? biometricError.message
                  : 'No se pudo completar el ingreso biométrico.'
              );
            }
          } finally {
            if (activo) setCargando(false);
          }
        }
      } catch (stateError) {
        if (activo) {
          setError(
            stateError instanceof Error
              ? stateError.message
              : 'No se pudo comprobar la autenticación biométrica.'
          );
        }
      } finally {
        if (activo) setComprobandoSesion(false);
      }
    }

    void comprobarSesion();

    return () => {
      activo = false;
    };
  }, [esRegistro, router]);

  async function enviarFormulario() {
    setError(null);
    setCargando(true);

    try {
      if (esRegistro) {
        await registrar(nombre, email, contrasena);
      } else if (biometriaDisponible && !usarContrasena) {
        await ingresarConBiometria();
      } else {
        await ingresar(email, contrasena);
      }
      router.replace('/(tabs)/perfil');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo completar la operación.'
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!comprobandoSesion && !sesionGuardada && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)/perfil')}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹ Volver al perfil</Text>
          </Pressable>
        )}

        <View style={styles.card}>
          <Text style={styles.title}>
            {esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
          </Text>
          <Text style={styles.description}>
            {esRegistro
              ? 'Registrate para guardar tus lugares favoritos.'
              : 'Ingresá para ver y guardar tus lugares favoritos.'}
          </Text>

          {esRegistro && (
            <TextInput
              accessibilityLabel="Nombre"
              autoCapitalize="words"
              onChangeText={setNombre}
              placeholder="Nombre"
              returnKeyType="next"
              style={styles.input}
              value={nombre}
            />
          )}

          {(esRegistro || !biometriaDisponible || usarContrasena) && (
            <>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Email"
                returnKeyType="next"
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />

              <TextInput
                accessibilityLabel="Contraseña"
                autoCapitalize="none"
                autoComplete={esRegistro ? 'new-password' : 'password'}
                onChangeText={setContrasena}
                onSubmitEditing={enviarFormulario}
                placeholder="Contraseña"
                returnKeyType="done"
                secureTextEntry
                style={styles.input}
                textContentType={esRegistro ? 'newPassword' : 'password'}
                value={contrasena}
              />
            </>
          )}

          {error && (
            <View accessibilityRole="alert" style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={cargando}
            onPress={enviarFormulario}
            style={[styles.primaryButton, cargando && styles.disabledButton]}
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.primaryButtonContent}>
                {!esRegistro && biometriaDisponible && !usarContrasena && (
                  <Ionicons name="finger-print-outline" size={22} color="#FFFFFF" />
                )}
                <Text style={styles.primaryButtonText}>
                  {esRegistro
                    ? 'Crear cuenta'
                    : biometriaDisponible && !usarContrasena
                      ? 'Ingresar con huella o rostro'
                      : 'Iniciar sesión'}
                </Text>
              </View>
            )}
          </Pressable>

          {!esRegistro && biometriaDisponible && (
            <Pressable
              accessibilityRole="button"
              disabled={cargando}
              onPress={() => {
                setError(null);
                setUsarContrasena((actual) => !actual);
              }}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {usarContrasena ? 'Volver al ingreso con huella o rostro' : 'Ingresar con email y contraseña'}
              </Text>
            </Pressable>
          )}

          {!esRegistro && sesionGuardada && !biometriaDisponible && (
            <Text style={styles.fallbackText}>
              Este dispositivo no tiene biometría configurada. Ingresá con email y contraseña.
            </Text>
          )}

          {(!sesionGuardada || esRegistro) && (
            <Pressable
              accessibilityRole="button"
              disabled={cargando}
              onPress={() => router.push(esRegistro ? '/login' : '/registro')}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {esRegistro
                  ? '¿Ya tenés cuenta? Iniciá sesión'
                  : '¿No tenés cuenta? Creá una'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  backButton: { alignSelf: 'flex-start', marginBottom: 20, paddingVertical: 8 },
  backText: { color: '#176B87', fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
  },
  title: { color: '#0F172A', fontSize: 26, fontWeight: '700' },
  description: { color: '#64748B', fontSize: 15, lineHeight: 22, marginTop: 8 },
  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    marginTop: 16,
    padding: 12,
  },
  errorText: { color: '#B91C1C', fontSize: 14 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#176B87',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 50,
  },
  primaryButtonContent: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  fallbackText: { color: '#64748B', fontSize: 13, lineHeight: 18, marginTop: 14 },
  switchButton: { alignItems: 'center', marginTop: 18, padding: 8 },
  switchText: { color: '#176B87', fontSize: 14, fontWeight: '600' },
});
