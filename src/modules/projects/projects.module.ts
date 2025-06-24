// Placeholder modules - These would be fully implemented based on your existing Express routes

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from '@/modules/projects/projects.service';
import { ProjectsController } from '@/modules/projects/projects.controller';
import { Project } from '@/modules/projects/entities/project.entity';
import { ProjectExpense } from '@/modules/projects/entities/project-expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectExpense])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
