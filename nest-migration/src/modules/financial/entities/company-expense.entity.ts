import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('gastos_empresa')
export class CompanyExpense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 7 })
  mes: string; // Format: YYYY-MM

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salarios: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  luz: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  agua: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  arriendo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  internet: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salud: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  otros_campos: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed property for total expenses
  get totalExpenses(): number {
    return (
      Number(this.salarios) +
      Number(this.luz) +
      Number(this.agua) +
      Number(this.arriendo) +
      Number(this.internet) +
      Number(this.salud) +
      Number(this.otros_campos)
    );
  }
}
