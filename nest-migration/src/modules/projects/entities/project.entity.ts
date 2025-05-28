import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Apique } from '../../apiques/entities/apique.entity';

export enum ProjectStatus {
  ACTIVO = 'activo',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

export enum PaymentMethod {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  CHEQUE = 'cheque',
  TARJETA = 'tarjeta',
}

@Entity('proyectos')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'varchar', length: 255 })
  solicitante: string;

  @Column({ name: 'nombre_proyecto', type: 'varchar', length: 255 })
  nombreProyecto: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', length: 255 })
  obrero: string;

  @Column({ name: 'costo_servicio', type: 'decimal', precision: 10, scale: 2 })
  costoServicio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  abono: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  factura?: string;

  @Column({
    name: 'valor_retencion',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  valorRetencion?: number;

  @Column({
    name: 'metodo_de_pago',
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  metodoDePago?: PaymentMethod;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVO,
  })
  estado: ProjectStatus;

  @Column({ type: 'text', nullable: true })
  otros_campos?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Apique, apique => apique.project)
  apiques: Apique[];

  // Campos calculados
  get saldo(): number {
    return this.costoServicio - this.abono;
  }

  get porcentajePagado(): number {
    return this.costoServicio > 0 ? (this.abono / this.costoServicio) * 100 : 0;
  }
}
