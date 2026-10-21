import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import type { EstadoEvento, Evento } from '@/data/eventos';
import {
  avisarCambioEstado,
  cancelarAviso,
  pedirPermiso,
  programarAviso,
} from '@/lib/notificaciones';
import { obtenerEventos, simularEstado as simularEstadoService } from '@/services/eventos-service';

const CLAVE_GUARDADOS = 'agenda:guardados';

type EventoGuardado = {
  /** id de la notificación programada (para poder cancelarla) */
  avisoId?: string;
  /** estado del evento la última vez que el usuario lo "vio" */
  estadoVisto: EstadoEvento;
};

type Guardados = Record<string, EventoGuardado>;

export type ResultadoGuardado = {
  guardado: boolean;
  avisoProgramado: boolean;
  permisoDenegado: boolean;
};

type EventosContextType = {
  eventos: Evento[];
  cargando: boolean;
  estaGuardado: (id: string) => boolean;
  alternarGuardado: (evento: Evento) => Promise<ResultadoGuardado>;
  sincronizar: () => Promise<void>;
  simularEstado: (id: string, estado: EstadoEvento) => Promise<void>;
};

const EventosContext = createContext<EventosContextType | null>(null);

export function EventosProvider({ children }: { children: ReactNode }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [guardados, setGuardados] = useState<Guardados>({});
  const [cargando, setCargando] = useState(true);

  // Fuente de verdad para código async (evita closures viejos)
  const guardadosRef = useRef<Guardados>({});

  const actualizarGuardados = useCallback((siguiente: Guardados) => {
    guardadosRef.current = siguiente;
    setGuardados(siguiente);
    AsyncStorage.setItem(CLAVE_GUARDADOS, JSON.stringify(siguiente)).catch(() => {});
  }, []);

  /**
   * Trae los eventos y compara con lo que el usuario tenía guardado.
   * - Si un evento guardado pasó a cancelado/suspendido → cancela el aviso y notifica.
   * - Si volvió a "programado" (se reprogramó) → vuelve a armar el aviso.
   */
  const sincronizar = useCallback(async () => {
    const frescos = await obtenerEventos();
    setEventos(frescos);

    const actual: Guardados = { ...guardadosRef.current };
    let huboCambios = false;

    for (const id of Object.keys(actual)) {
      const evento = frescos.find((e) => e.id === id);
      if (!evento) continue;
      const guardado = actual[id];
      if (evento.estado === guardado.estadoVisto) continue;

      huboCambios = true;
      if (evento.estado === 'programado') {
        const avisoId = await programarAviso(evento);
        actual[id] = { estadoVisto: 'programado', avisoId: avisoId ?? undefined };
      } else {
        await cancelarAviso(guardado.avisoId);
        await avisarCambioEstado(evento);
        actual[id] = { estadoVisto: evento.estado };
      }
    }

    if (huboCambios) actualizarGuardados(actual);
  }, [actualizarGuardados]);

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CLAVE_GUARDADOS);
        if (raw && activo) {
          const parsed = JSON.parse(raw) as Guardados;
          guardadosRef.current = parsed;
          setGuardados(parsed);
        }
      } catch {
        // storage corrupto: arrancamos vacío
      }
      await sincronizar();
      if (activo) setCargando(false);
    })();

    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') sincronizar();
    });

    return () => {
      activo = false;
      sub.remove();
    };
  }, [sincronizar]);

  const alternarGuardado = useCallback(
    async (evento: Evento): Promise<ResultadoGuardado> => {
      const actual = { ...guardadosRef.current };

      // Quitar
      if (actual[evento.id]) {
        await cancelarAviso(actual[evento.id].avisoId);
        delete actual[evento.id];
        actualizarGuardados(actual);
        return { guardado: false, avisoProgramado: false, permisoDenegado: false };
      }

      // Guardar
      const permiso = await pedirPermiso();
      const avisoId = permiso ? await programarAviso(evento) : null;
      actual[evento.id] = { estadoVisto: evento.estado, avisoId: avisoId ?? undefined };
      actualizarGuardados(actual);
      return { guardado: true, avisoProgramado: avisoId !== null, permisoDenegado: !permiso };
    },
    [actualizarGuardados],
  );

  const simularEstado = useCallback(
    async (id: string, estado: EstadoEvento) => {
      await simularEstadoService(id, estado);
      await sincronizar();
    },
    [sincronizar],
  );

  const value = useMemo<EventosContextType>(
    () => ({
      eventos,
      cargando,
      estaGuardado: (id) => id in guardados,
      alternarGuardado,
      sincronizar,
      simularEstado,
    }),
    [eventos, cargando, guardados, alternarGuardado, sincronizar, simularEstado],
  );

  return <EventosContext.Provider value={value}>{children}</EventosContext.Provider>;
}

export function useEventos(): EventosContextType {
  const ctx = useContext(EventosContext);
  if (!ctx) throw new Error('useEventos debe usarse dentro de <EventosProvider>');
  return ctx;
}
