import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabProjectsController } from './lab-projects.controller';
import { LabProjectsService } from './lab-projects.service';
import { Project } from '../../projects/entities/project.entity';
import { Apique } from '../apiques/entities/apique.entity';
import { Profile } from '../profiles/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Apique, Profile])],
  controllers: [LabProjectsController],
  providers: [LabProjectsService],
  exports: [LabProjectsService],
})
export class LabProjectsModule {}
