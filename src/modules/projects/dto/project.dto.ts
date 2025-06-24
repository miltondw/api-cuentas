import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProjectStatus, PaymentMethod } from '@/modules/projects/entities/project.entity';

// DTO para gastos de proyecto
export class CreateProjectExpenseDto {
  @ApiPropertyOptional({
    description: 'Gasto en camioneta',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  camioneta?: number;

  @ApiPropertyOptional({
    description: 'Gastos de campo',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  campo?: number;

  @ApiPropertyOptional({
    description: 'Gastos en obreros',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  obreros?: number;

  @ApiPropertyOptional({
    description: 'Gastos en comidas',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  comidas?: number;

  @ApiPropertyOptional({
    description: 'Otros gastos',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  otros?: number;

  @ApiPropertyOptional({
    description: 'Gastos en peajes',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  peajes?: number;

  @ApiPropertyOptional({
    description: 'Gastos en combustible',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  combustible?: number;

  @ApiPropertyOptional({
    description: 'Gastos en hospedaje',
    example: 150000,
  })
  @IsOptional()
  @IsNumber()
  hospedaje?: number;

  @ApiPropertyOptional({
    description: 'Otros campos adicionales (JSON)',
    example: { test2: 50000 },
  })
  @IsOptional()
  @IsObject()
  otrosCampos?: any;
}

export class CreateProjectDto {
  @ApiProperty({
    description: 'Fecha del proyecto',
    example: '2025-05-28',
  })
  @IsDateString()
  fecha: string;

  @ApiProperty({
    description: 'Nombre del solicitante',
    example: 'Juan Pérez',
  })
  @IsString()
  solicitante: string;

  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Construcción Edificio Central',
  })
  @IsString()
  nombreProyecto: string;

  @ApiPropertyOptional({
    description: 'Descripción del proyecto',
    example: 'Proyecto de construcción de edificio de oficinas',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'Nombre del obrero o responsable',
    example: 'Carlos López',
  })
  @IsString()
  obrero: string;

  @ApiProperty({
    description: 'Costo total del servicio',
    example: 1500000,
  })
  @IsNumber()
  costoServicio: number;

  @ApiProperty({
    description: 'Abono inicial',
    example: 500000,
  })
  @IsNumber()
  abono: number;

  @ApiPropertyOptional({
    description: 'Número de factura',
    example: 'FAC-001',
  })
  @IsOptional()
  @IsString()
  factura?: string;

  @ApiPropertyOptional({
    description: 'Valor de retención',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  valorRetencion?: number;

  @ApiPropertyOptional({
    description: 'Método de pago',
    enum: PaymentMethod,
    example: PaymentMethod.TRANSFERENCIA,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  metodoDePago?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Estado del proyecto',
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVO,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  estado?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Otros campos adicionales (JSON)',
    example: '{"campo1": "valor1", "campo2": "valor2"}',
  })
  @IsOptional()
  @IsString()
  otros_campos?: string;

  @ApiPropertyOptional({
    description: 'Gastos del proyecto',
    type: [CreateProjectExpenseDto],
    example: [
      {
        camioneta: 50000,
        campo: 0,
        obreros: 0,
        comidas: 0,
        otros: 0,
        peajes: 0,
        combustible: 0,
        hospedaje: 150000,
        otrosCampos: {
          test2: 50000,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectExpenseDto)
  expenses?: CreateProjectExpenseDto[];
}

export class UpdateProjectExpenseDto {
  @ApiPropertyOptional({
    description: 'Gasto en camioneta',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  camioneta?: number;

  @ApiPropertyOptional({
    description: 'Gastos de campo',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  campo?: number;

  @ApiPropertyOptional({
    description: 'Gastos en obreros',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  obreros?: number;

  @ApiPropertyOptional({
    description: 'Gastos en comidas',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  comidas?: number;

  @ApiPropertyOptional({
    description: 'Otros gastos',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  otros?: number;

  @ApiPropertyOptional({
    description: 'Gastos en peajes',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  peajes?: number;

  @ApiPropertyOptional({
    description: 'Gastos en combustible',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  combustible?: number;

  @ApiPropertyOptional({
    description: 'Gastos en hospedaje',
    example: 150000,
  })
  @IsOptional()
  @IsNumber()
  hospedaje?: number;

  @ApiPropertyOptional({
    description: 'Otros campos adicionales (JSON)',
    example: { test2: 50000 },
  })
  @IsOptional()
  @IsObject()
  otrosCampos?: any;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'Fecha del proyecto',
    example: '2025-05-28',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Nombre del solicitante',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString()
  solicitante?: string;

  @ApiPropertyOptional({
    description: 'Nombre del proyecto',
    example: 'Construcción Edificio Central',
  })
  @IsOptional()
  @IsString()
  nombreProyecto?: string;

  @ApiPropertyOptional({
    description: 'Descripción del proyecto',
    example: 'Proyecto de construcción de edificio de oficinas',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Nombre del obrero o responsable',
    example: 'Carlos López',
  })
  @IsOptional()
  @IsString()
  obrero?: string;

  @ApiPropertyOptional({
    description: 'Costo total del servicio',
    example: 1500000,
  })
  @IsOptional()
  @IsNumber()
  costoServicio?: number;

  @ApiPropertyOptional({
    description: 'Abono inicial',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  abono?: number;

  @ApiPropertyOptional({
    description: 'Número de factura',
    example: 'FAC-001',
  })
  @IsOptional()
  @IsString()
  factura?: string;

  @ApiPropertyOptional({
    description: 'Valor de retención',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  valorRetencion?: number;

  @ApiPropertyOptional({
    description: 'Método de pago',
    enum: PaymentMethod,
    example: PaymentMethod.TRANSFERENCIA,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  metodoDePago?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Estado del proyecto',
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVO,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  estado?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Otros campos adicionales (JSON)',
    example: '{"campo1": "valor1", "campo2": "valor2"}',
  })
  @IsOptional()
  @IsString()
  otros_campos?: string;

  @ApiPropertyOptional({
    description: 'Gastos del proyecto (reemplaza todos los gastos existentes)',
    type: [CreateProjectExpenseDto],
    example: [
      {
        camioneta: 50000,
        campo: 0,
        obreros: 0,
        comidas: 0,
        otros: 0,
        peajes: 0,
        combustible: 0,
        hospedaje: 150000,
        otrosCampos: {
          test2: 50000,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectExpenseDto)
  expenses?: CreateProjectExpenseDto[];
}

export class PaymentDto {
  @ApiProperty({
    description: 'Monto del abono adicional',
    example: 200000,
  })
  @IsNumber()
  monto: number;

  @ApiPropertyOptional({
    description: 'Método de pago',
    enum: PaymentMethod,
    example: PaymentMethod.TRANSFERENCIA,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  metodoDePago?: PaymentMethod;
}
