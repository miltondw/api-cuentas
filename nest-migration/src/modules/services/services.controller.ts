import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { ServiceCategory } from './entities/service-category.entity';

@ApiTags('Services')
@Controller('services')
@Public() // Hacer todos los endpoints de servicios públicos para permitir acceso sin autenticación
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}
  @Get()
  @ApiOperation({ summary: 'Obtener todos los servicios (Acceso público)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los servicios disponibles públicamente',
    type: [Service],
  })
  async findAll(): Promise<Service[]> {
    return this.servicesService.findAllServices();
  }
  @Get('categories')
  @ApiOperation({ summary: 'Obtener todas las categorías de servicios (Acceso público)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas las categorías disponibles públicamente',
    type: [ServiceCategory],
  })
  async findAllCategories(): Promise<ServiceCategory[]> {
    return this.servicesService.findAllCategories();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Obtener servicios por categoría' })
  @ApiParam({
    name: 'categoryId',
    description: 'ID de la categoría',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Servicios de la categoría especificada',
    type: [Service],
  })
  async findByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<Service[]> {
    return this.servicesService.findServicesByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un servicio por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del servicio',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Servicio encontrado',
    type: Service,
  })
  @ApiResponse({
    status: 404,
    description: 'Servicio no encontrado',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Service> {
    return this.servicesService.findServiceById(id);
  }
}
