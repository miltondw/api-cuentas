import { IsString, IsNumber, IsOptional, Min, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCompanyExpenseDto {
  @ApiProperty({
    description: 'Month in YYYY-MM format',
    example: '2024-01',
    pattern: '^[0-9]{4}-[0-9]{2}$',
  })
  @IsString()
  @Matches(/^[0-9]{4}-[0-9]{2}$/, {
    message: 'Month must be in YYYY-MM format',
  })
  mes: string;

  @ApiPropertyOptional({
    description: 'Salary expenses',
    example: 5000000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  salarios?: number = 0;

  @ApiPropertyOptional({
    description: 'Electricity expenses',
    example: 150000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  luz?: number = 0;

  @ApiPropertyOptional({
    description: 'Water expenses',
    example: 80000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  agua?: number = 0;

  @ApiPropertyOptional({
    description: 'Rent expenses',
    example: 1200000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  arriendo?: number = 0;

  @ApiPropertyOptional({
    description: 'Internet expenses',
    example: 100000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  internet?: number = 0;

  @ApiPropertyOptional({
    description: 'Health expenses',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  salud?: number = 0;

  @ApiPropertyOptional({
    description: 'Other expenses',
    example: 200000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  otros_campos?: number = 0;
}

export class UpdateCompanyExpenseDto extends PartialType(
  CreateCompanyExpenseDto,
) {}

export class CreateFinancialSummaryDto {
  @ApiProperty({
    description: 'Month in YYYY-MM format',
    example: '2024-01',
    pattern: '^[0-9]{4}-[0-9]{2}$',
  })
  @IsString()
  @Matches(/^[0-9]{4}-[0-9]{2}$/, {
    message: 'Month must be in YYYY-MM format',
  })
  mes: string;

  @ApiProperty({
    description: 'Total income for the month',
    example: 8000000,
    minimum: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  ingresos_totales: number;

  @ApiProperty({
    description: 'Total expenses for the month',
    example: 6000000,
    minimum: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  gastos_totales: number;

  @ApiProperty({
    description: 'Gross profit',
    example: 2000000,
  })
  @IsNumber()
  @Type(() => Number)
  utilidad_bruta: number;

  @ApiProperty({
    description: 'Net profit',
    example: 1800000,
  })
  @IsNumber()
  @Type(() => Number)
  utilidad_neta: number;

  @ApiPropertyOptional({
    description: 'Profit margin percentage',
    example: 22.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  margen_utilidad?: number = 0;
}

export class UpdateFinancialSummaryDto extends PartialType(
  CreateFinancialSummaryDto,
) {}

export class MonthQueryDto {
  @ApiPropertyOptional({
    description: 'Month in YYYY-MM format',
    example: '2024-01',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{4}-[0-9]{2}$/, {
    message: 'Month must be in YYYY-MM format',
  })
  mes?: string;
}

export class YearQueryDto {
  @ApiPropertyOptional({
    description: 'Year in YYYY format',
    example: '2024',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{4}$/, {
    message: 'Year must be in YYYY format',
  })
  year?: string;
}
