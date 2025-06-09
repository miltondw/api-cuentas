import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { Layer } from './layer.entity';
import { Project } from '@/modules/projects/entities/project.entity';

@Entity('apiques')
export class Apique {
  @PrimaryGeneratedColumn({ name: 'apique_id' })
  id: number;

  @Column({ type: 'int', nullable: true })
  apique: number;

  @Column({ name: 'proyecto_id', type: 'int' })
  proyectoId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  depth: number;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @Column({
    name: 'cbr_unaltered',
    type: 'tinyint',
    default: 0,
    nullable: true,
  })
  cbrUnaltered: boolean;

  @Column({
    name: 'depth_tomo',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  depthTomo: number;

  @Column({ type: 'int', nullable: true })
  molde: number;
  // Relationships
  @ManyToOne(() => Project, project => project.apiques)
  @JoinColumn({ name: 'proyecto_id' })
  project: Project;

  @OneToMany(() => Layer, layer => layer.apique, { cascade: true })
  layers: Layer[];
}
