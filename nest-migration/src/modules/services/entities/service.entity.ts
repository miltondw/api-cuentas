import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ServiceCategory } from './service-category.entity';
import { SelectedService } from '../../service-requests/entities/selected-service.entity';
import { ServiceAdditionalField } from './service-additional-field.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ServiceCategory, category => category.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: ServiceCategory;
  @OneToMany(() => SelectedService, selectedService => selectedService.service)
  selectedServices: SelectedService[];

  @OneToMany(() => ServiceAdditionalField, field => field.service, {
    cascade: true,
  })
  additionalFields: ServiceAdditionalField[];
}
