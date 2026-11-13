import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  cerrarSesion,
  obtenerUsuarioActual,
} from '../../servicios/auth';
import { alternarFavorito, obtenerFavoritos } from '../../servicios/favoritos';
import type { LugarResumen, Usuario } from '../../tipos/usuario';

// Reúne el acceso a la cuenta y la lista personal de lugares favoritos.
export default function PerfilFavoritosScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [lugaresFavoritos, setLugaresFavoritos] = useState<LugarResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const usr = await obtenerUsuarioActual();
      setUsuario(usr);

      if (usr) {
        const { lugares } = await obtenerFavoritos();
        setLugaresFavoritos(lugares);
      } else {
        setLugaresFavoritos([]);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar tus favoritos.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarDatos();
    }, [cargarDatos])
  );

  async function handleQuitarFavorito(lugarId: string) {
    if (!usuario) return;
    try {
      await alternarFavorito(lugarId, true);
      setLugaresFavoritos((prev) => prev.filter((l) => l.id !== lugarId));
    } catch (favoriteError) {
      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : 'No se pudo sacar de favoritos.'
      );
    }
  }

  async function handleCerrarSesion() {
    try {
      await cerrarSesion();
      setUsuario(null);
      setLugaresFavoritos([]);
      setError(null);
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : 'No se pudo cerrar la sesión.'
      );
    }
  }

  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1D63DC" />
        <Text style={styles.helperText}>Cargando tu cuenta y favoritos...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={84} color="#94A3B8" />
        <Text style={styles.emptyTitle}>Guardá tus lugares favoritos</Text>
        <Text style={styles.helperText}>
          Iniciá sesión o creá tu cuenta para guardar favoritos y conservar tu recorrido.
        </Text>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void cargarDatos()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/registro')}
        >
          <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="heart" size={24} color="#0F172A" />
        <Text style={styles.headerTitle}>Mis favoritos</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>
            {usuario.nombre.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{usuario.nombre}</Text>
          <Text style={styles.userEmail}>{usuario.email}</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Cerrar sesión"
          onPress={() => void handleCerrarSesion()}
          style={styles.logoutBtn}
        >
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.eventosButton}
        onPress={() => router.push('/mis-eventos')}
        accessibilityRole="button"
        accessibilityLabel="Ver mis eventos guardados"
      >
        <View style={styles.eventosIcono}>
          <Ionicons name="calendar-outline" size={23} color="#176B87" />
        </View>
        <View style={styles.eventosInfo}>
          <Text style={styles.eventosTitulo}>Mis eventos</Text>
          <Text style={styles.eventosSubtitulo}>
            Consultá las actividades que guardaste.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={21} color="#176B87" />
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void cargarDatos()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {lugaresFavoritos.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="heart-dislike-outline" size={56} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Todavía no tenés favoritos</Text>
          <Text style={styles.helperText}>
            Tocá el corazón en el detalle de un lugar turístico para guardarlo acá.
          </Text>
        </View>
      ) : (
        <FlatList
          data={lugaresFavoritos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Ver detalle de ${item.nombre}`}
                onPress={() =>
                  router.push({
                    pathname: '/detalle',
                    params: { id: item.id },
                  })
                }
                style={styles.cardOpen}
              >
                <Image
                  source={
                    item.imagenes[0]
                      ? { uri: item.imagenes[0] }
                      : require('../../../assets/images/molino-forclaz.jpg')
                  }
                  style={styles.cardImage}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.nombre}</Text>
                  <Text style={styles.cardCategory}>
                    {item.categoriaId.replace('cat-', '').replaceAll('-', ' ')}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel={`Quitar ${item.nombre} de favoritos`}
                onPress={() => void handleQuitarFavorito(item.id)}
                style={styles.heartButton}
              >
                <Ionicons name="heart" size={22} color="#E53935" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: 56 },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: '#1D63DC' },
  userName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  userEmail: { fontSize: 14, color: '#64748B' },
  logoutBtn: { padding: 8 },
  eventosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  eventosIcono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E7F3F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventosInfo: { flex: 1 },
  eventosTitulo: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  eventosSubtitulo: { fontSize: 13, color: '#64748B', marginTop: 3 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardOpen: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cardImage: { width: 72, height: 72, borderRadius: 10, marginRight: 14 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  cardCategory: { fontSize: 14, color: '#64748B' },
  heartButton: { padding: 8, marginRight: 4 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginTop: 12, textAlign: 'center' },
  helperText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#1D63DC',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1D63DC',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: '#1D63DC', fontSize: 16, fontWeight: '700' },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { color: '#B91C1C', fontSize: 14, flex: 1 },
  retryText: { color: '#B91C1C', fontWeight: '700', marginLeft: 12 },
});
