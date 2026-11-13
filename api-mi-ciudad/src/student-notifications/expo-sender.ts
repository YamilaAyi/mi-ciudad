import { Inject, Injectable, Logger } from '@nestjs/common';
import { ENTORNO } from '../config/environment.module.js';
import type { Entorno } from '../config/environment.js';
import type { EnviadorPush, MensajePush } from '../common/notifications/ports.js';

@Injectable()
export class EnviadorPushExpo implements EnviadorPush {
  private readonly logger = new Logger(EnviadorPushExpo.name);

  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  async enviar(mensajes: MensajePush[]): Promise<{ tokensInvalidos: string[] }> {
    const individuales = mensajes.flatMap(({ tokens, titulo, cuerpo, datos }) =>
      tokens.map((to) => ({
        to,
        title: titulo,
        body: cuerpo,
        data: datos,
      })),
    );

    if (individuales.length === 0) return { tokensInvalidos: [] };

    if (this.entorno.NOTIFICACIONES === 'registro') {
      this.logger.log(`Push en modo registro: ${individuales.length} destinatarios.`);
      return { tokensInvalidos: [] };
    }

    const tokensInvalidos: string[] = [];

    for (let inicio = 0; inicio < individuales.length; inicio += 100) {
      const tanda = individuales.slice(inicio, inicio + 100);

      try {
        const respuesta = await fetch(this.entorno.EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tanda),
          signal: AbortSignal.timeout(10_000),
        });

        if (!respuesta.ok) {
          this.logger.warn(`Expo respondió HTTP ${respuesta.status} al enviar push.`);
          continue;
        }

        const payload: unknown = await respuesta.json();

        if (!esObjeto(payload) || !Array.isArray(payload.data)) {
          this.logger.warn('Expo respondió con un formato de tickets no válido.');
          continue;
        }

        if (payload.data.length !== tanda.length) {
          this.logger.warn(
            `Expo devolvió ${payload.data.length} tickets para ${tanda.length} mensajes.`,
          );
        }

        payload.data.forEach((ticket: unknown, indice: number) => {
          if (
            esObjeto(ticket) &&
            ticket.status === 'error' &&
            esObjeto(ticket.details) &&
            ticket.details.error === 'DeviceNotRegistered' &&
            tanda[indice]
          ) {
            tokensInvalidos.push(tanda[indice].to);
          }
        });
      } catch (reason) {
        this.logger.warn(
          `No se pudo enviar una tanda de push a Expo: ${
            reason instanceof Error ? reason.message : String(reason)
          }`,
        );
      }
    }

    return { tokensInvalidos };
  }
}

function esObjeto(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
