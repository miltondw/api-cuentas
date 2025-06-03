import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import {
  CreateProjectDto,
  UpdateProjectDto,
  PaymentDto,
} from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Validar que el abono no sea mayor al costo del servicio
    if (createProjectDto.abono > createProjectDto.costoServicio) {
      throw new BadRequestException(
        'El abono no puede ser mayor al costo del servicio',
      );
    }

    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    return this.projectRepository.find({
      where: { estado: status },
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
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
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

    // Validar que el abono no sea mayor al costo del servicio
    const newCostoServicio =
      updateProjectDto.costoServicio ?? project.costoServicio;
    const newAbono = updateProjectDto.abono ?? project.abono;

    if (newAbono > newCostoServicio) {
      throw new BadRequestException(
        'El abono no puede ser mayor al costo del servicio',
      );
    }

    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async addPayment(id: number, paymentDto: PaymentDto): Promise<Project> {
    const project = await this.findOne(id);

    const newAbono = project.abono + paymentDto.monto;

    if (newAbono > project.costoServicio) {
      throw new BadRequestException(
        'El abono total no puede ser mayor al costo del servicio',
      );
    }

    project.abono = newAbono;

    if (paymentDto.metodoDePago) {
      project.metodoDePago = paymentDto.metodoDePago;
    }

    // Si el proyecto está completamente pagado, cambiar estado
    if (newAbono === project.costoServicio) {
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
}
