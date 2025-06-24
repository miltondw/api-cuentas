import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Project,
  ProjectStatus as ProjectEntityStatus,
} from '../../projects/entities/project.entity';
import { Apique } from '@/modules/lab/apiques/entities/apique.entity';
import { Profile } from '@/modules/lab/profiles/entities/profile.entity';
import {
  LabProjectsQueryDto,
  LabProjectsResponseDto,
  LabProjectDto,
  ProjectStatus,
  LabProjectSortBy,
} from './dto/lab-projects.dto';

@Injectable()
export class LabProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Apique)
    private apiqueRepository: Repository<Apique>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async getLabProjects(
    query: LabProjectsQueryDto,
  ): Promise<LabProjectsResponseDto> {
    const {
      page = 1,
      limit = 10,
      sortBy = LabProjectSortBy.FECHA,
      sortOrder = 'DESC',
      nombreProyecto,
      solicitante,
      obrero,
      estado,
      startDate,
      endDate,
      hasApiques,
      hasProfiles,
      minApiques,
      maxApiques,
      minProfiles,
      maxProfiles,
      search,
    } = query;

    // Crear query builder principal
    const queryBuilder = this.createBaseQuery();

    // Aplicar filtros
    this.applyFilters(queryBuilder, {
      nombreProyecto,
      solicitante,
      obrero,
      estado,
      startDate,
      endDate,
      hasApiques,
      hasProfiles,
      minApiques,
      maxApiques,
      minProfiles,
      maxProfiles,
      search,
    });

    // Aplicar ordenamiento
    this.applySorting(queryBuilder, sortBy, sortOrder);

    // Obtener total antes de paginación
    const total = await queryBuilder.getCount(); // Aplicar paginación
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Ejecutar query con getRawMany() para obtener los campos calculados
    const rawResults = await queryBuilder.getRawMany();

    // Transformar datos
    const data = rawResults.map(raw => this.transformRawToLabProjectDto(raw));

    // Calcular estadísticas de resumen
    const summary = await this.calculateSummary();

    // Calcular total de páginas
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      summary,
    };
  }
  private createBaseQuery(): SelectQueryBuilder<Project> {
    return this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.apiques', 'apiques')
      .leftJoin('project.profiles', 'profiles')
      .select([
        'project.id as project_id',
        'project.fecha as project_fecha',
        'project.solicitante as project_solicitante',
        'project.nombreProyecto as project_nombre_proyecto',
        'project.obrero as project_obrero',
        'project.estado as project_estado',
        'project.created_at as project_created_at',
        'COUNT(DISTINCT apiques.id) as apiques_count',
        'COUNT(DISTINCT profiles.id) as profiles_count',
      ])
      .groupBy('project.id');
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Project>,
    filters: {
      nombreProyecto?: string;
      solicitante?: string;
      obrero?: string;
      estado?: ProjectStatus;
      startDate?: string;
      endDate?: string;
      hasApiques?: boolean;
      hasProfiles?: boolean;
      minApiques?: number;
      maxApiques?: number;
      minProfiles?: number;
      maxProfiles?: number;
      search?: string;
    },
  ): void {
    const {
      nombreProyecto,
      solicitante,
      obrero,
      estado,
      startDate,
      endDate,
      hasApiques,
      hasProfiles,
      minApiques,
      maxApiques,
      minProfiles,
      maxProfiles,
      search,
    } = filters;

    // Filtro de búsqueda global
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(project.nombreProyecto) LIKE LOWER(:search) OR LOWER(project.solicitante) LIKE LOWER(:search) OR LOWER(project.obrero) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    } // Filtros específicos
    if (nombreProyecto) {
      console.log(`🔍 Aplicando filtro nombreProyecto: "${nombreProyecto}"`);
      queryBuilder.andWhere(
        'LOWER(project.nombreProyecto) LIKE LOWER(:nombreProyecto)',
        {
          nombreProyecto: `%${nombreProyecto}%`,
        },
      );
    }

    if (solicitante) {
      console.log(`🔍 Aplicando filtro solicitante: "${solicitante}"`);
      queryBuilder.andWhere(
        'LOWER(project.solicitante) LIKE LOWER(:solicitante)',
        {
          solicitante: `%${solicitante}%`,
        },
      );
    }

    if (obrero) {
      queryBuilder.andWhere('LOWER(project.obrero) LIKE LOWER(:obrero)', {
        obrero: `%${obrero}%`,
      });
    }

    if (estado) {
      queryBuilder.andWhere('project.estado = :estado', { estado });
    }

    // Filtros de fecha
    if (startDate) {
      queryBuilder.andWhere('project.fecha >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('project.fecha <= :endDate', { endDate });
    } // Filtros de conteo (aplicados después del GROUP BY usando HAVING)
    if (hasApiques !== undefined) {
      if (hasApiques) {
        queryBuilder.having('COUNT(DISTINCT apiques.id) > 0');
      } else {
        queryBuilder.having('COUNT(DISTINCT apiques.id) = 0');
      }
    }

    if (hasProfiles !== undefined) {
      if (hasProfiles) {
        queryBuilder.andHaving('COUNT(DISTINCT profiles.id) > 0');
      } else {
        queryBuilder.andHaving('COUNT(DISTINCT profiles.id) = 0');
      }
    }

    if (minApiques !== undefined) {
      queryBuilder.andHaving('COUNT(DISTINCT apiques.id) >= :minApiques', {
        minApiques,
      });
    }

    if (maxApiques !== undefined) {
      queryBuilder.andHaving('COUNT(DISTINCT apiques.id) <= :maxApiques', {
        maxApiques,
      });
    }

    if (minProfiles !== undefined) {
      queryBuilder.andHaving('COUNT(DISTINCT profiles.id) >= :minProfiles', {
        minProfiles,
      });
    }

    if (maxProfiles !== undefined) {
      queryBuilder.andHaving('COUNT(DISTINCT profiles.id) <= :maxProfiles', {
        maxProfiles,
      });
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Project>,
    sortBy: LabProjectSortBy,
    sortOrder: string,
  ): void {
    switch (sortBy) {
      case LabProjectSortBy.ID:
        queryBuilder.orderBy('project.id', sortOrder as 'ASC' | 'DESC');
        break;
      case LabProjectSortBy.FECHA:
        queryBuilder.orderBy('project.fecha', sortOrder as 'ASC' | 'DESC');
        break;
      case LabProjectSortBy.NOMBRE_PROYECTO:
        queryBuilder.orderBy(
          'project.nombreProyecto',
          sortOrder as 'ASC' | 'DESC',
        );
        break;
      case LabProjectSortBy.SOLICITANTE:
        queryBuilder.orderBy(
          'project.solicitante',
          sortOrder as 'ASC' | 'DESC',
        );
        break;
      case LabProjectSortBy.ESTADO:
        queryBuilder.orderBy('project.estado', sortOrder as 'ASC' | 'DESC');
        break;
      case LabProjectSortBy.TOTAL_APIQUES:
        queryBuilder.orderBy('apiques_count', sortOrder as 'ASC' | 'DESC');
        break;
      case LabProjectSortBy.TOTAL_PROFILES:
        queryBuilder.orderBy('profiles_count', sortOrder as 'ASC' | 'DESC');
        break;
      default:
        queryBuilder.orderBy('project.fecha', 'DESC');
    }
  }
  private transformToLabProjectDto(project: any): LabProjectDto {
    return {
      proyecto_id: project.id,
      nombre_proyecto: project.nombreProyecto,
      solicitante: project.solicitante,
      obrero: project.obrero,
      fecha: project.fecha,
      estado: project.estado,
      total_apiques: parseInt(project.apiques_count) || 0,
      total_profiles: parseInt(project.profiles_count) || 0,
      created_at: project.created_at,
    };
  }
  private transformRawToLabProjectDto(raw: any): LabProjectDto {
    return {
      proyecto_id: raw.project_id,
      nombre_proyecto: raw.project_nombre_proyecto,
      solicitante: raw.project_solicitante,
      obrero: raw.project_obrero,
      fecha: raw.project_fecha,
      estado: raw.project_estado,
      total_apiques: parseInt(raw.apiques_count) || 0,
      total_profiles: parseInt(raw.profiles_count) || 0,
      created_at: raw.project_created_at,
    };
  }

  private async calculateSummary() {
    // Estadísticas generales de proyectos
    const totalProjects = await this.projectRepository.count();
    const activeProjects = await this.projectRepository.count({
      where: { estado: ProjectEntityStatus.ACTIVO },
    });
    const completedProjects = await this.projectRepository.count({
      where: { estado: ProjectEntityStatus.COMPLETADO },
    });

    // Estadísticas de apiques y perfiles
    const totalApiques = await this.apiqueRepository.count();
    const totalProfiles = await this.profileRepository.count(); // Proyectos con apiques y perfiles
    const projectsWithApiques = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.apiques', 'apiques')
      .select('COUNT(DISTINCT project.id)', 'count')
      .where('apiques.id IS NOT NULL')
      .getRawOne();

    const projectsWithProfiles = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.profiles', 'profiles')
      .select('COUNT(DISTINCT project.id)', 'count')
      .where('profiles.id IS NOT NULL')
      .getRawOne();

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalApiques,
      totalProfiles,
      projectsWithApiques: parseInt(projectsWithApiques?.count) || 0,
      projectsWithProfiles: parseInt(projectsWithProfiles?.count) || 0,
    };
  }
}
