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
import { Public } from '../auth/decorators/public.decorator';
import { ServiceRequestsService } from '../service-requests/service-requests.service';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from '../service-requests/dto/service-request.dto';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from '../service-requests/entities/service-request.entity';

@ApiTags('Client Service Requests')
@Controller('client/service-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  @Public() // Permitir que los clientes creen solicitudes sin autenticación
  @ApiOperation({
    summary: 'Crear una nueva solicitud de servicio (Acceso público)',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud de servicio creada exitosamente',
    type: ServiceRequest,
  })
  async create(
    @Body() createServiceRequestDto: CreateServiceRequestDto,
  ): Promise<ServiceRequest> {
    return this.serviceRequestsService.create(createServiceRequestDto);
  }  @Get()
  @Roles('admin', 'client', 'lab')
  @ApiOperation({ summary: 'Obtener todas las solicitudes de servicio' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ServiceRequestStatus,
    description: 'Filtrar por estado de la solicitud',
  })  async findAll(@Query('status') status?: string): Promise<ServiceRequest[]> {
    console.log('Accessing client/service-requests findAll endpoint');
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
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServiceRequest> {
    return this.serviceRequestsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'client', 'lab')
  @ApiOperation({
    summary: 'Actualizar parcialmente una solicitud de servicio',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la solicitud de servicio',
    type: 'number',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceRequestDto: UpdateServiceRequestDto,
  ): Promise<ServiceRequest> {
    return this.serviceRequestsService.update(id, updateServiceRequestDto);
  }

  @Delete(':id')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Eliminar una solicitud de servicio' })
  @ApiParam({
    name: 'id',
    description: 'ID de la solicitud de servicio',
    type: 'number',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.serviceRequestsService.remove(id);
  }
}
