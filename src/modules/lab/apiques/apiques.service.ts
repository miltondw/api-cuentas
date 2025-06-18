import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Apique } from './entities/apique.entity';
import { Layer } from './entities/layer.entity';
import { Project } from '@/modules/projects/entities/project.entity';
import { CreateApiqueDto, UpdateApiqueDto } from './dto/apique.dto';

// Definir interfaces para filtros y paginación
interface ApiqueFilters {
  apiqueNumber?: number;
  startDepth?: number;
  endDepth?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

@Injectable()
export class ApiquesService {
  constructor(
    @InjectRepository(Apique)
    private apiqueRepository: Repository<Apique>,
    @InjectRepository(Layer)
    private layerRepository: Repository<Layer>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private dataSource: DataSource,
  ) {}

  async create(createApiqueDto: CreateApiqueDto): Promise<Apique> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate project exists (this would be done by foreign key constraint)      // Create apique
      const apiqueData = {
        proyectoId: createApiqueDto.proyecto_id,
        apique: createApiqueDto.apique,
        location: createApiqueDto.location,
        depth: createApiqueDto.depth,
        date: createApiqueDto.date ? new Date(createApiqueDto.date) : null,
        cbrUnaltered: createApiqueDto.cbr_unaltered,
        depthTomo: createApiqueDto.depth_tomo,
        molde: createApiqueDto.molde,
      };

      const apique = this.apiqueRepository.create(apiqueData);
      const savedApique = await queryRunner.manager.save(apique);

      // Create layers if provided
      if (createApiqueDto.layers && createApiqueDto.layers.length > 0) {
        const layers = createApiqueDto.layers.map(layerData =>
          this.layerRepository.create({
            ...layerData,
            apiqueId: savedApique.id,
          }),
        );

        await queryRunner.manager.save(layers);
      }

      await queryRunner.commitTransaction();

