import * as Notifications from 'expo-notifications';
import type { Evento } from '../tipos/entities';

const UNA_HORA = 60 * 60 * 1000;

export async function programarAvisoEvento(
  evento: Evento
): Promise<
  | 'programado'
  | 'sin-permisos'
  | 'menos-de-una-hora'
  | 'fecha-pasada'
  | 'fecha-invalida'
  | 'no-programable'
  | 'error'
> {
  try {
    if (evento.estado !== 'programado') return 'no-programable';

    const inicio = new Date(evento.inicio).getTime();

    if (!Number.isFinite(inicio)) return 'fecha-invalida';
    if (inicio <= Date.now()) return 'fecha-pasada';

    const aviso = inicio - UNA_HORA;

    if (aviso <= Date.now()) return 'menos-de-una-hora';

    const permisos = await Notifications.getPermissionsAsync();
    let autorizado = permisos.granted;

    if (!autorizado) {
      const solicitado = await Notifications.requestPermissionsAsync();
      autorizado = solicitado.granted;
    }

    if (!autorizado) return 'sin-permisos';

    await cancelarAvisoEvento(evento.id);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '¡Tu evento está por comenzar!',
        body: `${evento.titulo} comienza dentro de una hora.`,
        data: { eventoId: evento.id },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(aviso),
      },
    });

    return 'programado';
  } catch (error) {
    console.warn('No se pudo programar el aviso:', error);
    return 'error';
  }
}
export async function cancelarAvisoEvento(id: string): Promise<void> {
  try {
    const pendientes =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notificacion of pendientes) {
      if (notificacion.content.data?.eventoId === id) {
        await Notifications.cancelScheduledNotificationAsync(
          notificacion.identifier
        );
      }
    }
  } catch (error) {
    console.warn('No se pudo cancelar el aviso:', error);
  }
}

export async function sincronizarAvisosEventos(eventos: Evento[]): Promise<void> {
  try {
    const ahora = Date.now();

    const eventosConAviso = eventos.filter((evento) => {
      if (evento.estado !== 'programado') return false;

      const inicio = new Date(evento.inicio).getTime();
      return Number.isFinite(inicio) && inicio - UNA_HORA > ahora;
    });

    const idsValidos = new Set(eventosConAviso.map((evento) => evento.id));
    const pendientes = await Notifications.getAllScheduledNotificationsAsync();

    for (const notificacion of pendientes) {
      const eventoId = notificacion.content.data?.eventoId;

      if (typeof eventoId === 'string' && !idsValidos.has(eventoId)) {
        await Notifications.cancelScheduledNotificationAsync(
          notificacion.identifier
        );
      }
    }

    await Promise.all(
      eventosConAviso.map((evento) => programarAvisoEvento(evento))
    );
  } catch (error) {
    console.warn('No se pudieron sincronizar los avisos de eventos:', error);
  }
}

