import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { SelectedService } from '@/modules/client/service-requests/entities/selected-service.entity';
import { ServiceInstanceValue } from '@/modules/client/service-requests/entities/service-instance-value.entity';

@Entity('service_instances')
export class ServiceInstance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'selected_service_id' })
  selectedServiceId: number;

  @Column({ name: 'instance_number', type: 'int' })
  instanceNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(
    () => SelectedService,
    selectedService => selectedService.serviceInstances,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'selected_service_id' })
  selectedService: SelectedService;

  @OneToMany(
    () => ServiceInstanceValue,
    serviceInstanceValue => serviceInstanceValue.serviceInstance,
    {
      cascade: true,
    },
  )
  serviceInstanceValues: ServiceInstanceValue[];
}
