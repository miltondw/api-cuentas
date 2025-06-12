import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  LAB = 'lab',
  CLIENT = 'client',
}

@Entity('usuarios')
export class User {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 1,
  })
  @PrimaryGeneratedColumn({ name: 'usuario_id' })
  id: number;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan@ejemplo.com',
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @ApiProperty({
    description: 'Rol del usuario',
    enum: UserRole,
    example: UserRole.CLIENT,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
  // Security fields that exist in the actual database
  @ApiProperty({
    description: 'Número de intentos fallidos de login',
    example: 0,
    required: false,
  })
  @Column({ name: 'failed_attempts', type: 'int', default: 0, nullable: true })
  failed_attempts?: number;

  @ApiProperty({
    description: 'Fecha del último intento fallido',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @Column({ name: 'last_failed_attempt', type: 'datetime', nullable: true })
  last_failed_attempt?: Date;

  @ApiProperty({
    description: 'Fecha hasta cuando la cuenta está bloqueada',
    example: '2024-01-15T11:30:00Z',
    required: false,
  })
  @Column({ name: 'account_locked_until', type: 'datetime', nullable: true })
  account_locked_until?: Date;

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

  @ApiProperty({
    description: 'Fecha del último cambio de contraseña',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @Column({ name: 'last_password_change', type: 'datetime', nullable: true })
  last_password_change?: Date;

  // New security fields
  @ApiProperty({
    description: 'Fecha del último login exitoso',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  last_login?: Date;

  @ApiProperty({
    description: 'IP del último login',
    example: '192.168.1.100',
    required: false,
  })
  @Column({
    name: 'last_login_ip',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  last_login_ip?: string;

  @ApiProperty({
    description: 'Indica si la autenticación 2FA está habilitada',
    example: false,
    required: false,
  })
  @Column({ name: 'two_factor_enabled', type: 'boolean', default: false })
  two_factor_enabled?: boolean;
  @Column({
    name: 'two_factor_secret',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  two_factor_secret?: string;

  @ApiProperty({
    description: 'Número total de logins del usuario',
    example: 25,
    required: false,
  })
  @Column({ name: 'login_count', type: 'int', default: 0 })
  login_count?: number;

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
    required: false,
  })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active?: boolean;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
