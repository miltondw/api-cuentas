import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('resumen_financiero')
export class FinancialSummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 7 })
  mes: string; // Format: YYYY-MM

  @Column({
    name: 'ingresos_totales',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  ingresosTotales: number;

  @Column({
    name: 'gastos_totales',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  gastosTotales: number;

  @Column({
    name: 'utilidad_bruta',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  utilidadBruta: number;

  @Column({
    name: 'utilidad_neta',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  utilidadNeta: number;

  @Column({
    name: 'margen_utilidad',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  margenUtilidad: number; // Percentage

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  // Computed properties for validation
  get calculatedUtilidad(): number {
    return Number(this.ingresosTotales) - Number(this.gastosTotales);
  }

  get calculatedMargen(): number {
    if (Number(this.ingresosTotales) === 0) return 0;
    return (Number(this.utilidadNeta) / Number(this.ingresosTotales)) * 100;
  }
}
