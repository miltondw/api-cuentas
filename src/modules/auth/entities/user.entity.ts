import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  LAB = 'lab',
  CLIENT = 'client',
}

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn({ name: 'usuario_id' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Security fields that exist in the actual database
  @Column({ name: 'failed_attempts', type: 'int', default: 0, nullable: true })
  failedAttempts?: number;

  @Column({ name: 'last_failed_attempt', type: 'datetime', nullable: true })
  lastFailedAttempt?: Date;

  @Column({ name: 'account_locked_until', type: 'datetime', nullable: true })
  accountLockedUntil?: Date;

  // Additional security fields from the database
  @Column({
    name: 'password_reset_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expires', type: 'datetime', nullable: true })
  passwordResetExpires?: Date;

  @Column({ name: 'last_password_change', type: 'datetime', nullable: true })
  lastPasswordChange?: Date;
}
