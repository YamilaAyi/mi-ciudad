import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import AvisoDatosGuardados from '../../components/AvisoDatosGuardados';
import EtiquetaVisita from '../../components/EtiquetaVisita';
import FotoVisita from '../../components/FotoVisita';
import ResumenProgreso from '../../components/ResumenProgreso';
import { ErrorApi } from '../../servicios/cliente';
import { obtenerLugares, usandoCacheLugares } from '../../servicios/lugares';
import { obtenerVisitas, usandoCacheVisitas } from '../../servicios/visitas';
import type { Lugar, Visita } from '../../tipos/entities';
import { formatearFecha } from '../../utilidades/fechas';

type Pestania = 'visitados' | 'pendientes';

function mensajeDeError(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return 'Algo salió mal. Probá de nuevo.';
}

export default function RecorridoScreen() {
  const [pestania, setPestania] = useState<Pestania>('visitados');
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sinSesion, setSinSesion] = useState(false);
  const [lugaresFallaron, setLugaresFallaron] = useState(false);
  const [mostrandoGuardado, setMostrandoGuardado] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async (conIndicador: boolean) => {
    if (conIndicador) setCargando(true);
    setError(null);
    setSinSesion(false);
    setLugaresFallaron(false);
    setMostrandoGuardado(false);

    let visitasCargadas = false;
    try {
      setVisitas(await obtenerVisitas());
      visitasCargadas = true;
    } catch (e) {
      setVisitas([]);
      if (e instanceof ErrorApi && e.codigo === 'NO_AUTENTICADO') {
        setSinSesion(true);
      } else {
        setError(mensajeDeError(e));
      }
    }

    let lugaresCargados = false;
    try {
      setLugares(await obtenerLugares());
      lugaresCargados = true;
    } catch {
      // sin conexión y sin catálogo guardado: se ven las visitas, sin el nombre del lugar
      setLugaresFallaron(true);
    }

    // Aviso: lo que se está viendo viene de la copia guardada en el teléfono.
    setMostrandoGuardado(
      (visitasCargadas && usandoCacheVisitas) || (lugaresCargados && usandoCacheLugares)
    );
    setCargando(false);
  }, []);

  // Se ejecuta cada vez que la pantalla aparece (no solo la primera vez)
  useFocusEffect(
    useCallback(() => {
      cargar(false);
    }, [cargar])
  );

  // Deslizar la lista hacia abajo para actualizar y sincronizar.
  async function alDeslizar() {
    setRefrescando(true);
    await cargar(false);
    setRefrescando(false);
  }

  // Más recientes primero
  const visitasOrdenadas = [...visitas].sort(
    (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
  );

  // Lugares activos que todavía no tienen ninguna visita (sin sesión no se puede saber)
  const idsVisitados = new Set(visitas.map((v) => v.lugarId));
  const lugaresActivos = lugares.filter((l) => l.activo);
  const pendientes = sinSesion ? [] : lugaresActivos.filter((l) => !idsVisitados.has(l.id));

  // Para el resumen: cada lugar cuenta una sola vez, aunque tenga varias visitas.
  const lugaresVisitados = lugaresActivos.filter((l) => idsVisitados.has(l.id)).length;
  const mostrarResumen =
    !cargando && !sinSesion && !error && !lugaresFallaron && lugaresActivos.length > 0;

  function nombreDelLugar(lugarId: string): string {
    return lugares.find((l) => l.id === lugarId)?.nombre ?? 'Lugar no disponible';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo} accessibilityRole="header">
        Mi recorrido
      </Text>

      {mostrarResumen && (
        <ResumenProgreso visitados={lugaresVisitados} total={lugaresActivos.length} />
      )}

      <Pressable
        style={styles.botonQr}
        onPress={() => router.push('/escanear-qr')}
        accessibilityRole="button"
      >
        <Text style={styles.textoBotonQr}>Escanear código QR</Text>
      </Pressable>

      <View style={styles.pestanias}>
        <Pressable
          style={[styles.pestania, pestania === 'visitados' && styles.pestaniaActiva]}
          onPress={() => setPestania('visitados')}
          accessibilityRole="tab"
          accessibilityState={{ selected: pestania === 'visitados' }}
        >
          <Text style={[styles.textoPestania, pestania === 'visitados' && styles.textoPestaniaActiva]}>
            Visitados ({visitas.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.pestania, pestania === 'pendientes' && styles.pestaniaActiva]}
          onPress={() => setPestania('pendientes')}
          accessibilityRole="tab"
          accessibilityState={{ selected: pestania === 'pendientes' }}
        >
          <Text style={[styles.textoPestania, pestania === 'pendientes' && styles.textoPestaniaActiva]}>
            Pendientes ({pendientes.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={alDeslizar}
            colors={['#176B87']}
            tintColor="#176B87"
          />
        }
      >
        {!cargando && !sinSesion && !error && mostrandoGuardado && (
          <AvisoDatosGuardados onReintentar={() => cargar(true)} />
        )}

        {cargando && <Text style={styles.vacio}>Cargando...</Text>}

        {!cargando && sinSesion && (
          <View style={styles.cuadroSesion} accessibilityRole="alert">
            <Text style={styles.textoSesion}>
              Ingresá a tu cuenta para ver y guardar tu recorrido. Podés seguir mirando el mapa y los
              lugares sin cuenta.
            </Text>
            <Pressable
              style={styles.botonIngresar}
              onPress={() => router.push('/login')}
              accessibilityRole="button"
            >
              <Text style={styles.textoBotonIngresar}>Ingresar</Text>
            </Pressable>
          </View>
        )}

        {!cargando && error && (
          <View style={styles.cuadroError} accessibilityRole="alert">
            <Text style={styles.textoError}>{error}</Text>
            <Pressable
              style={styles.botonReintentar}
              onPress={() => cargar(true)}
              accessibilityRole="button"
            >
              <Text style={styles.textoBotonReintentar}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {!cargando && !error && !sinSesion && pestania === 'visitados' && visitasOrdenadas.length === 0 && (
          <View style={styles.estadoVacio}>
            <Ionicons name="map-outline" size={48} color="#176B87" />
            <Text style={styles.tituloVacio}>Todavía no registraste ninguna visita</Text>
            <Text style={styles.textoVacio}>
              Explorá los lugares de Colón y registrá tu primera visita, con foto, nota, GPS o código
              QR.
            </Text>
            <Pressable
              style={styles.botonExplorar}
              onPress={() => router.push('/lugares')}
              accessibilityRole="button"
            >
              <Text style={styles.textoBotonExplorar}>Explorar lugares</Text>
            </Pressable>
          </View>
        )}

        {!cargando && pestania === 'visitados' &&
          visitasOrdenadas.map((visita) => (
            <Pressable
              key={visita.id}
              style={styles.tarjetaVisita}
              onPress={() =>
                router.push({
                  pathname: '/visita/[id]',
                  params: { id: visita.id },
                })
              }
              accessibilityRole="button"
            >
              <FotoVisita uri={visita.fotoUri} estilo={styles.miniatura} textoChico />

              <View style={styles.textosVisita}>
                <Text style={styles.nombre} numberOfLines={3}>
                  {nombreDelLugar(visita.lugarId)}
                </Text>
                <Text style={styles.detalle}>{formatearFecha(visita.fechaHora)}</Text>
                <EtiquetaVisita visitado />
                {!visita.sincronizada && (
                  <Text style={styles.aviso}>Pendiente de sincronizar</Text>
                )}
              </View>
            </Pressable>
          ))}

        {!cargando && !sinSesion && pestania === 'pendientes' && lugaresFallaron && (
          <View style={styles.cuadroError} accessibilityRole="alert">
            <Text style={styles.textoError}>
              No pudimos cargar los lugares. Abrí la app una vez con conexión para tenerlos guardados.
            </Text>
            <Pressable
              style={styles.botonReintentar}
              onPress={() => cargar(true)}
              accessibilityRole="button"
            >
              <Text style={styles.textoBotonReintentar}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {!cargando && !sinSesion && pestania === 'pendientes' && !lugaresFallaron && pendientes.length === 0 && (
          <Text style={styles.vacio}>¡Visitaste todos los lugares!</Text>
        )}

        {!cargando && pestania === 'pendientes' &&
          pendientes.map((lugar) => (
            <Pressable
              key={lugar.id}
              style={styles.tarjeta}
              onPress={() =>
                router.push({
                  pathname: '/detalle',
                  params: { id: lugar.id },
                })
              }
              accessibilityRole="button"
            >
              <Text style={styles.nombre} numberOfLines={3}>
                {lugar.nombre}
              </Text>
              <Text style={styles.detalle} numberOfLines={3}>
                {lugar.descripcionCorta}
              </Text>
              <EtiquetaVisita visitado={false} />

              <Pressable
                style={styles.botonRegistrar}
                onPress={() =>
                  router.push({
                    pathname: '/registrar-visita',
                    params: { lugarId: lugar.id },
                  })
                }
                accessibilityRole="button"
              >
                <Text style={styles.textoBotonRegistrar}>Visitar</Text>
              </Pressable>
            </Pressable>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#176B87',
  },
  botonQr: {
    backgroundColor: '#176B87',
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  textoBotonQr: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pestanias: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  pestania: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#F0F7FA',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pestaniaActiva: {
    backgroundColor: '#176B87',
  },
  textoPestania: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#176B87',
    textAlign: 'center',
  },
  textoPestaniaActiva: {
    color: '#FFFFFF',
  },
  lista: {
    paddingVertical: 16,
    gap: 12,
  },
  tarjeta: {
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#D5E5EB',
    borderRadius: 12,
    padding: 16,
  },
  tarjetaVisita: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#D5E5EB',
    borderRadius: 12,
    padding: 12,
  },
  miniatura: {
    width: 84,
    height: 84,
    borderRadius: 10,
  },
  textosVisita: {
    flex: 1,
    justifyContent: 'center',
  },
  nombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  detalle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  aviso: {
    fontSize: 14,
    color: '#B26A00',
    marginTop: 6,
  },
  botonRegistrar: {
    backgroundColor: '#176B87',
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  textoBotonRegistrar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cuadroSesion: {
    backgroundColor: '#E8F4F8',
    borderWidth: 1,
    borderColor: '#B7D9E4',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  textoSesion: {
    fontSize: 16,
    color: '#0F4C5C',
    lineHeight: 22,
  },
  botonIngresar: {
    backgroundColor: '#176B87',
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonIngresar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cuadroError: {
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F5C2BD',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  textoError: {
    fontSize: 16,
    color: '#B3261E',
    lineHeight: 22,
  },
  botonReintentar: {
    backgroundColor: '#B3261E',
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonReintentar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  estadoVacio: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  tituloVacio: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  textoVacio: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  botonExplorar: {
    alignSelf: 'stretch',
    backgroundColor: '#176B87',
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  textoBotonExplorar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  vacio: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#666666',
  },
});