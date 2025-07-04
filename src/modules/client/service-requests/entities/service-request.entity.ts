import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SelectedService } from '@/modules/client/service-requests/entities/selected-service.entity';

export enum ServiceRequestStatus {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en proceso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'name_project', type: 'varchar', length: 255 })
  nameProject: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'varchar', length: 50 })
  identification: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'text' })
  description: string;
  @Column({
    type: 'enum',
    enum: ServiceRequestStatus,
    default: ServiceRequestStatus.PENDIENTE,
  })
  status: ServiceRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(
    () => SelectedService,
    selectedService => selectedService.request,
    {
      cascade: true,
    },
  )
  selectedServices: SelectedService[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  projectLink?: string;
}
