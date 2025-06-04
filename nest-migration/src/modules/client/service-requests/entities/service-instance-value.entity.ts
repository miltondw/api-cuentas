import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceInstance } from './service-instance.entity';

@Entity('service_instance_values')
export class ServiceInstanceValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'service_instance_id' })
  serviceInstanceId: number;

  @Column({ name: 'field_name', type: 'varchar', length: 255 })
  fieldName: string;

  @Column({ name: 'field_value', type: 'text' })
  fieldValue: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(
    () => ServiceInstance,
    serviceInstance => serviceInstance.serviceInstanceValues,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'service_instance_id' })
  serviceInstance: ServiceInstance;
}
