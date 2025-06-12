import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum AuthEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  TOKEN_EXPIRED = 'token_expired',
  SESSION_EXTENDED = 'session_extended',
  FAILED_LOGIN = 'failed_login',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_LOCKED = 'account_locked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

@Entity('auth_logs')
@Index(['userId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class AuthLog {
  @ApiProperty({
    description: 'ID único del log',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Tipo de evento de autenticación',
    enum: AuthEventType,
    example: AuthEventType.LOGIN,
  })
  @Column({
    type: 'enum',
    enum: AuthEventType,
  })
  eventType: AuthEventType;

  @ApiProperty({
    description: 'ID del usuario (si aplica)',
    example: 123,
    required: false,
  })
  @Column({ nullable: true })
  userId: number;

  @ApiProperty({
    description: 'Email del usuario (si aplica)',
    example: 'usuario@ejemplo.com',
    required: false,
  })
  @Column({ nullable: true })
  userEmail: string;

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
    description: 'País detectado desde la IP',
    example: 'Colombia',
    required: false,
  })
  @Column({ nullable: true })
  country: string;

  @ApiProperty({
    description: 'Ciudad detectada desde la IP',
    example: 'Bogotá',
    required: false,
  })
  @Column({ nullable: true })
  city: string;

  @ApiProperty({
    description: 'Información adicional del evento',
    example: { reason: 'Invalid password', attempts: 3 },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Indica si el evento fue exitoso',
    example: true,
  })
  @Column({ default: true })
  success: boolean;

  @ApiProperty({
    description: 'Descripción del error (si aplica)',
    example: 'Credenciales inválidas',
    required: false,
  })
  @Column({ nullable: true })
  errorMessage: string;

  @ApiProperty({
    description: 'Duración de la sesión en minutos (para logout)',
    example: 120,
    required: false,
  })
  @Column({ nullable: true })
  sessionDuration: number;

  @ApiProperty({
    description: 'Fecha y hora del evento',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
