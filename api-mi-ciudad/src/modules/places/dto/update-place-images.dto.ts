import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString, MaxLength } from 'class-validator';

export class ActualizarImagenesLugarDto {
  @ApiProperty({
    type: [String],
    description:
      'Lista completa de hasta 20 URLs de imágenes subidas con POST /archivos. Una lista vacía quita todas las imágenes.',
    maxItems: 20,
    example: ['http://localhost:3000/archivos/imagenes/2026/09/abc123def456.jpg'],
  })
  @IsArray({ message: 'Las fotos tienen que enviarse en una lista.' })
  @ArrayMaxSize(20, { message: 'El lugar puede tener hasta 20 fotos.' })
  @IsString({ each: true, message: 'Alguna de las fotos no es válida.' })
  @MaxLength(2000, { each: true, message: 'Alguna de las fotos no es válida.' })
  imagenes: string[];
}
