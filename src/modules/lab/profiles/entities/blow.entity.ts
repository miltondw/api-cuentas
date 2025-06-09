import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('blows')
export class Blow {
  @PrimaryGeneratedColumn({ name: 'blow_id' })
  id: number;

  @Column({ name: 'profile_id' })
  profileId: number;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  depth: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  blows6?: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  blows12?: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  blows18?: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  n?: number;

  @Column({ type: 'text', nullable: true })
  observation?: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;
}
