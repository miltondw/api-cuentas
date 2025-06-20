import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceCategoryDto {
  @ApiProperty({ description: 'Código único de la categoría', maxLength: 10 })
  @IsString()
  @Length(1, 10)
  code: string;

  @ApiProperty({ description: 'Nombre de la categoría', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  name: string;
}

export class UpdateServiceCategoryDto {
  @ApiProperty({
    description: 'Código único de la categoría',
    maxLength: 10,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  code?: string;

  @ApiProperty({
    description: 'Nombre de la categoría',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;
}

export class CreateServiceAdditionalFieldDto {
  @ApiProperty({ description: 'Nombre del campo', maxLength: 100 })
  @IsString()
  @Length(1, 100)
  fieldName: string;

  @ApiProperty({
    description: 'Tipo de campo (text, number, select, date, checkbox)',
    enum: ['text', 'number', 'select', 'date', 'checkbox'],
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Indica si el campo es requerido',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiProperty({
    description: 'Opciones para campos tipo select',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({
    description: 'Campo del cual depende este campo',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  dependsOnField?: string;

  @ApiProperty({
    description: 'Valor que debe tener el campo padre para mostrar este campo',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  dependsOnValue?: string;

  @ApiProperty({
    description: 'Etiqueta descriptiva del campo',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  label?: string;

  @ApiProperty({ description: 'Orden de visualización del campo', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;
}

export class UpdateServiceAdditionalFieldDto {
  @ApiProperty({
    description: 'Nombre del campo',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  fieldName?: string;

  @ApiProperty({
    description: 'Tipo de campo (text, number, select, date, checkbox)',
    enum: ['text', 'number', 'select', 'date', 'checkbox'],
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Indica si el campo es requerido',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiProperty({
    description: 'Opciones para campos tipo select',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({
    description: 'Campo del cual depende este campo',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  dependsOnField?: string;

  @ApiProperty({
    description: 'Valor que debe tener el campo padre para mostrar este campo',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  dependsOnValue?: string;

  @ApiProperty({
    description: 'Etiqueta descriptiva del campo',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  label?: string;

  @ApiProperty({
    description: 'Orden de visualización del campo',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;
}

export class CreateServiceDto {
  @ApiProperty({
    description: 'ID de la categoría a la que pertenece el servicio',
  })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ description: 'Código único del servicio', maxLength: 10 })
  @IsString()
  @Length(1, 10)
  code: string;

  @ApiProperty({ description: 'Nombre del servicio', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  name: string;
}

export class UpdateServiceDto {
  @ApiProperty({
    description: 'ID de la categoría a la que pertenece el servicio',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiProperty({
    description: 'Código único del servicio',
    maxLength: 10,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  code?: string;

  @ApiProperty({
    description: 'Nombre del servicio',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;
}

export class CreateServiceWithFieldsDto {
  @ApiProperty({
    description: 'ID de la categoría a la que pertenece el servicio',
  })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ description: 'Código único del servicio', maxLength: 10 })
  @IsString()
  @Length(1, 10)
  code: string;

  @ApiProperty({ description: 'Nombre del servicio', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: 'Campos adicionales del servicio',
    type: [CreateServiceAdditionalFieldDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceAdditionalFieldDto)
  additionalFields?: CreateServiceAdditionalFieldDto[];
}
