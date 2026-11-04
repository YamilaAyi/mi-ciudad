import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TarjetaEvento from '@/components/TarjetaEvento';
import { useEventos } from '@/context/eventos-context';
import { diaCorto, fechaLarga, inicioDelDia, mismoDia, sumarDias } from '@/lib/fechas';

const DIAS_VISIBLES = 14;

export default function AgendaScreen() {
  const { eventos, cargando, estaGuardado, sincronizar } = useEventos();

  const hoy = inicioDelDia(new Date());
  const dias = Array.from({ length: DIAS_VISIBLES }, (_, i) => sumarDias(hoy, i));

  const [diaSeleccionado, setDiaSeleccionado] = useState<Date>(hoy);
  const [soloGuardados, setSoloGuardados] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const ahora = Date.now();
  const lista = soloGuardados
    ? eventos.filter((e) => estaGuardado(e.id) && new Date(e.inicio).getTime() >= ahora)
    : eventos.filter((e) => mismoDia(new Date(e.inicio), diaSeleccionado));

  async function refrescar() {
    setRefrescando(true);
    await sincronizar();
    setRefrescando(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.encabezado}>
        <Ionicons name="calendar-outline" size={26} color="#176B87" />
        <Text style={styles.titulo}>Agenda</Text>
      </View>

      <View style={styles.modos}>
        {[
          { etiqueta: 'Por día', valor: false },
          { etiqueta: 'Mis eventos', valor: true },
        ].map((m) => (
          <Pressable
            key={m.etiqueta}
            onPress={() => setSoloGuardados(m.valor)}
            style={[styles.modo, soloGuardados === m.valor && styles.modoActivo]}
          >
            <Text style={[styles.modoTexto, soloGuardados === m.valor && styles.modoTextoActivo]}>
              {m.etiqueta}
            </Text>
          </Pressable>
        ))}
      </View>

      {!soloGuardados && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tira}
          contentContainerStyle={styles.tiraContenido}
        >
          {dias.map((d) => {
            const activo = mismoDia(d, diaSeleccionado);
            const tieneEventos = eventos.some((e) => mismoDia(new Date(e.inicio), d));
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => setDiaSeleccionado(d)}
                style={[styles.dia, activo && styles.diaActivo]}
              >
                <Text style={[styles.diaTexto, activo && styles.diaTextoActivo]}>{diaCorto(d)}</Text>
                <Text style={[styles.diaNumero, activo && styles.diaTextoActivo]}>{d.getDate()}</Text>
                <View style={[styles.punto, tieneEventos && styles.puntoVisible]} />
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        style={styles.lista}
        contentContainerStyle={styles.listaContenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
      >
        <Text style={styles.subtitulo}>
          {soloGuardados
            ? 'Eventos que guardaste'
            : mismoDia(diaSeleccionado, hoy)
              ? `Hoy · ${fechaLarga(diaSeleccionado)}`
              : fechaLarga(diaSeleccionado)}
        </Text>

        {cargando && <Text style={styles.vacio}>Cargando eventos…</Text>}

        {!cargando && lista.length === 0 && (
          <Text style={styles.vacio}>
            {soloGuardados
              ? 'Todavía no guardaste eventos próximos.'
              : 'No hay eventos cargados para este día.'}
          </Text>
        )}

        {lista.map((evento) => (
          <TarjetaEvento key={evento.id} evento={evento} guardado={estaGuardado(evento.id)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#176B87' },

  modos: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 14 },
  modo: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#F0F7FA' },
  modoActivo: { backgroundColor: '#176B87' },
  modoTexto: { color: '#176B87', fontWeight: '600' },
  modoTextoActivo: { color: '#FFFFFF' },

  tira: { flexGrow: 0, marginTop: 14 },
  tiraContenido: { paddingHorizontal: 20, gap: 8 },
  dia: {
    width: 54,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F0F7FA',
    borderWidth: 1,
    borderColor: '#D5E5EB',
  },
  diaActivo: { backgroundColor: '#176B87', borderColor: '#176B87' },
  diaTexto: { fontSize: 13, color: '#666666' },
  diaNumero: { fontSize: 18, fontWeight: 'bold', color: '#333333' },
  diaTextoActivo: { color: '#FFFFFF' },
  punto: { width: 5, height: 5, borderRadius: 3, marginTop: 4, backgroundColor: 'transparent' },
  puntoVisible: { backgroundColor: '#F2994A' },

  lista: { flex: 1 },
  listaContenido: { paddingHorizontal: 20, paddingBottom: 40 },
  subtitulo: { fontSize: 16, fontWeight: '600', color: '#333333', marginTop: 18 },
  vacio: { textAlign: 'center', color: '#666666', marginTop: 30 },
});
