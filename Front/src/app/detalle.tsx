import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { obtenerUsuarioActual } from '../servicios/auth';
import { alternarFavorito, obtenerIdsFavoritos } from '../servicios/favoritos';
import { obtenerLugares, usandoCacheLugares } from '../servicios/lugares';
import type { Lugar } from '../tipos/entities';
import { DatoLugar } from '../components/DatoLugar';



function obtenerIdApiLugar(id: string): string {
  const idsApi: Record<string, string> = {
    '1': 'lug-004',
    '2': 'lug-001',
    '3': 'lug-006',
  };
  return idsApi[id] ?? id;
}

function formatearHorarios(horarios: Lugar['horarios']): string | null {
  if (horarios.length === 0) {
    return null;
  }

  const dias = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];

  return horarios
    .map((horario) =>
      `${dias[horario.dia]}: ${horario.abre} a ${horario.cierra}`
    )
    .join('\n');
}

function formatearDuracion(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;

  return `${minutos}:${String(segundosRestantes).padStart(2, '0')} min`;
}

export default function DetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [lugarDelServicio, setLugarDelServicio] = useState<Lugar | null>(null);
  const [errorLugar, setErrorLugar] = useState<string | null>(null);
const [cargandoLugar, setCargandoLugar] = useState(true);
const [mostrandoCache, setMostrandoCache] = useState(false);
const [intentoCarga, setIntentoCarga] = useState(0);
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargandoFavorito, setCargandoFavorito] = useState(true);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);
  const [errorFavorito, setErrorFavorito] = useState<string | null>(null);

