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
import { Service } from '@/modules/services/entities/service.entity';
import { ServiceAdditionalValue } from '@/modules/services/entities/service-additional-value.entity';

@Entity('service_additional_fields')
export class ServiceAdditionalField {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'service_id' })
  serviceId: number;

  @Column({ name: 'field_name', type: 'varchar', length: 100 })
  fieldName: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'json', nullable: true })
  options?: any;

  @Column({
    name: 'depends_on_field',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  dependsOnField?: string;

  @Column({
    name: 'depends_on_value',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  dependsOnValue?: string;
  @Column({ type: 'varchar', length: 255, nullable: true })
  label?: string;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @OneToMany(() => ServiceAdditionalValue, value => value.field)
  values: ServiceAdditionalValue[];
}
