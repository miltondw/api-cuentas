import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { ServiceRequestsService } from './service-requests.service';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from './dto/service-request.dto';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from './entities/service-request.entity';

@ApiTags('Service Requests')
@Controller('service-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}
  @Post()
  @Public() // Permitir que los clientes creen solicitudes sin autenticación
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva solicitud de servicio (Acceso público)',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud de servicio creada exitosamente',
    type: ServiceRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  async create(
    @Body() createServiceRequestDto: CreateServiceRequestDto,
  ): Promise<ServiceRequest> {
    return this.serviceRequestsService.create(createServiceRequestDto);
  }  @Get()
  @Roles('admin', 'client', 'lab') // Allow multiple roles to access
  @ApiOperation({ summary: 'Obtener todas las solicitudes de servicio' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ServiceRequestStatus,
    description: 'Filtrar por estado de la solicitud',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filtrar por nombre del cliente',
  })
  @ApiQuery({
    name: 'nameProject',
    required: false,
    description: 'Filtrar por nombre del proyecto',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filtrar por ubicación',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Filtrar por correo electrónico',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Fecha de inicio para filtrar (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Fecha de fin para filtrar (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'serviceType',
    required: false,
    description: 'Filtrar por tipo de servicio',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página para paginación',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de resultados por página',
    type: Number,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Campo por el cual ordenar (ej. created_at, name, nameProject)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Orden de clasificación (ASC o DESC)',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitudes de servicio',
    type: [ServiceRequest],
  })
  async findAll(
    @Query('status') status?: string,
    @Query('name') name?: string,
    @Query('nameProject') nameProject?: string,
    @Query('location') location?: string,
    @Query('email') email?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('serviceType') serviceType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<{ data: ServiceRequest[]; total: number; page: number; limit: number }> {
    const logger = new Logger('ServiceRequestsController');
    logger.log('Admin accessing service-requests findAll endpoint');
    
    const filters = {
      status: status as ServiceRequestStatus,
      name,
      nameProject,
      location,
      email,
      startDate,
      endDate,
      serviceType,
    };

    const pagination = {
      page: page ? page : 1,
      limit: limit ? limit : 10,
      sortBy: sortBy ? sortBy : 'created_at',
      sortOrder: sortOrder ? sortOrder : 'DESC',
    };

    return this.serviceRequestsService.findAllWithFilters(filters, pagination);
  }
  @Get(':id')
  @Roles('admin', 'client', 'lab')
  @ApiOperation({ summary: 'Obtener una solicitud de servicio por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de la solicitud de servicio',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud de servicio encontrada',
    type: ServiceRequest,
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud de servicio no encontrada',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServiceRequest> {
    return this.serviceRequestsService.findOne(id);
  }  @Patch(':id')
  @Roles('admin', 'client', 'lab')
  @ApiOperation({ summary: 'Actualizar una solicitud de servicio' })
  @ApiParam({
    name: 'id',
    description: 'ID de la solicitud de servicio',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud de servicio actualizada exitosamente',
    type: ServiceRequest,
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud de servicio no encontrada',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceRequestDto: UpdateServiceRequestDto,
  ): Promise<ServiceRequest> {
    return this.serviceRequestsService.update(id, updateServiceRequestDto);
  }  @Delete(':id')
  @Roles('admin', 'lab')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una solicitud de servicio' })
  @ApiParam({
    name: 'id',
    description: 'ID de la solicitud de servicio',
    type: 'number',
  })
  @ApiResponse({
    status: 204,
    description: 'Solicitud de servicio eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud de servicio no encontrada',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.serviceRequestsService.remove(id);
  }
}
