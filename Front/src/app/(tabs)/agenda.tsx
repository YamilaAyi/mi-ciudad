import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Evento, EstadoEvento, Lugar } from '../../tipos/entities';
import { obtenerEventos } from '../../servicios/eventos';
import { obtenerLugares } from '../../servicios/lugares';

const AZUL = '#176B87';

const COLORES_ESTADO: Record<EstadoEvento, string> = {
  programado: '#21865B',
  suspendido: '#D18A24',
  cancelado: '#C94343',
  finalizado: '#777777',
};

const ETIQUETAS_ESTADO: Record<EstadoEvento, string> = {
  programado: 'Programado',
  suspendido: 'Suspendido',
  cancelado: 'Cancelado',
  finalizado: 'Finalizado',
};

function obtenerUbicacionEvento(evento: Evento, lugares: Lugar[]): string {
  if (evento.direccionLibre?.trim()) {
    return evento.direccionLibre.trim();
  }

  if (evento.lugarId) {
    const lugar = lugares.find((item) => item.id === evento.lugarId);

    if (lugar) {
      const nombre = lugar.nombre?.trim();
      const direccion = lugar.direccion?.trim();

      if (nombre && direccion) {
        return `${nombre} · ${direccion}`;
      }

      if (nombre) {
        return nombre;
      }
    }
  }

  return 'Ubicación a confirmar';
}

function claveFecha(fecha: string): string {
  const date = new Date(fecha);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatearDia(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
  });
}

function formatearNumeroDia(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
  });
}

function formatearMes(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    month: 'short',
  }).replace('.', '');
}

