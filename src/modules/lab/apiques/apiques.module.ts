import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiquesController } from '@/modules/lab/apiques/apiques.controller';
import { ApiquesService } from '@/modules/lab/apiques/apiques.service';
import { Apique } from '@/modules/lab/apiques/entities/apique.entity';
import { Layer } from '@/modules/lab/apiques/entities/layer.entity';
import { Project } from '@/modules/projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Apique, Layer, Project])],
  controllers: [ApiquesController],
  providers: [ApiquesService],
  exports: [ApiquesService],
})
export class ApiquesModule {}
