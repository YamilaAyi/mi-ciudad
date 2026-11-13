import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Evento, Lugar } from '../tipos/entities';
import { obtenerUsuarioActual } from '../servicios/auth';
import {
  obtenerEventosGuardados,
  quitarEventoGuardado,
} from '../servicios/eventos';
import { obtenerLugares } from '../servicios/lugares';
import { sincronizarAvisosEventos, cancelarAvisoEvento } from '../servicios/notificaciones-eventos';

function obtenerFecha(fecha: string) {
  return new Date(fecha);
}

function nombreDia(fecha: string) {
  return obtenerFecha(fecha).toLocaleDateString('es-AR', {
    weekday: 'short',
  }).replace('.', '');
}

function numeroDia(fecha: string) {
  return obtenerFecha(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
  });
}

function nombreMes(fecha: string) {
  return obtenerFecha(fecha).toLocaleDateString('es-AR', {
    month: 'short',
  }).replace('.', '');
}

function horaEvento(fecha: string) {
  return obtenerFecha(fecha).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function estadoEvento(estado: Evento['estado']) {
  if (estado === 'suspendido') {
    return { texto: 'Suspendido', color: '#B7791F', fondo: '#FFF4D8' };
  }

  return { texto: 'Programado', color: '#21865B', fondo: '#E5F5EC' };
}

function obtenerUbicacionEvento(evento: Evento, lugares: Lugar[]): string {
  if (evento.direccionLibre?.trim()) {
    return evento.direccionLibre.trim();
  }

  if (evento.lugarId) {
    const lugar = lugares.find((item) => item.id === evento.lugarId);

    if (lugar) {
      const nombre = lugar.nombre?.trim();
      const direccion = lugar.direccion?.trim();

      if (nombre && direccion) return `${nombre} · ${direccion}`;
      if (nombre) return nombre;
    }
  }

  return 'Ubicación a confirmar';
}

export default function MisEventosScreen() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [quitando, setQuitando] = useState<string | null>(null);

  const cargarEventos = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const usuario = await obtenerUsuarioActual();

      if (!usuario) {
        Alert.alert(
          'Iniciá sesión',
          'Necesitás ingresar a tu cuenta para ver tus eventos guardados.',
          [
            {
              text: 'Iniciar sesión',
              onPress: () => router.replace('/login'),
            },
            {
              text: 'Volver',
              style: 'cancel',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }

      const resultado = await obtenerEventosGuardados();
      const ahora = new Date();

      const proximos = resultado
        .filter((evento) => {
          const fechaInicio = obtenerFecha(evento.inicio);

          return (
            fechaInicio.getTime() >= ahora.getTime() &&
            (evento.estado === 'programado' ||
              evento.estado === 'suspendido')
          );
        })
        .sort(
          (a, b) =>
            obtenerFecha(a.inicio).getTime() -
            obtenerFecha(b.inicio).getTime()
        );

      setEventos(proximos);
      await sincronizarAvisosEventos(resultado);


      try {
        const catalogo = await obtenerLugares();
        setLugares(catalogo);
      } catch {
        setLugares([]);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudieron cargar tus eventos guardados.'
      );
    } finally {
      setCargando(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void cargarEventos();
    }, [cargarEventos])
  );

  async function quitarEvento(evento: Evento) {
    Alert.alert(
      'Quitar evento',
      `¿Querés quitar "${evento.titulo}" de tus eventos guardados?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            setQuitando(evento.id);

            try {
              await quitarEventoGuardado(evento.id);
              await cancelarAvisoEvento(evento.id);
              setEventos((actuales) =>
                actuales.filter((item) => item.id !== evento.id)
              );
              Alert.alert(
                'Evento quitado',
                'Se quitó de tus eventos guardados.'
              );
            } catch (e) {
              Alert.alert(
                'No se pudo quitar',
                e instanceof Error ? e.message : 'Intentá nuevamente.'
              );
            } finally {
              setQuitando(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.encabezado}>
          <Text style={styles.titulo}>Mis eventos</Text>
          <Text style={styles.subtitulo}>
            Organizá las actividades que guardaste para disfrutar en Colón.
          </Text>
        </View>

        <View style={styles.resumen}>
          <View style={styles.resumenIcono}>
            <Ionicons name="calendar" size={22} color="#176B87" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resumenTitulo}>Tu agenda</Text>
            <Text style={styles.resumenTexto}>
              {eventos.length === 1
                ? 'Tenés 1 próximo evento guardado'
                : `Tenés ${eventos.length} próximos eventos guardados`}
            </Text>
          </View>
        </View>

        {cargando ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color="#176B87" />
            <Text style={styles.secundario}>Cargando tu agenda...</Text>
          </View>
        ) : error ? (
          <View style={styles.vacio}>
            <Ionicons name="cloud-offline-outline" size={42} color="#C94343" />
            <Text style={styles.mensaje}>{error}</Text>
            <Pressable onPress={cargarEventos} style={styles.botonPrincipal}>
              <Text style={styles.textoBotonPrincipal}>Reintentar</Text>
            </Pressable>
          </View>
        ) : eventos.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="calendar-outline" size={52} color="#176B87" />
            <Text style={styles.mensaje}>
              No tenés próximos eventos guardados
            </Text>
            <Text style={styles.secundario}>
              Explorá la agenda y guardá las actividades que quieras disfrutar.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/agenda')}
              style={styles.botonPrincipal}
            >
              <Text style={styles.textoBotonPrincipal}>Explorar agenda</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.lista}>
            <Text style={styles.etiquetaLista}>PRÓXIMAS ACTIVIDADES</Text>

            {eventos.map((evento) => {
              const estado = estadoEvento(evento.estado);

              return (
                <View key={evento.id} style={styles.filaAgenda}>
                  <View style={styles.fechaColumna}>
                    <Text style={styles.diaSemana}>
                      {nombreDia(evento.inicio)}
                    </Text>
                    <Text style={styles.numeroDia}>
                      {numeroDia(evento.inicio)}
                    </Text>
                    <Text style={styles.mes}>
                      {nombreMes(evento.inicio)}
                    </Text>
                    <View style={styles.lineaTiempo} />
                  </View>

                  <View style={styles.tarjeta}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/evento/[id]',
                          params: { id: evento.id },
                        })
                      }
                      style={({ pressed }) =>
                        pressed && styles.presionado
                      }
                    >
                      <View style={styles.tarjetaEncabezado}>
                        <View
                          style={[
                            styles.estado,
                            { backgroundColor: estado.fondo },
                          ]}
                        >
                          <View
                            style={[
                              styles.puntoEstado,
                              { backgroundColor: estado.color },
                            ]}
                          />
                          <Text
                            style={[
                              styles.textoEstado,
                              { color: estado.color },
                            ]}
                          >
                            {estado.texto}
                          </Text>
                        </View>
                        <Text style={styles.hora}>
                          {horaEvento(evento.inicio)}
                        </Text>
                      </View>

                      <Text style={styles.tituloEvento}>
                        {evento.titulo}
                      </Text>

                      <Text style={styles.descripcion}>
                        {evento.descripcion}
                      </Text>

                      <View style={styles.dato}>
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color="#176B87"
                        />
                        <Text style={styles.textoDato} numberOfLines={2}>
                          {obtenerUbicacionEvento(evento, lugares)}
                        </Text>
                      </View>

                      <View style={styles.dato}>
                        <Ionicons
                          name="ticket-outline"
                          size={16}
                          color="#176B87"
                        />
                        <Text style={styles.textoDato}>
                          {evento.precio === 0
                            ? 'Gratis'
                            : evento.precio === null
                              ? 'Consultar precio'
                              : `$${evento.precio.toLocaleString('es-AR')}`}
                        </Text>
                      </View>

                      {evento.fin && (
                        <View style={styles.dato}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color="#176B87"
                          />
                          <Text style={styles.textoDato}>
                            Hasta las {horaEvento(evento.fin)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.verDetalle}>
                        <Text style={styles.textoDetalle}>Ver detalle</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="#176B87"
                        />
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => quitarEvento(evento)}
                      disabled={quitando === evento.id}
                      style={styles.botonQuitar}
                    >
                      {quitando === evento.id ? (
                        <ActivityIndicator color="#C94343" />
                      ) : (
                        <>
                          <Ionicons
                            name="bookmark"
                            size={16}
                            color="#C94343"
                          />
                          <Text style={styles.textoQuitar}>
                            Quitar de mi agenda
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F4F7F8',
  },
  contenido: {
    padding: 18,
    paddingBottom: 35,
  },
  encabezado: {
    marginTop: 12,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#176B87',
  },
  subtitulo: {
    fontSize: 15,
    color: '#65747B',
    marginTop: 7,
    lineHeight: 22,
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F3F6',
    padding: 15,
    borderRadius: 14,
    marginBottom: 25,
    gap: 12,
  },
  resumenIcono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumenTitulo: {
    color: '#243B45',
    fontSize: 15,
    fontWeight: 'bold',
  },
  resumenTexto: {
    color: '#65747B',
    fontSize: 13,
    marginTop: 3,
  },
  etiquetaLista: {
    color: '#65747B',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 17,
  },
  lista: {
    paddingBottom: 10,
  },
  filaAgenda: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 17,
  },
  fechaColumna: {
    width: 55,
    alignItems: 'center',
    paddingTop: 10,
    marginRight: 10,
  },
  diaSemana: {
    color: '#65747B',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  numeroDia: {
    color: '#176B87',
    fontSize: 27,
    fontWeight: 'bold',
    marginTop: 2,
  },
  mes: {
    color: '#65747B',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  lineaTiempo: {
    flex: 1,
    width: 2,
    backgroundColor: '#D5E5E9',
    marginTop: 12,
  },
  tarjeta: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5EAED',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  tarjetaEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  puntoEstado: {
    width: 7,
    height: 7,
    borderRadius: 5,
  },
  textoEstado: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  hora: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#176B87',
  },
  tituloEvento: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#243B45',
    marginBottom: 7,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 20,
    color: '#65747B',
    marginBottom: 10,
  },
  dato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  textoDato: {
    flex: 1,
    fontSize: 12,
    color: '#42545C',
  },
  verDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#EDF0F2',
    gap: 5,
  },
  textoDetalle: {
    color: '#176B87',
    fontWeight: 'bold',
    fontSize: 12,
  },
  botonQuitar: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F0D5D5',
    borderRadius: 9,
    padding: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  textoQuitar: {
    color: '#C94343',
    fontSize: 12,
    fontWeight: '600',
  },
  presionado: {
    opacity: 0.7,
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 65,
    gap: 12,
  },
  vacio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 55,
    gap: 12,
  },
  mensaje: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#243B45',
    textAlign: 'center',
  },
  secundario: {
    fontSize: 14,
    color: '#65747B',
    textAlign: 'center',
    lineHeight: 21,
  },
  botonPrincipal: {
    backgroundColor: '#176B87',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
