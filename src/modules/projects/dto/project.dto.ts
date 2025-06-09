import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus, PaymentMethod } from '../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Fecha del proyecto',
    example: '2025-05-28',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @ApiProperty({
    description: 'Nombre del solicitante',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  solicitante: string;

  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Construcción Edificio Central',
  })
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  obrero: string;

  @ApiProperty({
    description: 'Costo total del servicio',
    example: 1500000,
  })
  @IsNumber()
  @Min(0)
  costoServicio: number;

  @ApiProperty({
    description: 'Abono inicial',
    example: 500000,
  })
  @IsNumber()
  @Min(0)
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
  @Min(0)
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
  @IsNotEmpty()
  solicitante?: string;

  @ApiPropertyOptional({
    description: 'Nombre del proyecto',
    example: 'Construcción Edificio Central',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  obrero?: string;

  @ApiPropertyOptional({
    description: 'Costo total del servicio',
    example: 1500000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costoServicio?: number;

  @ApiPropertyOptional({
    description: 'Abono inicial',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
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
  @Min(0)
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
}

export class PaymentDto {
  @ApiProperty({
    description: 'Monto del abono adicional',
    example: 200000,
  })
  @IsNumber()
  @Min(0)
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
