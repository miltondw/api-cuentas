import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export enum ProjectStatus {
  ACTIVO = 'activo',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  PAUSADO = 'pausado',
}

export enum LabProjectSortBy {
  ID = 'id',
  FECHA = 'fecha',
  NOMBRE_PROYECTO = 'nombreProyecto',
  SOLICITANTE = 'solicitante',
  ESTADO = 'estado',
  TOTAL_APIQUES = 'total_apiques',
  TOTAL_PROFILES = 'total_profiles',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class LabProjectsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Results limit per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: LabProjectSortBy,
    default: LabProjectSortBy.FECHA,
  })
  @IsOptional()
  @IsEnum(LabProjectSortBy, { message: 'Invalid sort field' })
  sortBy?: LabProjectSortBy = LabProjectSortBy.FECHA;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order must be ASC or DESC' })
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Filter by project name (partial match, case insensitive)',
  })
  @IsOptional()
  @IsString()
  nombreProyecto?: string;

  @ApiPropertyOptional({
    description: 'Filter by applicant name (partial match, case insensitive)',
  })
  @IsOptional()
  @IsString()
  solicitante?: string;

  @ApiPropertyOptional({
    description: 'Filter by worker name (partial match, case insensitive)',
  })
  @IsOptional()
  @IsString()
  obrero?: string;

  @ApiPropertyOptional({
    description: 'Filter by project status',
    enum: ProjectStatus,
  })
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Invalid project status' })
  estado?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Filter by start date (YYYY-MM-DD)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (YYYY-MM-DD)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date (YYYY-MM-DD)' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter projects with/without apiques',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'hasApiques must be a boolean' })
  hasApiques?: boolean;

  @ApiPropertyOptional({
    description: 'Filter projects with/without profiles',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'hasProfiles must be a boolean' })
  hasProfiles?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum number of apiques',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minApiques must be a number' })
  @Min(0, { message: 'minApiques must be at least 0' })
  minApiques?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of apiques',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'maxApiques must be a number' })
  @Min(0, { message: 'maxApiques must be at least 0' })
  maxApiques?: number;

  @ApiPropertyOptional({
    description: 'Minimum number of profiles',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minProfiles must be a number' })
  @Min(0, { message: 'minProfiles must be at least 0' })
  minProfiles?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of profiles',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'maxProfiles must be a number' })
  @Min(0, { message: 'maxProfiles must be at least 0' })
  maxProfiles?: number;

  @ApiPropertyOptional({
    description:
      'Global search across project name, applicant, and worker (case insensitive)',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class LabProjectDto {
  @ApiProperty({ description: 'Project ID' })
  proyecto_id: number;

  @ApiProperty({ description: 'Project name' })
  nombre_proyecto: string;

  @ApiProperty({ description: 'Applicant name' })
  solicitante: string;

  @ApiProperty({ description: 'Worker name' })
  obrero: string;

  @ApiProperty({ description: 'Project date' })
  fecha: string;

  @ApiProperty({ description: 'Project status', enum: ProjectStatus })
  estado: ProjectStatus;

  @ApiProperty({ description: 'Total number of apiques in this project' })
  total_apiques: number;

  @ApiProperty({ description: 'Total number of profiles in this project' })
  total_profiles: number;

  @ApiProperty({ description: 'Project creation date' })
  created_at: string;
}

export class LabProjectsResponseDto {
  @ApiProperty({
    description: 'Array of lab projects with statistics',
    type: [LabProjectDto],
  })
  data: LabProjectDto[];

  @ApiProperty({ description: 'Total number of projects (before pagination)' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of results per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalApiques: number;
    totalProfiles: number;
    projectsWithApiques: number;
    projectsWithProfiles: number;
  };
}
