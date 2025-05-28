import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Blow } from './blow.entity';

@Entity('perfiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @Column({ name: 'profile_date', type: 'date', nullable: true })
  profileDate?: Date;

  @Column({ name: 'samples_number', type: 'int', nullable: true })
  samplesNumber?: number;

  @Column({ name: 'sounding_number', type: 'varchar', length: 100 })
  soundingNumber: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'decimal', precision: 8, scale: 6, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  depth?: number;

  @Column({
    name: 'water_level',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  waterLevel?: number;

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @Column({ name: 'profile_data', type: 'json', nullable: true })
  profileData?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => Blow, blow => blow.profile, { cascade: true })
  blows: Blow[];
}
