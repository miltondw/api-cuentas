import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ServiceRequest } from '@/modules/client/service-requests/entities/service-request.entity';
import { ServiceInstance } from '@/modules/client/service-requests/entities/service-instance.entity';
import { Service } from '@modules/services/entities/service.entity';
import { ServiceAdditionalValue } from '@modules/services/entities/service-additional-value.entity';

@Entity('selected_services')
export class SelectedService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'request_id' })
  requestId: number;

  @Column({ name: 'service_id' })
  serviceId: number;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => ServiceRequest, request => request.selectedServices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'request_id' })
  request: ServiceRequest;
  @ManyToOne(() => Service, service => service.selectedServices, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;
  @OneToMany(
    () => ServiceInstance,
    serviceInstance => serviceInstance.selectedService,
    {
      cascade: true,
    },
  )
  serviceInstances: ServiceInstance[];

  @OneToMany(() => ServiceAdditionalValue, value => value.selectedService, {
    cascade: true,
  })
  additionalValues: ServiceAdditionalValue[];
}
