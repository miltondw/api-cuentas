import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { ServiceCategory } from './entities/service-category.entity';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los servicios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los servicios',
    type: [Service],
  })
  async findAll(): Promise<Service[]> {
    return this.servicesService.findAllServices();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Obtener todas las categorías de servicios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas las categorías',
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
