import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { ResumenService } from '@/modules/projects/resumen/resumen.service';

@ApiTags('Resumen Financiero')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('resumen')
export class ResumenController {
  constructor(private readonly resumenService: ResumenService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener todos los resúmenes financieros' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página para paginación',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de items por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de resúmenes financieros',
  })
  async getAllResumenFinanciero(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.resumenService.getAllResumenFinanciero(
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
  }

  @Get('fecha')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener resumen financiero por fecha' })
  @ApiQuery({
    name: 'fecha',
    required: true,
    description: 'Fecha del resumen (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen financiero de la fecha especificada',
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró resumen para la fecha especificada',
  })
  async getResumenFinancieroPorFecha(@Query('fecha') fecha: string) {
    return this.resumenService.getResumenFinancieroPorFecha(fecha);
  }
}
