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
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  PaymentDto,
} from './dto/project.dto';
import { Project, ProjectStatus } from './entities/project.entity';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear un nuevo proyecto' })
  @ApiResponse({
    status: 201,
    description: 'Proyecto creado exitosamente',
    type: Project,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  async create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener todos los proyectos' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProjectStatus,
    description: 'Filtrar por estado del proyecto',
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
  @ApiResponse({
    status: 200,
    description: 'Lista de proyectos',
    type: [Project],
  })
  async findAll(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Project[]> {
    if (status) {
      return this.projectsService.findByStatus(status as ProjectStatus);
    }

    if (startDate && endDate) {
      return this.projectsService.findByDateRange(startDate, endDate);
    }

    return this.projectsService.findAll();
  }

  @Get('summary')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Obtener resumen de proyectos' })
  @ApiResponse({
    status: 200,
    description: 'Resumen estadístico de proyectos',
  })
  async getProjectSummary() {
    return this.projectsService.getProjectSummary();
  }

  @Get(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Obtener un proyecto por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto encontrado',
    type: Project,
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Actualizar un proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto actualizado exitosamente',
    type: Project,
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Patch(':id/payment')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Agregar un abono al proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Abono agregado exitosamente',
    type: Project,
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'El abono excede el costo del servicio',
  })
  async addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() paymentDto: PaymentDto,
  ): Promise<Project> {
    return this.projectsService.addPayment(id, paymentDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar un proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    type: 'number',
  })
  @ApiResponse({
    status: 204,
    description: 'Proyecto eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.projectsService.remove(id);
  }
}
