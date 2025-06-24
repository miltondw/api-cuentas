import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '@/modules/lab/profiles/entities/profile.entity';
import { Blow } from '@/modules/lab/profiles/entities/blow.entity';
import {
  CreateProfileDto,
  UpdateProfileDto,
  CreateBlowDto,
  UpdateBlowDto,
} from './dto/profile.dto';

// Definir interfaces para filtros y paginación
interface ProfileFilters {
  projectId?: number;
  soundingNumber?: number;
  startDepth?: number;
  endDepth?: number;
  startDate?: string;
  endDate?: string;
  hasSPT?: boolean;
}

interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Blow)
    private blowRepository: Repository<Blow>,
  ) {}
  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    const { blows } = createProfileDto;

    // Check if sounding number already exists for the project
    const existingProfile = await this.profileRepository.findOne({
      where: {
        projectId: createProfileDto.projectId,
        soundingNumber: createProfileDto.soundingNumber,
      },
    });

    if (existingProfile) {
      throw new ConflictException(
        `El número de sondeo ${createProfileDto.soundingNumber} ya existe para este proyecto`,
      );
    }

    // Create profile with proper data mapping
    const profileData = {
      projectId: createProfileDto.projectId,
      soundingNumber: createProfileDto.soundingNumber,
      waterLevel: createProfileDto.waterLevel?.toString(), // Convert to string
      profileDate: createProfileDto.profileDate
        ? new Date(createProfileDto.profileDate)
        : null,
      samplesNumber: createProfileDto.samplesNumber,
      location: createProfileDto.location,
      description: createProfileDto.description,
      latitude: createProfileDto.latitude,
      longitude: createProfileDto.longitude,
      depth: createProfileDto.depth,
      observations: createProfileDto.observations,
      profileData: createProfileDto.profileData,
    };

    const profile = this.profileRepository.create(profileData);
    const savedProfile = await this.profileRepository.save(profile);

    // Create blows if provided
    if (blows && blows.length > 0) {
      const blowEntities = blows.map(blow =>
        this.blowRepository.create({
          ...blow,
          profileId: savedProfile.id,
        }),
      );
      await this.blowRepository.save(blowEntities);
    }

    return this.findOne(savedProfile.id);
  }

  async findAll(projectId?: number): Promise<Profile[]> {
    const queryBuilder = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.project', 'project')
      .leftJoinAndSelect('profile.blows', 'blows')
      .orderBy('profile.created_at', 'DESC')
      .addOrderBy('blows.depth', 'ASC');

    if (projectId) {
      queryBuilder.where('profile.projectId = :projectId', { projectId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['project', 'blows'],
    });

    if (!profile) {
      throw new NotFoundException(`Perfil con ID ${id} no encontrado`);
    }

    return profile;
  }

  async findByProject(projectId: number): Promise<Profile[]> {
    return this.profileRepository.find({
      where: { projectId },
      relations: ['project', 'blows'],
      order: { created_at: 'DESC', blows: { depth: 'ASC' } },
    });
  }

  async findBySounding(
    projectId: number,
    soundingNumber: string,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { projectId, soundingNumber },
      relations: ['project', 'blows'],
    });

    if (!profile) {
      throw new NotFoundException(
        `Perfil con número de sondeo ${soundingNumber} no encontrado en el proyecto ${projectId}`,
      );
    }

    return profile;
  }
  async update(
    id: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const { blows, ...updateData } = updateProfileDto;

    const profile = await this.findOne(id);

    // Check if sounding number conflict exists
    if (
      updateProfileDto.soundingNumber &&
      updateProfileDto.soundingNumber !== profile.soundingNumber
    ) {
      const existingProfile = await this.profileRepository.findOne({
        where: {
          projectId: profile.projectId,
          soundingNumber: updateProfileDto.soundingNumber,
        },
      });

      if (existingProfile && existingProfile.id !== id) {
        throw new ConflictException(
          `El número de sondeo ${updateProfileDto.soundingNumber} ya existe para este proyecto`,
        );
      }
    }

    // Prepare update data with proper type conversions
    const profileData = {
      ...updateData,
      waterLevel: updateData.waterLevel?.toString(), // Convert to string
      profileDate: updateData.profileDate
        ? new Date(updateData.profileDate)
        : profile.profileDate,
    };

    // Update profile
    await this.profileRepository.update(id, profileData);

    // Update blows if provided
    if (blows) {
      // Delete existing blows
      await this.blowRepository.delete({ profileId: id });

      // Create new blows
      if (blows.length > 0) {
        const blowEntities = blows.map(blow =>
          this.blowRepository.create({
            ...blow,
            profileId: id,
          }),
        );
        await this.blowRepository.save(blowEntities);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const profile = await this.findOne(id);
    await this.profileRepository.remove(profile);
  }
  // Blow-specific methods
  async addBlow(profileId: number, blowData: CreateBlowDto): Promise<Blow> {
    const profile = await this.findOne(profileId);

    const blow = this.blowRepository.create({
      ...blowData,
      profileId: profile.id,
    });

    return this.blowRepository.save(blow);
  }

  async updateBlow(blowId: number, blowData: UpdateBlowDto): Promise<Blow> {
    const blow = await this.blowRepository.findOne({
      where: { id: blowId },
      relations: ['profile'],
    });

    if (!blow) {
      throw new NotFoundException(`Golpeo con ID ${blowId} no encontrado`);
    }
    await this.blowRepository.update(blowId, blowData);

    const updatedBlow = await this.blowRepository.findOne({
      where: { id: blowId },
      relations: ['profile'],
    });

    if (!updatedBlow) {
      throw new NotFoundException(
        `Golpeo con ID ${blowId} no encontrado después de la actualización`,
      );
    }

    return updatedBlow;
  }

  async removeBlow(blowId: number): Promise<void> {
    const blow = await this.blowRepository.findOne({
      where: { id: blowId },
    });

    if (!blow) {
      throw new NotFoundException(`Golpeo con ID ${blowId} no encontrado`);
    }

    await this.blowRepository.remove(blow);
  }

  async getBlowsByProfile(profileId: number): Promise<Blow[]> {
    await this.findOne(profileId); // Verify profile exists

    return this.blowRepository.find({
      where: { profileId },
      order: { depth: 'ASC' },
    });
  }

  async findAllWithFilters(
    filters: ProfileFilters,
    pagination: PaginationParams,
  ): Promise<{ data: Profile[]; total: number; page: number; limit: number }> {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    // Crear el query builder para más flexibilidad
    let queryBuilder = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.project', 'project')
      .leftJoinAndSelect('profile.blows', 'blows');

    // Aplicar filtros
    if (filters.projectId) {
      queryBuilder = queryBuilder.andWhere('profile.projectId = :projectId', {
        projectId: filters.projectId,
      });
    }

    if (filters.soundingNumber) {
      queryBuilder = queryBuilder.andWhere(
        'profile.soundingNumber = :soundingNumber',
        { soundingNumber: filters.soundingNumber },
      );
    }

    if (filters.startDepth && filters.endDepth) {
      queryBuilder = queryBuilder.andWhere('profile.depth BETWEEN :startDepth AND :endDepth', {
        startDepth: filters.startDepth,
        endDepth: filters.endDepth,
      });
    } else if (filters.startDepth) {
      queryBuilder = queryBuilder.andWhere('profile.depth >= :startDepth', {
        startDepth: filters.startDepth,
      });
    } else if (filters.endDepth) {
      queryBuilder = queryBuilder.andWhere('profile.depth <= :endDepth', {
        endDepth: filters.endDepth,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder = queryBuilder.andWhere(
        'profile.profileDate BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(filters.startDate),
          endDate: new Date(filters.endDate),
        },
      );
    }

    if (filters.hasSPT !== undefined) {
      if (filters.hasSPT) {
        // Si hasSPT es true, buscar perfiles que tengan al menos un golpe registrado
        queryBuilder = queryBuilder.andWhere('EXISTS (SELECT 1 FROM blow WHERE blow.profileId = profile.id)');
      } else {
        // Si hasSPT es false, buscar perfiles que no tengan golpes registrados
        queryBuilder = queryBuilder.andWhere('NOT EXISTS (SELECT 1 FROM blow WHERE blow.profileId = profile.id)');
      }
    }

    // Aplicar ordenamiento
    if (sortBy === 'depth' || sortBy === 'soundingNumber' || sortBy === 'profileDate') {
      queryBuilder = queryBuilder.orderBy(`profile.${sortBy}`, sortOrder);
    } else {
      queryBuilder = queryBuilder.orderBy('profile.created_at', sortOrder as any);
    }

    // Aplicar paginación
    queryBuilder = queryBuilder
      .skip(skip)
      .take(limit);

    // Ejecutar consulta
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
