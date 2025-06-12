import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('failed_login_attempts')
@Index(['email', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class FailedLoginAttempt {
  @ApiProperty({
    description: 'ID único del intento fallido',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Email del intento de login',
    example: 'usuario@ejemplo.com',
  })
  @Column()
  email: string;

  @ApiProperty({
    description: 'Dirección IP del cliente',
    example: '192.168.1.100',
  })
  @Column()
  ipAddress: string;

  @ApiProperty({
    description: 'User Agent del navegador',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @Column({ type: 'text' })
  userAgent: string;

  @ApiProperty({
    description: 'Razón del fallo',
    example: 'invalid_password',
  })
  @Column()
  reason: string;

  @ApiProperty({
    description: 'Número de intentos consecutivos',
    example: 3,
  })
  @Column({ default: 1 })
  attemptCount: number;

  @ApiProperty({
    description: 'Indica si la IP fue bloqueada por este intento',
    example: false,
  })
  @Column({ default: false })
  blocked: boolean;

  @ApiProperty({
    description: 'Fecha hasta cuando está bloqueado',
    example: '2024-01-15T11:30:00Z',
    required: false,
  })
  @Column({ nullable: true })
  blockedUntil: Date;

  @ApiProperty({
    description: 'Información adicional del intento',
    example: { passwordLength: 8, hasSpecialChars: false },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Fecha del intento',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
