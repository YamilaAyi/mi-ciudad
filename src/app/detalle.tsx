import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View, 
  
} from 'react-native';
import { obtenerUsuarioActual } from '../servicios/auth';
import { alternarFavorito, obtenerIdsFavoritos } from '../servicios/favoritos';
import { obtenerLugares } from '../servicios/lugares';
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

export default function DetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [lugarDelServicio, setLugarDelServicio] = useState<Lugar | null>(null);
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargandoFavorito, setCargandoFavorito] = useState(true);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);
  const [errorFavorito, setErrorFavorito] = useState<string | null>(null);

  useEffect(() => {
    async function cargarLugar() {
      const datos = await obtenerLugares();
      const lugarEncontrado = datos.find((lugar) => lugar.id === id);
      setLugarDelServicio(lugarEncontrado ?? null);
    }

    cargarLugar();
  }, [id]);

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
        } catch (favoriteError) {
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
 <Text style={styles.nombreLugar}>
   {lugarDelServicio?.nombre ?? 'Cargando lugar...'}
 </Text>

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
});