      // Return apique with layers
      return this.findOne(savedApique.proyectoId, savedApique.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async findAllByProject(projectId: number): Promise<Apique[]> {
    return this.apiqueRepository.find({
      where: { proyectoId: projectId },
      relations: ['layers'],
      order: {
        apique: 'ASC',
        layers: { layerNumber: 'ASC' },
      },
    });
  }
  async findOne(projectId: number, apiqueId: number): Promise<Apique> {
    const apique = await this.apiqueRepository.findOne({
      where: {
        proyectoId: projectId,
        id: apiqueId,
      },
      relations: ['layers'],
      order: {
        layers: { layerNumber: 'ASC' },
      },
    });

    if (!apique) {
      throw new NotFoundException(
        `Apique with ID ${apiqueId} not found in project ${projectId}`,
      );
    }

    return apique;
  }

  async update(
    projectId: number,
    apiqueId: number,
    updateApiqueDto: UpdateApiqueDto,
  ): Promise<Apique> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if apique exists
      const existingApique = await this.apiqueRepository.findOne({
        where: { proyectoId: projectId, id: apiqueId },
      });

      if (!existingApique) {
        throw new NotFoundException(
          `Apique with ID ${apiqueId} not found in project ${projectId}`,
        );
      } // Update apique data
      const updateData = {
        proyectoId: updateApiqueDto.proyecto_id || existingApique.proyectoId,
        apique: updateApiqueDto.apique,
        location: updateApiqueDto.location,
        depth: updateApiqueDto.depth,
        date: updateApiqueDto.date
          ? new Date(updateApiqueDto.date)
          : existingApique.date,
        cbrUnaltered: updateApiqueDto.cbr_unaltered,
        depthTomo: updateApiqueDto.depth_tomo,
        molde: updateApiqueDto.molde,
      };

      await queryRunner.manager.update(
        Apique,
        { proyectoId: projectId, id: apiqueId },
        updateData,
      ); // Extract layers from updateApiqueDto
      const layersToUpdate = updateApiqueDto.layers;

      // Handle layers update if provided
      if (layersToUpdate !== undefined) {
        // Delete existing layers
        await queryRunner.manager.delete(Layer, { apiqueId: apiqueId }); // Create new layers
        if (layersToUpdate.length > 0) {
          const newLayers = layersToUpdate.map(layerData =>
            this.layerRepository.create({
              ...layerData,
              apiqueId: apiqueId,
            }),
          );

          await queryRunner.manager.save(newLayers);
        }
      }

      await queryRunner.commitTransaction();

      // Return updated apique with layers
      return this.findOne(projectId, apiqueId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(projectId: number, apiqueId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if apique exists
      const existingApique = await this.apiqueRepository.findOne({
        where: { proyectoId: projectId, id: apiqueId },
      });

      if (!existingApique) {
        throw new NotFoundException(
          `Apique with ID ${apiqueId} not found in project ${projectId}`,
        );
      }

      // Delete layers first (cascade should handle this, but being explicit)
      await queryRunner.manager.delete(Layer, { apiqueId: apiqueId });

      // Delete apique
      await queryRunner.manager.delete(Apique, {
        proyectoId: projectId,
        id: apiqueId,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Utility methods
  async validateLayersData(layers: any[]): Promise<void> {
    if (!Array.isArray(layers)) {
      throw new BadRequestException('Layers must be an array');
    }

    layers.forEach((layer, index) => {
      if (!layer.layer_number || isNaN(parseInt(layer.layer_number))) {
        throw new BadRequestException(
          `Invalid layer number at position ${index}`,
        );
      }

      if (layer.thickness && isNaN(parseFloat(layer.thickness))) {
        throw new BadRequestException(
          `Invalid thickness in layer ${index + 1}`,
        );
      }
    });
  }

  async getApiqueStatistics(projectId: number) {
    const apiques = await this.findAllByProject(projectId);

    const totalApiques = apiques.length;
    const totalLayers = apiques.reduce(
      (sum, apique) => sum + apique.layers.length,
      0,
    );
    const averageDepth =
      apiques.filter(a => a.depth).length > 0
        ? apiques
            .filter(a => a.depth)
            .reduce((sum, a) => sum + Number(a.depth), 0) /
          apiques.filter(a => a.depth).length
        : 0;
    const cbrTests = apiques.filter(a => a.cbrUnaltered).length;

    return {
      totalApiques,
      totalLayers,
      averageDepth: Math.round(averageDepth * 100) / 100,
      cbrTests,
      apiquesWithDate: apiques.filter(a => a.date).length,
    };
  }

  async findAllByProjectWithFilters(
    projectId: number,
    filters: ApiqueFilters,
    pagination: PaginationParams,
  ): Promise<{ data: Apique[]; total: number; page: number; limit: number }> {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    // Crear el query builder para más flexibilidad
    let queryBuilder = this.apiqueRepository
      .createQueryBuilder('apique')
      .leftJoinAndSelect('apique.project', 'project')
      .leftJoinAndSelect('apique.layers', 'layers')
      .where('apique.proyectoId = :projectId', { projectId });

    // Aplicar filtros
    if (filters.apiqueNumber !== undefined) {
      queryBuilder = queryBuilder.andWhere('apique.apique = :apiqueNumber', {
        apiqueNumber: filters.apiqueNumber,
      });
    }

    if (filters.startDepth && filters.endDepth) {
      queryBuilder = queryBuilder.andWhere(
        'apique.depth BETWEEN :startDepth AND :endDepth',
        {
          startDepth: filters.startDepth,
          endDepth: filters.endDepth,
        },
      );
    } else if (filters.startDepth) {
      queryBuilder = queryBuilder.andWhere('apique.depth >= :startDepth', {
        startDepth: filters.startDepth,
      });
    } else if (filters.endDepth) {
      queryBuilder = queryBuilder.andWhere('apique.depth <= :endDepth', {
        endDepth: filters.endDepth,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder = queryBuilder.andWhere(
        'apique.date BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(filters.startDate),
          endDate: new Date(filters.endDate),
        },
      );
    }

    if (filters.location) {
      queryBuilder = queryBuilder.andWhere('apique.location LIKE :location', {
        location: `%${filters.location}%`,
      });
    }

    // Aplicar ordenamiento
    if (sortBy === 'apique' || sortBy === 'apiqueNumber') {
      queryBuilder = queryBuilder.orderBy('apique.apique', sortOrder);
    } else if (sortBy === 'depth') {
      queryBuilder = queryBuilder.orderBy('apique.depth', sortOrder);
    } else if (sortBy === 'date') {
      queryBuilder = queryBuilder.orderBy('apique.date', sortOrder);
    } else if (sortBy === 'location') {
      queryBuilder = queryBuilder.orderBy('apique.location', sortOrder);
    } else {
      queryBuilder = queryBuilder.orderBy(
        'apique.created_at',
        sortOrder as any,
      );
    }

    // Aplicar paginación
    queryBuilder = queryBuilder.skip(skip).take(limit);

    // Ejecutar consulta
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findAllProjectsWithApiques(): Promise<any[]> {
    const projects = await this.projectRepository.find({
      relations: ['apiques', 'apiques.layers'],
      order: {
        id: 'DESC',
        apiques: {
          apique: 'ASC',
          layers: { layerNumber: 'ASC' },
        },
      },
    });

    // Transform the data to include a summary for each project
    return projects.map(project => ({
      proyecto_id: project.id,
      nombre_proyecto: project.nombreProyecto,
      solicitante: project.solicitante,
      obrero: project.obrero,
      fecha: project.fecha,
      estado: project.estado,
      total_apiques: project.apiques.length,
      apiques: project.apiques.map(apique => ({
        apique_id: apique.id,
        apique: apique.apique,
        location: apique.location,
        depth: apique.depth,
        date: apique.date,
        cbr_unaltered: apique.cbrUnaltered,
        depth_tomo: apique.depthTomo,
        molde: apique.molde,
        total_layers: apique.layers.length,
        layers: apique.layers,
      })),
    }));
  }
}
