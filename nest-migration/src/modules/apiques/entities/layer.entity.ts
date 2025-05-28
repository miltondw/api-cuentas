import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Apique } from './apique.entity';

@Entity('layers')
export class Layer {
  @PrimaryGeneratedColumn()
  layer_id: number;

  @Column({ type: 'int' })
  apique_id: number;

  @Column({ type: 'int' })
  layer_number: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  thickness: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sample_id: string;

  @Column({ type: 'text', nullable: true })
  observation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Apique, apique => apique.layers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'apique_id' })
  apique: Apique;
}
