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

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ingresos_totales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  gastos_totales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  utilidad_bruta: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  utilidad_neta: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  margen_utilidad: number; // Percentage

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties for validation
  get calculatedUtilidad(): number {
    return Number(this.ingresos_totales) - Number(this.gastos_totales);
  }

  get calculatedMargen(): number {
    if (Number(this.ingresos_totales) === 0) return 0;
    return (Number(this.utilidad_neta) / Number(this.ingresos_totales)) * 100;
  }
}
