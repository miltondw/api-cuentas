import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('blows')
export class Blow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'profile_id' })
  profileId: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  depth: number;

  @Column({ name: 'blows_6', type: 'int', nullable: true })
  blows6?: number;

  @Column({ name: 'blows_12', type: 'int', nullable: true })
  blows12?: number;

  @Column({ name: 'blows_18', type: 'int', nullable: true })
  blows18?: number;

  @Column({ type: 'int', nullable: true })
  n?: number;

  @Column({ type: 'text', nullable: true })
  observation?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;
}
