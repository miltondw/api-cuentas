import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceRequestStatus } from '@/modules/client/service-requests/entities/service-request.entity';

export class ServiceAdditionalValueDto {
  @ApiProperty({
    description: 'Nombre del campo adicional',
    example: 'numero_muestras',
  })
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @ApiProperty({
    description: 'Valor del campo adicional',
    example: '25',
  })
  @IsString()
  @IsNotEmpty()
  fieldValue: string;
}

export class SelectedServiceDto {
  @ApiProperty({
    description: 'ID del servicio',
    example: 1,
  })
  @IsInt()
  @Min(1)
  serviceId: number;

  @ApiProperty({
    description: 'Cantidad del servicio solicitado',
    example: 2,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Valores de campos adicionales del servicio',
    type: [ServiceAdditionalValueDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceAdditionalValueDto)
  additionalValues?: ServiceAdditionalValueDto[];
}

export class CreateServiceRequestDto {
  @ApiProperty({
    description: 'Nombre del solicitante',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Construcción Edificio Central',
  })
  @IsString()
  @IsNotEmpty()
  nameProject: string;

  @ApiProperty({
    description: 'Ubicación del proyecto',
    example: 'Av. Principal 123, Bogotá',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Número de identificación',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  identification: string;

  @ApiProperty({
    description: 'Número de teléfono',
    example: '+57 300 123 4567',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'juan.perez@email.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Descripción del proyecto',
    example: 'Solicitud de servicios geotécnicos para construcción de edificio',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Servicios seleccionados',
    type: [SelectedServiceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedServiceDto)
  selectedServices: SelectedServiceDto[];
}

export class UpdateServiceRequestDto {
  @ApiPropertyOptional({
    description: 'Nombre del solicitante',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'Nombre del proyecto',
    example: 'Construcción Edificio Central',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameProject?: string;

  @ApiPropertyOptional({
    description: 'Ubicación del proyecto',
    example: 'Av. Principal 123, Bogotá',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiPropertyOptional({
    description: 'Número de identificación',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  identification?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+57 300 123 4567',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'juan.perez@email.com',
  })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({
    description: 'Descripción del proyecto',
    example: 'Solicitud de servicios geotécnicos para construcción de edificio',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({
    description: 'Estado de la solicitud',
    enum: ServiceRequestStatus,
    example: ServiceRequestStatus.COMPLETADO,
  })
  @IsOptional()
  @IsEnum(ServiceRequestStatus)
  status?: ServiceRequestStatus;
}
