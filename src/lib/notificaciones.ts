import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ETIQUETA_ESTADO, type Evento } from '@/data/eventos';
import { hora } from '@/lib/fechas';

export const MINUTOS_AVISO = 60;

const SOPORTADO = Platform.OS !== 'web';
const CANAL = 'eventos';

export function configurarNotificaciones(): void {
  if (!SOPORTADO) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Eventos',
      importance: Notifications.AndroidImportance.HIGH,
    }).catch((error) => {
      console.error('Error al configurar el canal:', error);
    });
  }
}

export async function pedirPermiso(): Promise<boolean> {
  if (!SOPORTADO) return false;

  try {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;

    const nuevo = await Notifications.requestPermissionsAsync();
    return nuevo.granted;
  } catch (error) {
    console.error('Error al solicitar permisos:', error);
    return false;
  }
}

export async function programarAviso(
  evento: Evento,
): Promise<string | null> {
  if (!SOPORTADO) {
    console.warn('Plataforma no compatible:', Platform.OS);
    return null;
  }

  const ahora = Date.now();
  const inicio = new Date(evento.inicio);

  console.log('===== DIAGNÓSTICO DE NOTIFICACIÓN =====');
  console.log('Evento:', evento.titulo);
  console.log('Fecha recibida:', evento.inicio);
  console.log('Hora actual:', new Date(ahora).toString());
  console.log(
    'Zona horaria:',
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  if (Number.isNaN(inicio.getTime())) {
    console.error('Fecha inválida:', evento.inicio);
    return null;
  }

  const fechaAviso = new Date(
    inicio.getTime() - MINUTOS_AVISO * 60_000,
  );

  const minutosHastaEvento = Math.round(
    (inicio.getTime() - ahora) / 60_000,
  );

  console.log('Inicio interpretado:', inicio.toString());
  console.log('Fecha del aviso:', fechaAviso.toString());
  console.log('Minutos hasta el evento:', minutosHastaEvento);

  if (fechaAviso.getTime() <= ahora) {
    console.warn('El horario del recordatorio ya pasó.');
    return null;
  }

  try {
    const permiso = await Notifications.getPermissionsAsync();

    console.log('Permisos de notificación:', permiso);

    if (!permiso.granted) {
      console.warn('No hay permiso para notificaciones.');
      return null;
    }

    const avisoId = await Notifications.scheduleNotificationAsync({
      content: {
        title: evento.titulo,
        body: 'Empieza a las ' + hora(inicio) + '. ¡No te lo pierdas!',
        data: { eventoId: evento.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fechaAviso,
        channelId: CANAL,
      },
    });

    console.log('AVISO PROGRAMADO CORRECTAMENTE:', avisoId);
    console.log('Fecha del aviso:', fechaAviso.toString());

    return avisoId;
  } catch (error) {
    console.error('Error al programar el aviso:', error);
    return null;
  }
}

export async function cancelarAviso(
  avisoId?: string,
): Promise<void> {
  if (!SOPORTADO || !avisoId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(avisoId);
    console.log('Notificación cancelada:', avisoId);
  } catch (error) {
    console.error('Error al cancelar la notificación:', error);
  }
}

export async function avisarCambioEstado(
  evento: Evento,
): Promise<void> {
  if (!SOPORTADO) return;

  try {
    const permiso = await Notifications.getPermissionsAsync();

    if (!permiso.granted) {
      console.warn('No se puede avisar: faltan permisos.');
      return;
    }

    const titulo =
      ETIQUETA_ESTADO[evento.estado] + ': ' + evento.titulo;

    const cuerpo =
      evento.estado === 'suspendido_lluvia'
        ? 'Se suspendió por lluvia. Te avisamos si se reprograma.'
        : 'El evento que guardaste fue cancelado.';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: cuerpo,
        data: { eventoId: evento.id },
      },
      trigger: null,
    });

    console.log('Notificación de cambio de estado enviada:', evento.id);
  } catch (error) {
    console.error('Error al notificar el cambio de estado:', error);
  }
}
