import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiquesController } from './apiques.controller';
import { ApiquesService } from './apiques.service';
import { Apique } from './entities/apique.entity';
import { Layer } from './entities/layer.entity';
import { Project } from '@/modules/projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Apique, Layer, Project])],
  controllers: [ApiquesController],
  providers: [ApiquesService],
  exports: [ApiquesService],
})
export class ApiquesModule {}
