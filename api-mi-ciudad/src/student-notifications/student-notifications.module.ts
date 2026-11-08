import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ALMACEN_TOKENS_PUSH, ENVIADOR_PUSH } from '../common/notifications/ports.js';
import { DispositivoPushEntidad } from './push-device.entity.js';
import { AlmacenTokensPushSql } from './token-store.js';
import { EnviadorPushExpo } from './expo-sender.js';

/**
 * Almacenamiento de tokens y envío de push a través de Expo.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DispositivoPushEntidad])],
  providers: [
    AlmacenTokensPushSql,
    EnviadorPushExpo,
    { provide: ALMACEN_TOKENS_PUSH, useExisting: AlmacenTokensPushSql },
    { provide: ENVIADOR_PUSH, useExisting: EnviadorPushExpo },
  ],
  exports: [ALMACEN_TOKENS_PUSH, ENVIADOR_PUSH],
})
export class NotificacionesAlumnosModulo {}
