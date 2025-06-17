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
  CreateProjectExpenseDto,
  UpdateProjectExpenseDto,
} from './dto/project.dto';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectExpense } from './entities/project-expense.entity';

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
  @ApiQuery({
    name: 'solicitante',
    required: false,
    description: 'Filtrar por nombre del solicitante',
  })
  @ApiQuery({
    name: 'nombreProyecto',
    required: false,
    description: 'Filtrar por nombre del proyecto',
  })
  @ApiQuery({
    name: 'obrero',
    required: false,
    description: 'Filtrar por nombre del obrero',
  })
  @ApiQuery({
    name: 'metodoDePago',
    required: false,
    description: 'Filtrar por método de pago',
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
    description: 'Campo por el cual ordenar (ej. fecha, nombreProyecto)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Orden de clasificación (ASC o DESC)',
    enum: ['ASC', 'DESC'],
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
    @Query('solicitante') solicitante?: string,
    @Query('nombreProyecto') nombreProyecto?: string,
    @Query('obrero') obrero?: string,
    @Query('metodoDePago') metodoDePago?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<{ data: Project[]; total: number; page: number; limit: number }> {
    const filters = {
      status: status ? (status as ProjectStatus) : undefined,
      startDate,
      endDate,
      solicitante,
      nombreProyecto,
      obrero,
      metodoDePago,
    };

    const pagination = {
      page: page ? page : 1,
      limit: limit ? limit : 10,
      sortBy: sortBy ? sortBy : 'created_at',
      sortOrder: sortOrder ? sortOrder : 'DESC',
    };

    return this.projectsService.findAllWithFilters(filters, pagination);
  }
  @Get('summary')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener resumen de proyectos' })
  @ApiResponse({
    status: 200,
    description: 'Resumen estadístico de proyectos',
  })
  async getProjectSummary() {
    return this.projectsService.getProjectSummary();
  }
  @Get(':id')
  @Roles('admin')
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
  @Roles('admin')
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
  @Roles('admin')
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

  // Endpoints para manejar gastos de proyecto

  @Post(':id/expenses')
  @Roles('admin')
  @ApiOperation({ summary: 'Agregar gasto a un proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    type: 'number',
  })
  @ApiResponse({
    status: 201,
    description: 'Gasto agregado exitosamente',
    type: ProjectExpense,
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async addExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() expenseDto: CreateProjectExpenseDto,
  ): Promise<ProjectExpense> {
    return this.projectsService.addExpenseToProject(id, expenseDto);
  }

  @Get(':id/expenses')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener gastos de un proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Gastos del proyecto',
    type: [ProjectExpense],
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async getExpenses(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProjectExpense[]> {
    return this.projectsService.getProjectExpenses(id);
  }

  @Patch(':id/expenses/:expenseId')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar gasto específico de un proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    type: 'number',
  })
  @ApiParam({
    name: 'expenseId',
    description: 'ID del gasto',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Gasto actualizado exitosamente',
    type: ProjectExpense,
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto o gasto no encontrado',
  })
  async updateExpense(
    @Param('id', ParseIntPipe) id: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
    @Body() updateDto: UpdateProjectExpenseDto,
  ): Promise<ProjectExpense> {
    return this.projectsService.updateProjectExpense(id, expenseId, updateDto);
  }

  @Delete(':id/expenses/:expenseId')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar gasto específico de un proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    type: 'number',
  })
  @ApiParam({
    name: 'expenseId',
    description: 'ID del gasto',
    type: 'number',
  })
  @ApiResponse({
    status: 204,
    description: 'Gasto eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto o gasto no encontrado',
  })
  async removeExpense(
    @Param('id', ParseIntPipe) id: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
  ): Promise<void> {
    return this.projectsService.deleteProjectExpense(id, expenseId);
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
