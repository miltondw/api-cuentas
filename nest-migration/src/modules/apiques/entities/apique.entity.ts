import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Layer } from './layer.entity';

@Entity('apiques')
export class Apique {
  @PrimaryGeneratedColumn()
  apique_id: number;

  @Column({ type: 'int' })
  proyecto_id: number;

  @Column({ type: 'int', nullable: true })
  apique: number;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  depth: number;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @Column({ type: 'boolean', default: false })
  cbr_unaltered: boolean;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  depth_tomo: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  molde: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Project, project => project.apiques)
  @JoinColumn({ name: 'proyecto_id' })
  project: Project;

  @OneToMany(() => Layer, layer => layer.apique, { cascade: true })
  layers: Layer[];
}
