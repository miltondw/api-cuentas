import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Apique } from './entities/apique.entity';
import { Layer } from './entities/layer.entity';
import { CreateApiqueDto, UpdateApiqueDto } from './dto/apique.dto';

@Injectable()
export class ApiquesService {
  constructor(
    @InjectRepository(Apique)
    private apiqueRepository: Repository<Apique>,
    @InjectRepository(Layer)
    private layerRepository: Repository<Layer>,
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
      relations: ['layers'],      order: {
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
      relations: ['layers'],      order: {
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
      }      // Update apique data
      const updateData = {
        proyectoId: updateApiqueDto.proyecto_id || existingApique.proyectoId,
        apique: updateApiqueDto.apique,
        location: updateApiqueDto.location,
        depth: updateApiqueDto.depth,
        date: updateApiqueDto.date
          ? new Date(updateApiqueDto.date)
          : existingApique.date,        cbrUnaltered: updateApiqueDto.cbr_unaltered,
        depthTomo: updateApiqueDto.depth_tomo,
        molde: updateApiqueDto.molde,
      };

      await queryRunner.manager.update(
        Apique,
        { proyectoId: projectId, id: apiqueId },
        updateData,
      );      // Extract layers from updateApiqueDto
      const layersToUpdate = updateApiqueDto.layers;

      // Handle layers update if provided
      if (layersToUpdate !== undefined) {
        // Delete existing layers
        await queryRunner.manager.delete(Layer, { apiqueId: apiqueId });        // Create new layers
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
}