function formatearHora(fecha: string): string {
  return new Date(fecha).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatearPrecio(precio: number | null): string {
  if (precio === 0) return 'Gratis';
  if (precio === null) return 'Consultar precio';
  return `$${precio.toLocaleString('es-AR')}`;
}

function agruparEventos(eventos: Evento[]) {
  const grupos = new Map<string, Evento[]>();

  [...eventos]
    .sort(
      (a, b) =>
        new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
    )
    .forEach((evento) => {
      const clave = claveFecha(evento.inicio);
      const grupo = grupos.get(clave) || [];
      grupo.push(evento);
      grupos.set(clave, grupo);
    });

  return Array.from(grupos.entries()).map(([clave, items]) => ({
    clave,
    fecha: items[0].inicio,
    eventos: items,
  }));
}

function TarjetaEvento({
  evento,
  lugares,
}: {
  evento: Evento;
  lugares: Lugar[];
}) {
  const ubicacion = obtenerUbicacionEvento(evento, lugares);
  const lugar = evento.lugarId
    ? lugares.find((item) => item.id === evento.lugarId)
    : undefined;

  const imagen =
    lugar?.imagenes?.find((url) => url?.trim()) ||
    evento.imagenUrl?.trim() ||
    null;

  const colorEstado = COLORES_ESTADO[evento.estado];

  return (
    <View style={styles.tarjeta}>
      {imagen ? (
        <Image
          source={{ uri: imagen }}
          style={styles.imagenEvento}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.contenidoTarjeta}>
        <View style={styles.filaSuperior}>
          <View style={styles.horaContenedor}>
            <Ionicons name="time-outline" size={15} color={AZUL} />
            <Text style={styles.hora}>
              {formatearHora(evento.inicio)}
              {evento.fin ? ` - ${formatearHora(evento.fin)}` : ''}
            </Text>
          </View>

          <View
            style={[
              styles.estado,
              { backgroundColor: `${colorEstado}16` },
            ]}
          >
            <View
              style={[
                styles.puntoEstado,
                { backgroundColor: colorEstado },
              ]}
            />
            <Text style={[styles.textoEstado, { color: colorEstado }]}>
              {ETIQUETAS_ESTADO[evento.estado]}
            </Text>
          </View>
        </View>

        <Text style={styles.tituloEvento}>{evento.titulo}</Text>

        {!!evento.descripcion && (
          <Text style={styles.descripcion} numberOfLines={3}>
            {evento.descripcion}
          </Text>
        )}

        <View style={styles.separador} />

        <View style={styles.filaDatos}>
          <View style={styles.datoUbicacion}>
            <Ionicons name="location-outline" size={17} color="#71828A" />
            <Text style={styles.textoDato} numberOfLines={1}>
              {ubicacion}
            </Text>
          </View>

          <View style={styles.datoPrecio}>
            <Ionicons name="ticket-outline" size={16} color="#71828A" />
            <Text style={styles.textoPrecio}>
              {formatearPrecio(evento.precio)}
            </Text>
          </View>
        </View>

        <View style={styles.verDetalle}>
          <Text style={styles.textoVerDetalle}>Conocer el evento</Text>
          <Ionicons name="arrow-forward" size={16} color={AZUL} />
        </View>
      </View>
    </View>
  );
}

export default function AgendaScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');

  const cargarEventos = useCallback(async (esActualizacion = false) => {
    if (esActualizacion) {
      setActualizando(true);
    } else {
      setCargando(true);
    }

    setError('');

    try {
      const resultado = await obtenerEventos();
      setEventos(resultado);

      try {
        const catalogo = await obtenerLugares();
        setLugares(catalogo);
      } catch {
        // Si falla el catálogo, la agenda de eventos sigue funcionando.
        setLugares([]);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar los eventos.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const grupos = agruparEventos(eventos);

  return (
    <View style={styles.contenedor}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => cargarEventos(true)}
            colors={[AZUL]}
            tintColor={AZUL}
          />
        }
      >
        <View style={styles.encabezado}>
          <View style={styles.etiquetaEncabezado}>
            <Ionicons name="compass-outline" size={16} color="#218C80" />
            <Text style={styles.textoEtiqueta}>DESCUBRÍ COLÓN · ENTRE RÍOS</Text>
          </View>

          <Text style={styles.titulo}>Agenda de eventos</Text>
          <Text style={styles.subtitulo}>
            Encontrá actividades, propuestas y experiencias para disfrutar.
          </Text>

          {!cargando && !error && eventos.length > 0 && (
            <View style={styles.resumen}>
              <View style={styles.iconoResumen}>
                <Ionicons name="calendar" size={19} color={AZUL} />
              </View>
              <View>
                <Text style={styles.numeroResumen}>
                  {eventos.length} {eventos.length === 1 ? 'actividad' : 'actividades'}
                </Text>
                <Text style={styles.textoResumen}>para descubrir</Text>
              </View>
            </View>
          )}
        </View>

        {cargando ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color={AZUL} />
            <Text style={styles.textoSecundario}>Preparando la agenda...</Text>
          </View>
        ) : error ? (
          <View style={styles.mensaje}>
            <View style={styles.iconoMensaje}>
              <Ionicons name="cloud-offline-outline" size={30} color="#C94343" />
            </View>
            <Text style={styles.mensajeTitulo}>
              No pudimos cargar la agenda
            </Text>
            <Text style={styles.textoSecundario}>{error}</Text>
            <Pressable
              style={styles.botonReintentar}
              onPress={() => cargarEventos()}
            >
              <Text style={styles.textoBotonReintentar}>Volver a intentar</Text>
            </Pressable>
          </View>
        ) : eventos.length === 0 ? (
          <View style={styles.mensaje}>
            <View style={styles.iconoMensaje}>
              <Ionicons name="calendar-outline" size={32} color={AZUL} />
            </View>
            <Text style={styles.mensajeTitulo}>
              No hay eventos disponibles
            </Text>
            <Text style={styles.textoSecundario}>
              Cuando se publiquen nuevas actividades, aparecerán acá.
            </Text>
          </View>
        ) : (
          <View style={styles.listaAgenda}>
            {grupos.map((grupo) => (
              <View key={grupo.clave} style={styles.grupoFecha}>
                <View style={styles.encabezadoFecha}>
                  <View style={styles.fechaCalendario}>
                    <Text style={styles.numeroDia}>
                      {formatearNumeroDia(grupo.fecha)}
                    </Text>
                    <Text style={styles.mesDia}>
                      {formatearMes(grupo.fecha)}
                    </Text>
                  </View>

                  <View style={styles.infoFecha}>
                    <Text style={styles.diaSemana}>
                      {formatearDia(grupo.fecha)}
                    </Text>
                    <Text style={styles.fechaCompleta}>
                      {formatearFecha(grupo.fecha)}
                    </Text>
                  </View>

                  <View style={styles.contadorFecha}>
                    <Text style={styles.textoContadorFecha}>
                      {grupo.eventos.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventosDelDia}>
                  {grupo.eventos.map((evento) => (
                    <Pressable
                      key={evento.id}
                      onPress={() =>
                        router.push({
                          pathname: '/evento/[id]',
                          params: { id: evento.id },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Ver detalle de ${evento.titulo}`}
                      style={({ pressed }) => [
                        styles.tarjetaPresionable,
                        pressed && styles.tarjetaPresionada,
                      ]}
                    >
                      <TarjetaEvento evento={evento} lugares={lugares} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F3F6F8',
  },
  contenido: {
    paddingHorizontal: 19,
    paddingTop: 34,
    paddingBottom: 38,
  },
  encabezado: {
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    paddingVertical: 5,
    marginBottom: 25,
  },
  etiquetaEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  puntoEncabezado: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#35A995',
  },
  textoEtiqueta: {
    color: '#218C80',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  titulo: {
    color: '#173B49',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  subtitulo: {
    color: '#77868D',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    maxWidth: 330,
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F2F4',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 19,
    gap: 10,
  },
  iconoResumen: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroResumen: {
    color: '#234653',
    fontSize: 13,
    fontWeight: '800',
  },
  textoResumen: {
    color: '#71818A',
    fontSize: 11,
    marginTop: 2,
  },
  listaAgenda: {
    gap: 29,
  },
  grupoFecha: {
    gap: 14,
  },
  encabezadoFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fechaCalendario: {
    width: 55,
    height: 59,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E3EAED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#183B49',
    shadowOpacity: 0.035,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  numeroDia: {
    color: '#183B49',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 25,
  },
  mesDia: {
    color: AZUL,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoFecha: {
    flex: 1,
  },
  diaSemana: {
    color: '#234653',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  fechaCompleta: {
    color: '#849198',
    fontSize: 11,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  contadorFecha: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#E5EFF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoContadorFecha: {
    color: AZUL,
    fontSize: 11,
    fontWeight: '800',
  },
  eventosDelDia: {
    gap: 12,
  },
  tarjetaPresionable: {
    borderRadius: 17,
  },
  tarjetaPresionada: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EEF0',
    overflow: 'hidden',
    shadowColor: '#183B49',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  imagenEvento: {
    width: '100%',
    height: 140,
    backgroundColor: '#E5ECEF',
  },
  contenidoTarjeta: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 16,
  },
  filaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 11,
  },
  horaContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF3F5',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  hora: {
    color: AZUL,
    fontSize: 12,
    fontWeight: '800',
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },
  puntoEstado: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  textoEstado: {
    fontSize: 10,
    fontWeight: '800',
  },
  tituloEvento: {
    color: '#193B49',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.45,
  },
  descripcion: {
    color: '#71818A',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  separador: {
    height: 1,
    backgroundColor: '#EDF1F3',
    marginTop: 15,
    marginBottom: 13,
  },
  filaDatos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  datoUbicacion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textoDato: {
    flex: 1,
    color: '#71818A',
    fontSize: 12,
  },
  datoPrecio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textoPrecio: {
    color: '#405761',
    fontSize: 12,
    fontWeight: '700',
  },
  verDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
    marginTop: 14,
  },
  textoVerDetalle: {
    color: AZUL,
    fontSize: 12,
    fontWeight: '800',
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 65,
    gap: 12,
  },
  mensaje: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 55,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7ECEF',
  },
  iconoMensaje: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#EAF3F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mensajeTitulo: {
    color: '#234653',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  textoSecundario: {
    color: '#71818A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  botonReintentar: {
    backgroundColor: AZUL,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 11,
    marginTop: 7,
  },
  textoBotonReintentar: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
