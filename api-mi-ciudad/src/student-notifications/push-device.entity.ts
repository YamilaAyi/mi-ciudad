import { Entity, Index, PrimaryColumn } from 'typeorm';
import { ColumnaEnum, ColumnaTexto } from '../common/db/columns.js';
import { motorEfectivo } from '../common/db/providers.js';
import type { PlataformaPush } from '../common/notifications/ports.js';

@Entity('dispositivos_push')
@Index(['usuarioId'])
export class DispositivoPushEntidad {
  @PrimaryColumn({
    type: 'varchar',
    length: 200,
    ...(motorEfectivo(process.env) === 'mysql' || motorEfectivo(process.env) === 'mariadb'
      ? { collation: 'utf8mb4_bin' }
      : {}),
  })
  tokenExpo: string;

  @ColumnaTexto(40)
  usuarioId: string;

  @ColumnaEnum()
  plataforma: PlataformaPush;
}
