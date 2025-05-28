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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServiceRequestsService } from './service-requests.service';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from './dto/service-request.dto';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from './entities/service-request.entity';

@ApiTags('Service Requests - Client')
@Controller('client/service-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  @Roles('admin', 'client')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva solicitud de servicio' })
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
  @Roles('admin', 'client', 'lab')
  @ApiOperation({ summary: 'Obtener todas las solicitudes de servicio' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ServiceRequestStatus,
    description: 'Filtrar por estado de la solicitud',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitudes de servicio',
    type: [ServiceRequest],
  })
  async findAll(@Query('status') status?: string): Promise<ServiceRequest[]> {
    if (status) {
      return this.serviceRequestsService.findByStatus(status);
    }
    return this.serviceRequestsService.findAll();
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
