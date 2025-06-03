import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SelectedService } from '../../service-requests/entities/selected-service.entity';
import { ServiceAdditionalField } from './service-additional-field.entity';

@Entity('service_additional_values')
export class ServiceAdditionalValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'selected_service_id' })
  selectedServiceId: number;

  @Column({ name: 'field_name', type: 'varchar', length: 100 })
  fieldName: string;

  @Column({ name: 'field_value', type: 'text' })
  fieldValue: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Relations
  @ManyToOne(() => SelectedService, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'selected_service_id' })
  selectedService: SelectedService;

  @ManyToOne(() => ServiceAdditionalField, field => field.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'field_name', referencedColumnName: 'fieldName' })
  field: ServiceAdditionalField;
}
