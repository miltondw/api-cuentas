import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '@/modules/projects/entities/project.entity';

@Entity('gastos_proyectos')
export class ProjectExpense {
  @PrimaryGeneratedColumn({ name: 'gasto_proyecto_id' })
  id: number;

  @Column({ name: 'proyecto_id', nullable: true })
  proyectoId?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  camioneta?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  campo?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  obreros?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  comidas?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  otros?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  peajes?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  combustible?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  hospedaje?: number;

  @Column({ name: 'otros_campos', type: 'json', nullable: true })
  otrosCampos?: any;

  // Relations
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  project?: Project;

  // Calculated fields
  get totalGastos(): number {
    return (
      (this.camioneta || 0) +
      (this.campo || 0) +
      (this.obreros || 0) +
      (this.comidas || 0) +
      (this.otros || 0) +
      (this.peajes || 0) +
      (this.combustible || 0) +
      (this.hospedaje || 0)
    );
  }
}
