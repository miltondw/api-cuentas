import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class MineQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página para paginación',
    example: '1',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const n = parseInt(value, 10);
    return isNaN(n) || n < 1 ? 1 : n;
  })
  page?: string;

  @ApiPropertyOptional({
    description: 'Límite de resultados por página',
    example: '10',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const n = parseInt(value, 10);
    return isNaN(n) || n < 1 ? 10 : n;
  })
  limit?: string;
}
