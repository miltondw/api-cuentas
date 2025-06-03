import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('gastos_empresa')
export class CompanyExpense {
  @PrimaryGeneratedColumn({ name: 'gasto_empresa_id' })
  id: number;

  @Column({ type: 'date', nullable: true })
  mes: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  salarios: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  luz: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  agua: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  arriendo: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  internet: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0.00 })
  salud: number;

  @Column({ name: 'otros_campos', type: 'json', nullable: true })
  otrosCampos: any;
  // Computed property for total expenses
  get totalExpenses(): number {
    return (
      Number(this.salarios || 0) +
      Number(this.luz || 0) +
      Number(this.agua || 0) +
      Number(this.arriendo || 0) +
      Number(this.internet || 0) +
      Number(this.salud || 0)
    );
  }
}
