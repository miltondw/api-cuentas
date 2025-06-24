import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min, Max } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (starting from 1)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export class SearchDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search term',
  })
  @IsOptional()
  search?: string;
}

export class SortDto {
  @ApiPropertyOptional({
    description: 'Field to sort by',
  })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class FilterDto extends SearchDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering',
  })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering',
  })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Status filter',
  })
  @IsOptional()
  status?: string;
}
