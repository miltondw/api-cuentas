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
import { Blow } from './blow.entity';
import { Project } from '@/modules/projects/entities/project.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn({ name: 'profile_id' })
  id: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @Column({ name: 'sounding_number', type: 'varchar', length: 10 })
  soundingNumber: string;

  @Column({ name: 'water_level', type: 'varchar', length: 50, nullable: true })
  waterLevel?: string;

  @Column({ name: 'profile_date', type: 'date', nullable: true })
  profileDate?: Date;

  @Column({ name: 'samples_number', type: 'int', nullable: true })
  samplesNumber?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Project, project => project.profiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => Blow, blow => blow.profile, { cascade: true })
  blows: Blow[];
}
