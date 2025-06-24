import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/auth/entities/user.entity';

@Entity('user_sessions')
@Index(['userId', 'isActive'])
@Index(['token'])
@Index(['expiresAt'])
export class UserSession {
  @ApiProperty({
    description: 'ID único de la sesión',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Token de sesión (hash del JWT)',
    example: 'abc123def456...',
  })
  @Column({ unique: true })
  token: string;

  @ApiProperty({
    description: 'ID del usuario',
    example: 123,
  })
  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

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
    description: 'Información del dispositivo parseada',
    example: {
      browser: 'Chrome',
      os: 'Windows',
      device: 'desktop',
    },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  deviceInfo: Record<string, any>;

  @ApiProperty({
    description: 'Indica si la sesión está activa',
    example: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Indica si es una sesión "recordarme"',
    example: false,
  })
  @Column({ default: false })
  isRememberMe: boolean;

  @ApiProperty({
    description: 'Fecha de expiración de la sesión',
    example: '2024-01-16T10:30:00Z',
  })
  @Column()
  expiresAt: Date;

  @ApiProperty({
    description: 'Última actividad de la sesión',
    example: '2024-01-15T10:30:00Z',
  })
  @Column()
  lastActivity: Date;

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
    description: 'Fecha de cierre de sesión',
    example: '2024-01-15T12:30:00Z',
    required: false,
  })
  @Column({ nullable: true })
  loggedOutAt: Date;

  @ApiProperty({
    description: 'Razón del cierre de sesión',
    example: 'user_logout',
    required: false,
  })
  @Column({ nullable: true })
  logoutReason: string;

  @ApiProperty({
    description: 'Fecha de creación de la sesión',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-15T10:30:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
