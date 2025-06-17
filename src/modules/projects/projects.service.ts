import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsOrder } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectExpense } from './entities/project-expense.entity';
import {
  CreateProjectDto,
  UpdateProjectDto,
  PaymentDto,
  CreateProjectExpenseDto,
  UpdateProjectExpenseDto,
} from './dto/project.dto';

// Definir los tipos para los filtros y la paginación
interface ProjectFilters {
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  solicitante?: string;
  nombreProyecto?: string;
  obrero?: string;
  metodoDePago?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectExpense)
    private projectExpenseRepository: Repository<ProjectExpense>,
  ) {}
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Validar que el abono no sea mayor al costo del servicio
    if (createProjectDto.abono > createProjectDto.costoServicio) {
      throw new BadRequestException(
        'El abono no puede ser mayor al costo del servicio',
      );
    }

    // Extraer los gastos del DTO
    const { expenses, ...projectData } = createProjectDto;

    // Crear el proyecto
    const project = this.projectRepository.create(projectData);
    const savedProject = await this.projectRepository.save(project);

    // Si hay gastos, crearlos
    if (expenses && expenses.length > 0) {
      const projectExpenses = expenses.map(expense => {
        const projectExpense = this.projectExpenseRepository.create({
          ...expense,
          proyectoId: savedProject.id,
        });
        return projectExpense;
      });

      await this.projectExpenseRepository.save(projectExpenses);
    }

    // Retornar el proyecto con los gastos incluidos
    return this.findOne(savedProject.id);
  }
  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      relations: ['expenses'],
      order: { created_at: 'DESC' },
    });
  }
  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    return this.projectRepository.find({
      where: { estado: status },
      relations: ['expenses'],
      order: { created_at: 'DESC' },
    });
  }
  async findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Project[]> {
    return this.projectRepository.find({
      where: {
        fecha: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['expenses'],
      order: { fecha: 'DESC' },
    });
  }
  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['expenses'],
    });

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    return project;
  }
  async update(
    id: number,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id);

    // Extraer los gastos del DTO de actualización antes de la validación
    const { expenses, ...projectData } = updateProjectDto;

    // Solo validar el abono si se están actualizando costoServicio o abono
    if (
      updateProjectDto.costoServicio !== undefined ||
      updateProjectDto.abono !== undefined
    ) {
      const newCostoServicio =
        updateProjectDto.costoServicio ?? project.costoServicio;
      const newAbono = updateProjectDto.abono ?? project.abono;

      if (newAbono > newCostoServicio) {
        throw new BadRequestException(
          'El abono no puede ser mayor al costo del servicio',
        );
      }
    }

    // Actualizar los datos del proyecto solo si hay datos para actualizar
    if (Object.keys(projectData).length > 0) {
      Object.assign(project, projectData);
      await this.projectRepository.save(project);
    }

    // Si se proporcionan gastos, actualizar los gastos del proyecto
    if (expenses !== undefined) {
      // Eliminar todos los gastos existentes del proyecto
      await this.projectExpenseRepository.delete({ proyectoId: id });

      // Si hay nuevos gastos, crearlos
      if (expenses && expenses.length > 0) {
        const projectExpenses = expenses.map(expense => {
          const projectExpense = this.projectExpenseRepository.create({
            ...expense,
            proyectoId: id,
          });
          return projectExpense;
        });

        await this.projectExpenseRepository.save(projectExpenses);
      }
    }

    // Retornar el proyecto actualizado con los gastos incluidos
    return this.findOne(id);
  }

  // Métodos para manejar gastos de proyecto individualmente
  async addExpenseToProject(
    projectId: number,
    expenseData: CreateProjectExpenseDto,
  ): Promise<ProjectExpense> {
    // Verificar que el proyecto existe
    await this.findOne(projectId);

    const expense = this.projectExpenseRepository.create({
      ...expenseData,
      proyectoId: projectId,
    });

    return this.projectExpenseRepository.save(expense);
  }

  async updateProjectExpense(
    projectId: number,
    expenseId: number,
    updateData: UpdateProjectExpenseDto,
  ): Promise<ProjectExpense> {
    // Verificar que el proyecto existe
    await this.findOne(projectId);

    // Verificar que el gasto existe y pertenece al proyecto
    const expense = await this.projectExpenseRepository.findOne({
      where: { id: expenseId, proyectoId: projectId },
    });

    if (!expense) {
      throw new NotFoundException(
        `Expense with ID ${expenseId} not found for project ${projectId}`,
      );
    }

    Object.assign(expense, updateData);
    return this.projectExpenseRepository.save(expense);
  }

  async deleteProjectExpense(
    projectId: number,
    expenseId: number,
  ): Promise<void> {
    // Verificar que el proyecto existe
    await this.findOne(projectId);

    const result = await this.projectExpenseRepository.delete({
      id: expenseId,
      proyectoId: projectId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Expense with ID ${expenseId} not found for project ${projectId}`,
      );
    }
  }

  async getProjectExpenses(projectId: number): Promise<ProjectExpense[]> {
    // Verificar que el proyecto existe
    await this.findOne(projectId);

    return this.projectExpenseRepository.find({
      where: { proyectoId: projectId },
    });
  }

  async addPayment(id: number, paymentDto: PaymentDto): Promise<Project> {
    const project = await this.findOne(id);

    // Asegurar que los valores son números y convertir explícitamente
    const currentAbono = Number(project.abono) || 0;
    const newPayment = Number(paymentDto.monto) || 0;
    const newAbono = currentAbono + newPayment;

    console.log('Payment Debug:', {
      projectId: id,
      currentAbono: currentAbono,
      newPayment: newPayment,
      newAbono: newAbono,
      costoServicio: Number(project.costoServicio),
    });

    if (newAbono > Number(project.costoServicio)) {
      throw new BadRequestException(
        'El abono total no puede ser mayor al costo del servicio',
      );
    }

    // Asegurar que se asigne como número
    project.abono = newAbono;

    if (paymentDto.metodoDePago) {
      project.metodoDePago = paymentDto.metodoDePago;
    } // Si el proyecto está completamente pagado, cambiar estado
    if (newAbono >= Number(project.costoServicio)) {
      project.estado = ProjectStatus.COMPLETADO;
    }

    return this.projectRepository.save(project);
  }

  async remove(id: number): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }

  async getProjectSummary(): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalIncome: number;
    totalPending: number;
  }> {
    const [totalCount, activeCount, completedCount] = await Promise.all([
      this.projectRepository.count(),
      this.projectRepository.count({ where: { estado: ProjectStatus.ACTIVO } }),
      this.projectRepository.count({
        where: { estado: ProjectStatus.COMPLETADO },
      }),
    ]);

    const projects = await this.projectRepository.find();

    const totalIncome = projects.reduce(
      (sum, project) => sum + Number(project.abono),
      0,
    );
    const totalPending = projects.reduce(
      (sum, project) =>
        sum + (Number(project.costoServicio) - Number(project.abono)),
      0,
    );

    return {
      totalProjects: totalCount,
      activeProjects: activeCount,
      completedProjects: completedCount,
      totalIncome,
      totalPending,
    };
  }

  async findAllWithFilters(
    filters: ProjectFilters,
    pagination: PaginationParams,
  ): Promise<{ data: Project[]; total: number; page: number; limit: number }> {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    // Construir las condiciones de filtrado
    const whereConditions: any = {};

    if (filters.status) {
      whereConditions.estado = filters.status;
    }

    if (filters.solicitante) {
      whereConditions.solicitante = Like(`%${filters.solicitante}%`);
    }

    if (filters.nombreProyecto) {
      whereConditions.nombreProyecto = Like(`%${filters.nombreProyecto}%`);
    }

    if (filters.obrero) {
      whereConditions.obrero = Like(`%${filters.obrero}%`);
    }

    if (filters.metodoDePago) {
      whereConditions.metodoDePago = filters.metodoDePago;
    }

    // Filtro de fechas
    if (filters.startDate && filters.endDate) {
      whereConditions.fecha = Between(
        new Date(filters.startDate),
        new Date(filters.endDate),
      );
    }

    // Construir objeto de ordenamiento
    const order: FindOptionsOrder<Project> = {};
    order[sortBy] = sortOrder; // Obtener datos y total
    const [data, total] = await this.projectRepository.findAndCount({
      where: whereConditions,
      relations: ['expenses'],
      order,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
