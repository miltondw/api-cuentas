import {
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBlowDto {
  @ApiProperty({
    description: 'Profundidad del golpeo (metros)',
    example: 1.5,
  })
  @IsNumber()
  @Min(0)
  depth: number;

  @ApiPropertyOptional({
    description: 'Golpes a 6 pulgadas',
    example: 8,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  blows6?: number;

  @ApiPropertyOptional({
    description: 'Golpes a 12 pulgadas',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  blows12?: number;

  @ApiPropertyOptional({
    description: 'Golpes a 18 pulgadas',
    example: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  blows18?: number;

  @ApiPropertyOptional({
    description: 'Valor N del SPT',
    example: 27,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  n?: number;

  @ApiPropertyOptional({
    description: 'Observaciones del golpeo',
    example: 'Rechazo a los 18cm',
  })
  @IsOptional()
  @IsString()
  observation?: string;
}

export class UpdateBlowDto {
  @ApiPropertyOptional({
    description: 'Profundidad del golpeo (metros)',
    example: 1.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depth?: number;

  @ApiPropertyOptional({
    description: 'Golpes a 6 pulgadas',
    example: 8,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  blows6?: number;

  @ApiPropertyOptional({
    description: 'Golpes a 12 pulgadas',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  blows12?: number;

  @ApiPropertyOptional({
    description: 'Golpes a 18 pulgadas',
    example: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  blows18?: number;

  @ApiPropertyOptional({
    description: 'Valor N del SPT',
    example: 27,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  n?: number;

  @ApiPropertyOptional({
    description: 'Observaciones del golpeo',
    example: 'Rechazo a los 18cm',
  })
  @IsOptional()
  @IsString()
  observation?: string;
}

export class CreateProfileDto {
  @ApiProperty({
    description: 'ID del proyecto asociado',
    example: 1,
  })
  @IsInt()
  @Min(1)
  projectId: number;

  @ApiPropertyOptional({
    description: 'Fecha del perfil',
    example: '2025-05-28',
  })
  @IsOptional()
  @IsDateString()
  profileDate?: string;

  @ApiPropertyOptional({
    description: 'Número de muestras',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  samplesNumber?: number;

  @ApiProperty({
    description: 'Número de sondeo',
    example: 'S-001',
  })
  @IsString()
  @IsNotEmpty()
  soundingNumber: string;

  @ApiPropertyOptional({
    description: 'Descripción del perfil',
    example: 'Perfil estratigráfico del sondeo 1',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Ubicación del perfil',
    example: 'Sector Norte, Lote 1',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Latitud',
    example: 4.624335,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud',
    example: -74.063644,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Profundidad total del sondeo (metros)',
    example: 15.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depth?: number;

  @ApiPropertyOptional({
    description: 'Nivel freático (metros)',
    example: 2.3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  waterLevel?: number;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Se encontró nivel freático a 2.3m',
  })
  @IsOptional()
  @IsString()
  observations?: string;
  @ApiPropertyOptional({
    description: 'Datos del perfil en formato JSON',
    example: { estratos: [{ profundidad: 1.5, descripcion: 'Arcilla' }] },
  })
  @IsOptional()
  @IsObject()
  profileData?: any;

  @ApiPropertyOptional({
    description: 'Datos de golpeos SPT',
    type: [CreateBlowDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlowDto)
  blows?: CreateBlowDto[];
}

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'ID del proyecto asociado',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  projectId?: number;

  @ApiPropertyOptional({
    description: 'Fecha del perfil',
    example: '2025-05-28',
  })
  @IsOptional()
  @IsDateString()
  profileDate?: string;

  @ApiPropertyOptional({
    description: 'Número de muestras',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  samplesNumber?: number;

  @ApiPropertyOptional({
    description: 'Número de sondeo',
    example: 'S-001',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  soundingNumber?: string;

  @ApiPropertyOptional({
    description: 'Descripción del perfil',
    example: 'Perfil estratigráfico del sondeo 1',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Ubicación del perfil',
    example: 'Sector Norte, Lote 1',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Latitud',
    example: 4.624335,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud',
    example: -74.063644,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Profundidad total del sondeo (metros)',
    example: 15.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depth?: number;

  @ApiPropertyOptional({
    description: 'Nivel freático (metros)',
    example: 2.3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  waterLevel?: number;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Se encontró nivel freático a 2.3m',
  })
  @IsOptional()
  @IsString()
  observations?: string;
  @ApiPropertyOptional({
    description: 'Datos del perfil en formato JSON',
    example: { estratos: [{ profundidad: 1.5, descripcion: 'Arcilla' }] },
  })
  @IsOptional()
  @IsObject()
  profileData?: any;

  @ApiPropertyOptional({
    description: 'Datos de golpeos SPT',
    type: [UpdateBlowDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBlowDto)
  blows?: UpdateBlowDto[];
}
