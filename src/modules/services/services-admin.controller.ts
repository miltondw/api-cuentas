import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServicesAdminService } from './services-admin.service';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceAdditionalFieldDto,
  UpdateServiceAdditionalFieldDto,
  CreateServiceWithFieldsDto,
} from './dto/admin-services.dto';
import { ServiceCategory } from './entities/service-category.entity';
import { Service } from './entities/service.entity';
import { ServiceAdditionalField } from './entities/service-additional-field.entity';

@ApiTags('Services Administration')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/services')
export class ServicesAdminController {
  constructor(private readonly servicesAdminService: ServicesAdminService) {}

  // ===== CATEGORÍAS =====
  @Post('categories')
  @ApiOperation({ summary: 'Crear una nueva categoría de servicios' })
  @ApiResponse({
    status: 201,
    description: 'Categoría creada exitosamente',
    type: ServiceCategory,
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o categoría ya existe',
  })
  async createCategory(
    @Body() createCategoryDto: CreateServiceCategoryDto,
  ): Promise<ServiceCategory> {
    return this.servicesAdminService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Obtener todas las categorías (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías',
    type: [ServiceCategory],
  })
  async getAllCategories(): Promise<ServiceCategory[]> {
    return this.servicesAdminService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  @ApiParam({ name: 'id', description: 'ID de la categoría', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Categoría encontrada',
    type: ServiceCategory,
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async getCategoryById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServiceCategory> {
    return this.servicesAdminService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Actualizar una categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Categoría actualizada exitosamente',
    type: ServiceCategory,
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategory> {
    return this.servicesAdminService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría', type: 'number' })
  @ApiResponse({ status: 204, description: 'Categoría eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({
    status: 400,
    description:
      'No se puede eliminar la categoría porque tiene servicios asociados',
  })
  async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.servicesAdminService.deleteCategory(id);
  }

  // ===== SERVICIOS =====  @Post('complete')
  @ApiOperation({ summary: 'Crear un servicio con campos adicionales' })
  @ApiResponse({
    status: 201,
    description: 'Servicio creado con campos adicionales',
    type: Service,
  })
  async createServiceWithFields(
    @Body() createServiceDto: CreateServiceWithFieldsDto,
  ): Promise<Service> {
    return this.servicesAdminService.createServiceWithFields(createServiceDto);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo servicio' })
  @ApiResponse({
    status: 201,
    description: 'Servicio creado exitosamente',
    type: Service,
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o servicio ya existe',
  })
  async createService(
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<Service> {
    return this.servicesAdminService.createService(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los servicios (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de servicios',
    type: [Service],
  })
  async getAllServices(): Promise<Service[]> {
    return this.servicesAdminService.findAllServices();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un servicio por ID' })
  @ApiParam({ name: 'id', description: 'ID del servicio', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Servicio encontrado',
    type: Service,
  })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async getServiceById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Service> {
    return this.servicesAdminService.findServiceById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Servicio actualizado exitosamente',
    type: Service,
  })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async updateService(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    return this.servicesAdminService.updateService(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio', type: 'number' })
  @ApiResponse({ status: 204, description: 'Servicio eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async deleteService(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.servicesAdminService.deleteService(id);
  }

  // ===== CAMPOS ADICIONALES =====
  @Post(':serviceId/fields')
  @ApiOperation({ summary: 'Añadir un campo adicional a un servicio' })
  @ApiParam({
    name: 'serviceId',
    description: 'ID del servicio',
    type: 'number',
  })
  @ApiResponse({
    status: 201,
    description: 'Campo adicional creado exitosamente',
    type: ServiceAdditionalField,
  })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async addAdditionalField(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body() createFieldDto: CreateServiceAdditionalFieldDto,
  ): Promise<ServiceAdditionalField> {
    return this.servicesAdminService.addAdditionalField(
      serviceId,
      createFieldDto,
    );
  }

  @Get(':serviceId/fields')
  @ApiOperation({
    summary: 'Obtener todos los campos adicionales de un servicio',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'ID del servicio',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de campos adicionales',
    type: [ServiceAdditionalField],
  })
  async getAdditionalFields(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<ServiceAdditionalField[]> {
    return this.servicesAdminService.getAdditionalFieldsByService(serviceId);
  }

  @Get('fields/:fieldId')
  @ApiOperation({ summary: 'Obtener un campo adicional por ID' })
  @ApiParam({
    name: 'fieldId',
    description: 'ID del campo adicional',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Campo adicional encontrado',
    type: ServiceAdditionalField,
  })
  @ApiResponse({ status: 404, description: 'Campo adicional no encontrado' })
  async getAdditionalFieldById(
    @Param('fieldId', ParseIntPipe) fieldId: number,
  ): Promise<ServiceAdditionalField> {
    return this.servicesAdminService.getAdditionalFieldById(fieldId);
  }

  @Patch('fields/:fieldId')
  @ApiOperation({ summary: 'Actualizar un campo adicional' })
  @ApiParam({
    name: 'fieldId',
    description: 'ID del campo adicional',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Campo adicional actualizado exitosamente',
    type: ServiceAdditionalField,
  })
  @ApiResponse({ status: 404, description: 'Campo adicional no encontrado' })
  async updateAdditionalField(
    @Param('fieldId', ParseIntPipe) fieldId: number,
    @Body() updateFieldDto: UpdateServiceAdditionalFieldDto,
  ): Promise<ServiceAdditionalField> {
    return this.servicesAdminService.updateAdditionalField(
      fieldId,
      updateFieldDto,
    );
  }

  @Delete('fields/:fieldId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un campo adicional' })
  @ApiParam({
    name: 'fieldId',
    description: 'ID del campo adicional',
    type: 'number',
  })
  @ApiResponse({
    status: 204,
    description: 'Campo adicional eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Campo adicional no encontrado' })
  async deleteAdditionalField(
    @Param('fieldId', ParseIntPipe) fieldId: number,
  ): Promise<void> {
    await this.servicesAdminService.deleteAdditionalField(fieldId);
  }
}
