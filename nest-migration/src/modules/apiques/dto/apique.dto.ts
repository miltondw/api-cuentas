import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateLayerDto {
  @ApiProperty({
    description: 'Layer number',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  layer_number: number;

  @ApiPropertyOptional({
    description: 'Layer thickness in meters',
    example: 0.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  thickness?: number;

  @ApiPropertyOptional({
    description: 'Sample ID for the layer',
    example: 'M-01',
  })
  @IsOptional()
  @IsString()
  sample_id?: string;

  @ApiPropertyOptional({
    description: 'Observations about the layer',
    example: 'Clay with high plasticity',
  })
  @IsOptional()
  @IsString()
  observation?: string;
}

export class UpdateLayerDto extends PartialType(CreateLayerDto) {}

export class CreateApiqueDto {
  @ApiProperty({
    description: 'Project ID',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  proyecto_id: number;

  @ApiPropertyOptional({
    description: 'Apique number',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  apique?: number;

  @ApiProperty({
    description: 'Location of the apique',
    example: 'Norte del terreno, coordenadas X: 123456, Y: 654321',
  })
  @IsString()
  location: string;

  @ApiPropertyOptional({
    description: 'Depth of the apique in meters',
    example: 3.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  depth?: number;

  @ApiPropertyOptional({
    description: 'Date when the apique was excavated',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Whether CBR test was performed on unaltered sample',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  cbr_unaltered?: boolean = false;

  @ApiPropertyOptional({
    description: 'Depth where sample was taken for analysis',
    example: 1.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  depth_tomo?: number;

  @ApiPropertyOptional({
    description: 'Type of mold used',
    example: 'Estándar',
  })
  @IsOptional()
  @IsString()
  molde?: string;

  @ApiPropertyOptional({
    description: 'Layers found in the apique',
    type: [CreateLayerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLayerDto)
  layers?: CreateLayerDto[];
}

export class UpdateApiqueDto extends PartialType(CreateApiqueDto) {}

export class ApiqueQueryDto {
  @ApiPropertyOptional({
    description: 'Project ID to filter apiques',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  proyecto_id?: number;
}

export class LayerResponseDto {
  @ApiProperty({ example: 1 })
  layer_id: number;

  @ApiProperty({ example: 1 })
  apique_id: number;

  @ApiProperty({ example: 1 })
  layer_number: number;

  @ApiProperty({ example: 0.5, required: false })
  thickness?: number;

  @ApiProperty({ example: 'M-01', required: false })
  sample_id?: string;

  @ApiProperty({ example: 'Clay with high plasticity', required: false })
  observation?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ApiqueResponseDto {
  @ApiProperty({ example: 1 })
  apique_id: number;

  @ApiProperty({ example: 1 })
  proyecto_id: number;

  @ApiProperty({ example: 1, required: false })
  apique?: number;

  @ApiProperty({
    example: 'Norte del terreno, coordenadas X: 123456, Y: 654321',
  })
  location: string;

  @ApiProperty({ example: 3.0, required: false })
  depth?: number;

  @ApiProperty({ example: '2024-01-15', required: false })
  date?: Date;

  @ApiProperty({ example: false, required: false })
  cbr_unaltered?: boolean;

  @ApiProperty({ example: 1.5, required: false })
  depth_tomo?: number;

  @ApiProperty({ example: 'Estándar', required: false })
  molde?: string;

  @ApiProperty({ type: [LayerResponseDto] })
  layers: LayerResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
