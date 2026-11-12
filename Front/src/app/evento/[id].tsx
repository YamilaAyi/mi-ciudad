import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { EstadoEvento, Evento, Lugar } from '../../tipos/entities';
import {
  cambiarEstadoEvento,
  obtenerEvento,
  obtenerEventosGuardados,
  guardarEvento,
  quitarEventoGuardado,
} from '../../servicios/eventos';
import { obtenerRolSesion, obtenerUsuarioActual } from '../../servicios/auth';
import { obtenerLugares } from '../../servicios/lugares';
import { programarAvisoEvento, cancelarAvisoEvento } from '../../servicios/notificaciones-eventos';

const AZUL = '#176B87';

const COLORES_ESTADO: Record<string, string> = {
  programado: '#21865B',
  suspendido: '#D18A24',
  cancelado: '#C94343',
  finalizado: '#777777',
};

const ETIQUETAS_ESTADO: Record<string, string> = {
  programado: 'Programado',
  suspendido: 'Suspendido',
  cancelado: 'Cancelado',
  finalizado: 'Finalizado',
};

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatearHora(fecha: string): string {
  return new Date(fecha).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function obtenerDuracion(inicio: string, fin: string | null): string {
  if (!fin) return 'No especificada';

  const minutos = Math.round(
    (new Date(fin).getTime() - new Date(inicio).getTime()) / 60000
  );

  if (minutos <= 0) return 'No especificada';

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto} minutos`;
  if (resto === 0) return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;

  return `${horas} h ${resto} min`;
}

function formatearPrecio(precio: number | null): string {
  if (precio === 0) return 'Gratis';
  if (precio === null) return 'Consultar precio';
  return `$${precio.toLocaleString('es-AR')}`;
}

function Dato({
  icono,
  etiqueta,
  valor,
  anchoCompleto = false,
}: {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  etiqueta: string;
  valor: string;
  anchoCompleto?: boolean;
}) {
  return (
    <View style={[styles.dato, anchoCompleto && styles.datoCompleto]}>
      <View style={styles.iconoDato}>
        <Ionicons name={icono} size={18} color={AZUL} />
      </View>
      <View style={styles.textosDato}>
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        <Text style={styles.valor}>{valor}</Text>
      </View>
    </View>
  );
}


export default function DetalleEventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardado, setGuardado] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargar() {
      if (!id) {
        setError('No se indicó qué evento consultar.');
        setCargando(false);
        return;
      }

      try {
        const resultado = await obtenerEvento(String(id));
        if (!activo) return;
        setEvento(resultado);

        if (!resultado.direccionLibre?.trim() && resultado.lugarId) {
          try {
            const catalogo = await obtenerLugares();
            if (activo) {
              setLugar(
                catalogo.find((item) => item.id === resultado.lugarId) ?? null
              );
            }
          } catch {
            if (activo) setLugar(null);
          }
        }

        try {
          const rol = await obtenerRolSesion();
          if (activo) setEsAdmin(rol === 'admin');

          const usuario = await obtenerUsuarioActual();

          if (usuario) {
            const guardados = await obtenerEventosGuardados();
            if (activo) {
              setGuardado(guardados.some((item) => item.id === resultado.id));
            }
          }
        } catch {
          // El detalle público sigue disponible aunque falle la consulta de guardados.
        }
      } catch (e) {
        if (activo) {
          setError(
            e instanceof Error ? e.message : 'No se pudo cargar el evento.'
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [id]);

  async function cambiarGuardado() {
    if (!evento || procesando) return;

    try {
      const usuario = await obtenerUsuarioActual();

      if (!usuario) {
        Alert.alert(
          'Iniciá sesión',
          'Necesitás ingresar a tu cuenta para guardar eventos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ingresar', onPress: () => router.push('/login') },
          ]
        );
        return;
      }

      if (!guardado && evento.estado !== 'programado') {
        Alert.alert(
          'Evento no disponible',
          'Solo podés guardar eventos que estén programados.'
        );
        return;
      }

      setProcesando(true);

      if (guardado) {
        await quitarEventoGuardado(evento.id);
        await cancelarAvisoEvento(evento.id);
        setGuardado(false);
        Alert.alert('Evento quitado', 'El evento se quitó de tus guardados.');
      } else {
        await guardarEvento(evento.id);
        await programarAvisoEvento(evento);
        setGuardado(true);
        Alert.alert(
          '¡Evento guardado!',
          'El evento se guardó con éxito. Ya podés encontrarlo en tus eventos guardados.'
        );
      }
    } catch (e) {
      Alert.alert(
        'No se pudo actualizar',
        e instanceof Error ? e.message : 'Intentá nuevamente.'
      );
    } finally {
      setProcesando(false);
    }
  }

  function solicitarCambioEstado(
    estado: Exclude<EstadoEvento, 'finalizado'>
  ) {
    if (!evento || procesando || !esAdmin) return;

    const titulo =
      estado === 'suspendido'
        ? 'Suspender evento'
        : estado === 'cancelado'
          ? 'Cancelar evento'
          : 'Reanudar evento';

    const mensaje =
      estado === 'suspendido'
        ? 'El evento quedará suspendido. ¿Querés continuar?'
        : estado === 'cancelado'
          ? 'El evento quedará cancelado. ¿Querés continuar?'
          : 'El evento volverá a estar programado. ¿Querés continuar?';

    Alert.alert(titulo, mensaje, [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Confirmar',
        style: estado === 'cancelado' ? 'destructive' : 'default',
        onPress: () => {
          void ejecutarCambioEstado(estado);
        },
      },
    ]);
  }

  async function ejecutarCambioEstado(
    estado: Exclude<EstadoEvento, 'finalizado'>
  ) {
    if (!evento || procesando || !esAdmin) return;

    setProcesando(true);

    try {
      const actualizado = await cambiarEstadoEvento(evento.id, estado);

      try {
        if (estado === 'programado' && guardado) {
          await programarAvisoEvento(actualizado);
        } else if (estado !== 'programado') {
          await cancelarAvisoEvento(evento.id);
        }
      } catch (errorNotificacion) {
        console.warn('No se pudo actualizar el aviso local:', errorNotificacion);
      }

      setEvento(actualizado);

      const mensaje =
        estado === 'suspendido'
          ? 'El evento fue suspendido.'
          : estado === 'cancelado'
            ? 'El evento fue cancelado.'
            : 'El evento volvió a estar programado.';

      Alert.alert('Estado actualizado', mensaje);
    } catch (e) {
      Alert.alert(
        'No se pudo cambiar el estado',
        e instanceof Error ? e.message : 'Intentá nuevamente.'
      );
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={AZUL} />
        <Text style={styles.secundario}>Cargando evento...</Text>
      </View>
    );
  }

  if (error || !evento) {
    return (
      <View style={styles.centro}>
        <Ionicons name="alert-circle-outline" size={42} color="#C94343" />
        <Text style={styles.tituloError}>No pudimos abrir el evento</Text>
        <Text style={styles.secundario}>
          {error || 'El evento no está disponible.'}
        </Text>
        <Pressable style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.textoBotonVolver}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const nombreLugar = lugar?.nombre?.trim();
  const direccionLugar = lugar?.direccion?.trim();

  const ubicacion =
    evento.direccionLibre?.trim() ||
    (nombreLugar
      ? direccionLugar
        ? `${nombreLugar} · ${direccionLugar}`
        : nombreLugar
      : 'Ubicación a confirmar');

  const imagenEvento =
    lugar?.imagenes?.find((url) => url?.trim()) ||
    evento.imagenUrl?.trim() ||
    null;

  const colorEstado = COLORES_ESTADO[evento.estado] || '#777777';

  // El estado ya se muestra en la etiqueta; evitar repetirlo en la descripción.
  const descripcionEvento = evento.descripcion
    .replace(/\s*(?:cancelad[oa]|suspendid[oa]|programad[oa]|finalizad[oa])\.?\s*$/i, '')
    .trim();

  return (
    <View style={styles.pantalla}>
      <ScrollView
        style={styles.contenedor}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {imagenEvento ? (
          <Image
            source={{ uri: imagenEvento }}
            style={styles.imagen}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagenAlternativa}>
            <Ionicons name="calendar-outline" size={38} color={AZUL} />
            <Text style={styles.textoImagenAlternativa}>Evento en Colón</Text>
          </View>
        )}

        <View style={styles.encabezado}>
          <View
            style={[
              styles.estado,
              { backgroundColor: `${colorEstado}16` },
            ]}
          >
            <View style={[styles.punto, { backgroundColor: colorEstado }]} />
            <Text style={[styles.textoEstado, { color: colorEstado }]}>
              {ETIQUETAS_ESTADO[evento.estado] || evento.estado}
            </Text>
          </View>

          <Text style={styles.titulo}>{evento.titulo}</Text>

          {!!descripcionEvento && (
            <Text style={styles.descripcion}>
              {descripcionEvento}
            </Text>
          )}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Información del evento</Text>

          <View style={styles.grilla}>
            <Dato
              icono="calendar-outline"
              etiqueta="Fecha"
              valor={formatearFecha(evento.inicio)}
            />
            <Dato
              icono="time-outline"
              etiqueta="Horario"
              valor={`${formatearHora(evento.inicio)}${
                evento.fin ? ` a ${formatearHora(evento.fin)}` : ''
              }`}
            />
            <Dato
              icono="hourglass-outline"
              etiqueta="Duración"
              valor={obtenerDuracion(evento.inicio, evento.fin)}
            />
            <Dato
              icono="ticket-outline"
              etiqueta="Entrada"
              valor={formatearPrecio(evento.precio)}
            />
            <Dato
              icono="location-outline"
              etiqueta="Ubicación"
              valor={ubicacion}
              anchoCompleto
            />
          </View>
        </View>


        {lugar && (
          <View style={styles.seccionLugar}>
            <Text style={styles.tituloLugar}>Sobre el lugar</Text>

            {!!lugar.descripcionCorta?.trim() && (
              <Text style={styles.descripcionLugar} numberOfLines={2}>
                {lugar.descripcionCorta}
              </Text>
            )}

            <View style={styles.filaExtrasLugar}>
              <View
                style={[
                  styles.etiquetaAccesibilidad,
                  !lugar.accesible && styles.etiquetaSinAccesibilidad,
                ]}
              >
                <Ionicons
                  name="accessibility-outline"
                  size={16}
                  color={lugar.accesible ? '#21865B' : '#7B858A'}
                />
                <Text
                  style={[
                    styles.textoAccesibilidad,
                    !lugar.accesible && styles.textoSinAccesibilidad,
                  ]}
                >
                  {lugar.accesible ? 'Accesible' : 'Sin accesibilidad'}
                </Text>
              </View>

              {!!lugar.telefono && (
                <Pressable
                  style={styles.enlaceWebLugar}
                  onPress={() => Linking.openURL(`tel:${lugar.telefono}`)}
                >
                  <Ionicons name="call-outline" size={16} color={AZUL} />
                  <Text style={styles.textoWebLugar}>Teléfono</Text>
                </Pressable>
              )}

              {!!lugar.sitioWeb && (
                <Pressable
                  style={styles.enlaceWebLugar}
                  onPress={() => {
                    const url = /^https?:\/\//i.test(lugar.sitioWeb!)
                      ? lugar.sitioWeb!
                      : `https://${lugar.sitioWeb}`;
                    Linking.openURL(url);
                  }}
                >
                  <Ionicons name="globe-outline" size={16} color={AZUL} />
                  <Text style={styles.textoWebLugar}>Más información</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {esAdmin &&
          (evento.estado === 'programado' ||
            evento.estado === 'suspendido' ||
            evento.estado === 'cancelado') && (
            <View style={styles.adminSection}>
              <Text style={styles.adminTitle}>Administrar evento</Text>

              <View style={styles.adminActions}>
                {evento.estado === 'programado' ? (
                  <>
                    <Pressable
                      style={[styles.adminButton, styles.adminSuspend]}
                      onPress={() => solicitarCambioEstado('suspendido')}
                      disabled={procesando}
                    >
                      <Text style={styles.adminButtonText}>Suspender evento</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.adminButton, styles.adminCancel]}
                      onPress={() => solicitarCambioEstado('cancelado')}
                      disabled={procesando}
                    >
                      <Text style={styles.adminButtonText}>Cancelar evento</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={[styles.adminButton, styles.adminResume]}
                    onPress={() => solicitarCambioEstado('programado')}
                    disabled={procesando}
                  >
                    <Text style={styles.adminButtonText}>
                      {evento.estado === 'cancelado'
                        ? 'Programar de nuevo'
                        : 'Reanudar evento'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
      </ScrollView>

      {evento?.estado === 'programado' && (
        <View style={styles.pieFijo}>
          <Pressable
            style={({ pressed }) => [
              styles.botonGuardar,
              guardado && styles.botonGuardado,
              procesando && styles.botonDeshabilitado,
              pressed && !procesando && styles.botonPresionado,
            ]}
            onPress={cambiarGuardado}
            disabled={procesando}
            accessibilityRole="button"
          >
            {procesando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={guardado ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.textoBoton}>
                  {guardado ? 'Quitar de mis eventos' : 'Guardar evento'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F3F6F8',
  },
  contenedor: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
  },
  imagen: {
    width: '100%',
    height: 185,
    borderRadius: 22,
    marginBottom: 19,
    backgroundColor: '#E5ECEF',
  },
  imagenAlternativa: {
    height: 155,
    borderRadius: 22,
    backgroundColor: '#E3F0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
    gap: 9,
    borderWidth: 1,
    borderColor: '#D5E6EB',
  },
  textoImagenAlternativa: {
    color: '#176B87',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  encabezado: {
    marginBottom: 21,
    paddingHorizontal: 2,
  },
  estado: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 12,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  textoEstado: {
    fontSize: 11,
    fontWeight: '800',
  },
  titulo: {
    color: '#183B49',
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  descripcion: {
    color: '#71818A',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  seccion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5ECEF',
    shadowColor: '#183B49',
    shadowOpacity: 0.055,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tituloSeccion: {
    color: '#183B49',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 19,
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 20,
  },
  dato: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  datoCompleto: {
    width: '100%',
  },
  iconoDato: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#E8F2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textosDato: {
    flex: 1,
    paddingTop: 2,
  },
  etiqueta: {
    color: '#849198',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 5,
  },
  valor: {
    color: '#29434E',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  pieFijo: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 17,
    paddingTop: 11,
    paddingBottom: 13,
    borderTopWidth: 1,
    borderTopColor: '#E7ECEF',
  },
  botonGuardar: {
    minHeight: 50,
    backgroundColor: AZUL,
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    shadowColor: AZUL,
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  botonGuardado: {
    backgroundColor: '#21865B',
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  centro: {
    flex: 1,
    backgroundColor: '#F4F7F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    gap: 13,
  },
  secundario: {
    color: '#65747B',
    fontSize: 14,
    textAlign: 'center',
  },
  tituloError: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#243B45',
  },
  botonVolver: {
    backgroundColor: AZUL,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  textoBotonVolver: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  seccionLugar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5ECEF',
  },
  tituloLugar: {
    color: '#183B49',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 7,
  },
  descripcionLugar: {
    color: '#71818A',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  filaExtrasLugar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  etiquetaAccesibilidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF5EF',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 20,
  },
  etiquetaSinAccesibilidad: {
    backgroundColor: '#F0F2F3',
  },
  textoAccesibilidad: {
    color: '#21865B',
    fontSize: 11,
    fontWeight: '700',
  },
  textoSinAccesibilidad: {
    color: '#7B858A',
  },
  enlaceWebLugar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EAF2F6',
  },
  textoWebLugar: {
    color: AZUL,
    fontSize: 11,
    fontWeight: '700',
  },
  adminSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5EAED',
  },
  adminTitle: {
    color: '#234653',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  adminActions: {
    gap: 9,
  },
  adminButton: {
    minHeight: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  adminSuspend: {
    backgroundColor: '#D18A24',
  },
  adminCancel: {
    backgroundColor: '#C94343',
  },
  adminResume: {
    backgroundColor: '#21865B',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
