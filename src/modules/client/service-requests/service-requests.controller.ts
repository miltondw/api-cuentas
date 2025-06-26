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
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { ServiceRequestsService } from '@/modules/client/service-requests/service-requests.service';
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
  }
  @Get()
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
    description:
      'Campo por el cual ordenar (ej. created_at, name, nameProject)',
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
  ): Promise<{
    data: ServiceRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
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
  }
  @Patch(':id')
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
  }
  @Delete(':id')
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

  @Put(':id')
  @Roles('admin', 'client', 'lab')
  @ApiOperation({
    summary: 'Reemplazar completamente una solicitud de servicio (PUT)',
    description:
      'Reemplaza todos los datos de la solicitud, incluyendo servicios seleccionados y valores adicionales. Útil para que el admin o cliente pueda modificar cualquier campo, agregar o quitar servicios, o actualizar valores adicionales.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la solicitud de servicio',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud de servicio reemplazada exitosamente',
    type: ServiceRequest,
    examples: {
      ejemplo: {
        summary: 'Ejemplo de respuesta',
        value: {
          id: 88,
          name: 'milton estrada',
          nameProject: 'nombre del proyecto',
          location: 'asd jsajdajd adhs aksd aldh alsdh alhd alkh a',
          identification: '29398836',
          phone: '3002321421',
          email: 'estradamilton2001@gmail.com',
          description:
            'ekajfkajdfhakbf a ajbf lkajhf lkajbf abfabf abfabfabfla lab f',
          status: 'pendiente',
          created_at: '2025-06-20T17:51:06.000Z',
          updatedAt: '2025-06-25T17:18:22.000Z',
          selectedServices: [
            {
              id: 360,
              requestId: 88,
              serviceId: 2,
              quantity: 1,
              created_at: '2025-06-20T17:51:06.000Z',
              service: {
                id: 2,
                categoryId: 1,
                code: 'SR-2',
                name: 'Tamaños de las partículas de los suelos (tamizado)',
                created_at: '2025-04-22T16:50:47.000Z',
                updatedAt: '2025-04-22T16:50:47.000Z',
                category: {
                  id: 1,
                  code: 'SR',
                  name: 'SUELOS DE RELLENOS',
                  created_at: '2025-04-22T16:47:58.000Z',
                  updatedAt: '2025-04-22T16:47:58.000Z',
                },
                additionalFields: [],
              },
              serviceInstances: [],
              additionalValues: [],
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud de servicio no encontrada',
  })
  async replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() createServiceRequestDto: CreateServiceRequestDto,
  ): Promise<ServiceRequest> {
    return this.serviceRequestsService.replace(id, createServiceRequestDto);
  }
}
