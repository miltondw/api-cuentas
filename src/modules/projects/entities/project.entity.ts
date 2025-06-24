import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { ProjectExpense } from '@/modules/projects/entities/project-expense.entity';
import { Apique } from '@/modules/lab/apiques/entities/apique.entity';
import { Profile } from '@/modules/lab/profiles/entities/profile.entity';

export enum ProjectStatus {
  ACTIVO = 'activo',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

export enum PaymentMethod {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  CHEQUE = 'cheque',
}

@Entity('proyectos')
export class Project {
  @PrimaryGeneratedColumn({ name: 'proyecto_id' })
  id: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'varchar', length: 255 })
  solicitante: string;

  @Column({ name: 'nombre_proyecto', type: 'varchar', length: 255 })
  nombreProyecto: string;

  @Column({ type: 'varchar', length: 255 })
  obrero: string;

  @Column({ name: 'costo_servicio', type: 'decimal', precision: 15, scale: 2 })
  costoServicio: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  abono: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  factura?: string;

  @Column({
    name: 'valor_retencion',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  valorRetencion?: number;

  @Column({
    name: 'metodo_de_pago',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  metodoDePago?: string;

  // Campo estado para manejar el status del proyecto
  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVO,
  })
  estado: ProjectStatus;

  // Fecha de creación para ordenamiento
  @CreateDateColumn()
  created_at: Date;

  // Relations
  @OneToMany(() => Apique, apique => apique.project)
  apiques: Apique[];

  @OneToMany(() => Profile, profile => profile.project)
  profiles: Profile[];

  @OneToMany(() => ProjectExpense, expense => expense.project)
  expenses: ProjectExpense[];

  // Campos calculados
  get saldo(): number {
    return this.costoServicio - (this.abono || 0);
  }

  get porcentajePagado(): number {
    return this.costoServicio > 0
      ? ((this.abono || 0) / this.costoServicio) * 100
      : 0;
  }
}
