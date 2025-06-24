import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Apique } from '@/modules/lab/apiques/entities/apique.entity';

@Entity('layers')
export class Layer {
  @PrimaryGeneratedColumn({ name: 'layer_id' })
  id: number;

  @Column({ name: 'apique_id', type: 'int' })
  apiqueId: number;

  @Column({ name: 'layer_number', type: 'int' })
  layerNumber: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  thickness: number;

  @Column({ name: 'sample_id', type: 'varchar', length: 50, nullable: true })
  sampleId: string;

  @Column({ type: 'text', nullable: true })
  observation: string;
  // Relationships
  @ManyToOne(() => Apique, apique => apique.layers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'apique_id' })
  apique: Apique;
}