useEffect(() => {
  let activo = true;

  async function cargarLugar() {
    setCargandoLugar(true);
    setErrorLugar(null);
    setLugarDelServicio(null);
    setMostrandoCache(false);

    try {
      const datos = await obtenerLugares();
      if (!activo) return;
      setMostrandoCache(usandoCacheLugares);
      console.log('¿Usando caché en Detalle?', usandoCacheLugares);

      const lugarEncontrado = datos.find((lugar) => lugar.id === id);

      if (lugarEncontrado) {
        setLugarDelServicio(lugarEncontrado);
      } else {
        setErrorLugar('No se encontró el lugar turístico.');
      }
    } catch {
      if (activo) {
        setErrorLugar('No se pudo cargar el lugar turístico.');
      }
    } finally {
      if (activo) {
        setCargandoLugar(false);
      }
    }
  }

  void cargarLugar();

  return () => {
    activo = false;
  };
}, [id, intentoCarga]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      async function cargarEstadoFavorito() {
        setCargandoFavorito(true);
        setErrorFavorito(null);
        try {
          const usuario = await obtenerUsuarioActual();
          if (!activo) return;

          setUsuarioAutenticado(Boolean(usuario));
          if (usuario) {
            const idsFavoritos = await obtenerIdsFavoritos();
            if (activo) setEsFavorito(idsFavoritos.includes(obtenerIdApiLugar(id)));
          } else {
            setEsFavorito(false);
          }
        } catch {
  if (activo) {
    setErrorFavorito(
      'No se pudieron consultar los favoritos. Comprobá tu conexión.'
    );
  }
} finally {
          if (activo) setCargandoFavorito(false);
        }
      }

      void cargarEstadoFavorito();
      return () => {
        activo = false;
      };
    }, [id])
  );

  async function abrirComoLlegar() {
  if (!lugarDelServicio) return;

  const { latitud, longitud } = lugarDelServicio.coordenadas;



const url = lugarDelServicio.id === 'lug-004'
  ? 'https://www.google.com/maps/dir/?api=1&destination=Molino%20Forclaz&destination_place_id=0x95ae327819875ab1:0xfd660d33f693a1cc&travelmode=driving'
  : `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}&travelmode=driving`;



  await Linking.openURL(url);
}

  async function handleAlternarFavorito() {
    if (!usuarioAutenticado) {
      router.push('/login');
      return;
    }

    setGuardandoFavorito(true);
    setErrorFavorito(null);
    try {
      const nuevoEstado = await alternarFavorito(obtenerIdApiLugar(id), esFavorito);
      setEsFavorito(nuevoEstado);
    } catch (favoriteError) {
      setErrorFavorito(
        favoriteError instanceof Error
          ? favoriteError.message
          : 'No se pudo actualizar el favorito.'
      );
    } finally {
      setGuardandoFavorito(false);
    }
  }
  
 
  return (

    
<ScrollView
  style={{ flex: 1 }}
  contentContainerStyle={styles.contenedor}
 
>
  {mostrandoCache && !cargandoLugar && !errorLugar && (
  <View
    style={{
      backgroundColor: '#FFF8E1',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#F5E6B3',
    }}
  >
    <Text style={{ color: '#664D03' }}>
      Estás viendo información guardada.
      Algunos datos podrían no estar actualizados.
    </Text>

    <Pressable
  onPress={() => setIntentoCarga((anterior) => anterior + 1)}
  style={styles.botonComoLlegar}
>
  <Text style={styles.textoComoLlegar}>
    Reintentar conexión
  </Text>
</Pressable>
  </View>
)}
  {cargandoLugar && (
  <Text style={{ textAlign: 'center', marginTop: 20 }}>
    Cargando información del lugar...
  </Text>
)}

{errorLugar && (
  <View style={{ alignItems: 'center', marginTop: 20 }}>
    <Ionicons
      name="alert-circle-outline"
      size={48}
      color="#C62828"
    />

    <Text style={{ color: '#C62828', marginTop: 10 }}>
      {errorLugar}
    </Text>

    <Pressable
  onPress={() => setIntentoCarga((anterior) => anterior + 1)}
  style={styles.botonComoLlegar}
>
  <Text style={styles.textoComoLlegar}>
    Reintentar
  </Text>
</Pressable>
  </View>
)}
{lugarDelServicio && (
  lugarDelServicio.imagenes?.[0] ? (
    <Image
      source={{ uri: lugarDelServicio.imagenes[0] }}
      style={styles.imagenLugar}
      resizeMode="cover"
    />
  ) : (
    <View style={styles.imagenLugar}>
      <Text>📷 Imagen no disponible</Text>
    </View>
  )
)}
 {lugarDelServicio && (
  <Text style={styles.nombreLugar}>
    {lugarDelServicio.nombre}
  </Text>
)}
 {lugarDelServicio && (
   <View>
     <Pressable
       accessibilityLabel={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
       accessibilityRole="button"
       disabled={cargandoFavorito || guardandoFavorito}
       onPress={() => void handleAlternarFavorito()}
       style={styles.botonFavorito}
     >
       <Ionicons
         name={esFavorito ? 'heart' : 'heart-outline'}
         size={20}
         color={esFavorito ? '#E53935' : '#176B87'}
       />
       <Text style={styles.textoBotonFavorito}>
         {cargandoFavorito
           ? 'Consultando favoritos...'
           : esFavorito
             ? 'Quitar de favoritos'
             : usuarioAutenticado
               ? 'Guardar en favoritos'
               : 'Iniciar sesión para guardar'}
       </Text>
     </Pressable>
     {errorFavorito && <Text style={styles.errorTexto}>{errorFavorito}</Text>}
   </View>
 )}

<Text style={styles.categoria}>
  {lugarDelServicio?.categoriaId === 'cat-playas'
    ? 'Playas'
    : lugarDelServicio?.categoriaId === 'cat-termas'
    ? 'Termas'
    : lugarDelServicio?.categoriaId === 'cat-museos'
    ? 'Museos y patrimonio'
    : lugarDelServicio?.categoriaId === 'cat-gastronomia'
    ? 'Gastronomía'
    : lugarDelServicio?.categoriaId === 'cat-artesanias'
    ? 'Artesanías'
    : lugarDelServicio?.categoriaId === 'cat-naturaleza'
    ? 'Naturaleza'
    : lugarDelServicio?.categoriaId === 'cat-alojamiento'
    ? 'Alojamiento'
    : lugarDelServicio?.categoriaId === 'cat-bodegas'
    ? 'Bodegas'
    : 'Categoría desconocida'}
</Text>

<Text style={styles.descripcion}>
  {lugarDelServicio?.descripcion ?? 'Descripción no disponible'}
</Text>

<DatoLugar
  titulo="Dirección"
  icono="location-outline"
  valor={lugarDelServicio?.direccion ?? null}
/>
<DatoLugar
  titulo="Horarios"
  icono="time-outline"
  valor={
    lugarDelServicio
      ? formatearHorarios(lugarDelServicio.horarios)
      : null
  }
/>
<DatoLugar
  titulo="Teléfono"
  icono="call-outline"
  valor={lugarDelServicio?.telefono ?? null}
/>

<DatoLugar
  titulo="Precio de entrada"
  icono="cash-outline"
  valor={
    lugarDelServicio?.precioEntrada === 0
      ? 'Entrada gratuita'
      : lugarDelServicio?.precioEntrada != null
        ? `$${lugarDelServicio.precioEntrada}`
        : null
  }
/>

<DatoLugar
  titulo="Accesibilidad"
  icono="accessibility-outline"
  valor={
    lugarDelServicio
      ? lugarDelServicio.accesible
        ? 'Accesible para personas en silla de ruedas'
        : 'No figura como accesible para silla de ruedas'
      : null
  }
/>

<DatoLugar
  titulo="Sitio web"
  icono="globe-outline"
  valor={lugarDelServicio?.sitioWeb ?? null}
/>

{lugarDelServicio && (
  <View style={styles.tarjetaAudioguia}>
    <View style={styles.encabezadoAudioguia}>
      <View style={styles.tituloAudioguia}>
        <Ionicons
          name="headset-outline"
          size={20}
          color={lugarDelServicio.audioguia ? '#176B87' : '#888888'}
        />
        <Text style={styles.textoTituloAudioguia}>
          Audioguía
        </Text>
      </View>

      <View
        style={[
          styles.etiquetaAudioguia,
          lugarDelServicio.audioguia
            ? styles.etiquetaDisponible
            : styles.etiquetaProximamente,
        ]}
      >
        <Text
          style={[
            styles.textoEtiquetaAudioguia,
            lugarDelServicio.audioguia
              ? styles.textoDisponible
              : styles.textoProximamente,
          ]}
        >
          {lugarDelServicio.audioguia ? 'Disponible' : 'Próximamente'}
        </Text>
      </View>
    </View>

    <Text style={styles.descripcionAudioguia}>
      {lugarDelServicio.audioguia
        ? 'Escuchá la historia y conocé más sobre este lugar.'
        : 'Estamos preparando la audioguía de este lugar. ¡Muy pronto estará disponible!'}
    </Text>

    {lugarDelServicio.audioguia && (
      <Pressable
        style={styles.botonReproducirAudioguia}
        onPress={() =>
          router.push({
            pathname: '/audioguia',
            params: { id: lugarDelServicio.id },
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Reproducir audioguía"
      >
        <View style={styles.iconoReproducirAudioguia}>
          <Ionicons
            name="play-circle-outline"
            size={25}
            color="#FFFFFF"
          />
        </View>

        <View>
          <Text style={styles.textoReproducirAudioguia}>
            Reproducir audioguía
          </Text>

          <Text style={styles.detalleAudioguia}>
            {lugarDelServicio.audioguia.idioma === 'es'
              ? 'Español'
              : lugarDelServicio.audioguia.idioma === 'en'
                ? 'Inglés'
                : 'Portugués'}
            {' · '}
            {formatearDuracion(
              lugarDelServicio.audioguia.duracionSegundos
            )}
          </Text>
        </View>
      </Pressable>
    )}
  </View>
)}

{lugarDelServicio && (
  <Pressable
    style={styles.botonComoLlegar}
    onPress={() => void abrirComoLlegar()}
    accessibilityRole="button"
    accessibilityLabel="Cómo llegar"
  >
    <Ionicons
      name="navigate-outline"
      size={24}
      color="#FFFFFF"
    />
    <Text style={styles.textoComoLlegar}>
      Cómo llegar
    </Text>
  </Pressable>
)}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  botonFavorito: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#D5E5EB',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textoBotonFavorito: {
    color: '#176B87',
    fontSize: 15,
    fontWeight: '600',
  },
  errorTexto: {
    color: '#B91C1C',
    fontSize: 14,
  },

  botonComoLlegar: {
  backgroundColor: '#176B87',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: 15,
  borderRadius: 12,
  marginTop: 15,
  },

  textoComoLlegar: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
    imagenLugar: {
      width: '100%',
      height: 220,
      borderRadius: 12,
    },

  contenedor: {
    padding: 20,
    gap: 12,
  },
  nombreLugar:{
    fontSize :24,
    fontWeight : 'bold',
      color: '#176B87',
  },
  categoria : {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  descripcion:{
      fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  tarjetaAudioguia: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    marginTop: 4,
  },

  encabezadoAudioguia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  tituloAudioguia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  textoTituloAudioguia: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },

  etiquetaAudioguia: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },

  etiquetaDisponible: {
    backgroundColor: '#D9F5E3',
  },

  etiquetaProximamente: {
    backgroundColor: '#EEEEEE',
  },

  textoEtiquetaAudioguia: {
    fontSize: 11,
    fontWeight: '600',
  },

  textoDisponible: {
    color: '#008F45',
  },

  textoProximamente: {
    color: '#555555',
  },

  descripcionAudioguia: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 19,
  },

  botonReproducirAudioguia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconoReproducirAudioguia: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#176B87',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoReproducirAudioguia: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },

  detalleAudioguia: {
    fontSize: 11,
    color: '#777777',
    marginTop: 3,
  },
});