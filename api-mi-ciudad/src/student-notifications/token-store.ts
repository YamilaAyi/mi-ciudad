import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AlmacenTokensPush, PlataformaPush } from '../common/notifications/ports.js';
import { DispositivoPushEntidad } from './push-device.entity.js';

@Injectable()
export class AlmacenTokensPushSql implements AlmacenTokensPush {
  constructor(
    @InjectRepository(DispositivoPushEntidad)
    private readonly dispositivos: Repository<DispositivoPushEntidad>,
  ) {}

  async guardar(
    usuarioId: string,
    tokenExpo: string,
    plataforma: PlataformaPush,
  ): Promise<{ nuevo: boolean }> {
    const existente = await this.dispositivos.findOneBy({ tokenExpo });
    await this.dispositivos.upsert({ tokenExpo, usuarioId, plataforma }, ['tokenExpo']);
    return { nuevo: !existente };
  }

  async borrar(tokenExpo: string): Promise<void> {
    await this.dispositivos.delete({ tokenExpo });
  }

  async tokensDe(usuarioIds: string[]): Promise<string[]> {
    if (usuarioIds.length === 0) return [];
    const dispositivos = await this.dispositivos.find({
      select: { tokenExpo: true },
      where: { usuarioId: In(usuarioIds) },
    });
    return dispositivos.map(({ tokenExpo }) => tokenExpo);
  }

  async descartar(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.dispositivos.delete({ tokenExpo: In(tokens) });
  }
}
