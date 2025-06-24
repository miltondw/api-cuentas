import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabProjectsController } from '@/modules/lab/lab-projects/lab-projects.controller';
import { LabProjectsService } from '@/modules/lab/lab-projects/lab-projects.service';
import { Project } from '@/modules/projects/entities/project.entity';
import { Apique } from '@/modules/lab/apiques/entities/apique.entity';
import { Profile } from '@/modules/lab/profiles/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Apique, Profile])],
  controllers: [LabProjectsController],
  providers: [LabProjectsService],
  exports: [LabProjectsService],
})
export class LabProjectsModule {}
