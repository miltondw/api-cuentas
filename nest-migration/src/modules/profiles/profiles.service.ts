import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { Blow } from './entities/blow.entity';
import {
  CreateProfileDto,
  UpdateProfileDto,
  CreateBlowDto,
  UpdateBlowDto,
} from './dto/profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Blow)
    private blowRepository: Repository<Blow>,
  ) {}

  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    const { blows, ...profileData } = createProfileDto;

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

    // Create profile
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
      .orderBy('profile.createdAt', 'DESC')
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
      order: { createdAt: 'DESC', blows: { depth: 'ASC' } },
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
    const { blows, ...profileData } = updateProfileDto;

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
}
