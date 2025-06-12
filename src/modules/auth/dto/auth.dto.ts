import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';
import { AuthEventType } from '../entities/auth-log.entity';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'admin@ingeocimyc.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
  @ApiProperty({
    description: 'Recordar sesión por 24 horas',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;

  @ApiProperty({
    description: 'Información del dispositivo del usuario',
    example: {
      browser: 'Chrome',
      os: 'Windows',
      device: 'Desktop'
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    ip?: string;
    userAgent?: string;
  };
}

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Primer nombre del usuario',
    example: 'Juan',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'juan.perez@ingeocimyc.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
  @ApiProperty({
    description: 'Rol del usuario',
    enum: UserRole,
    example: UserRole.CLIENT,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    description: 'JWT2 code for admin registration',
    example: 'secret-admin-code',
    required: false,
  })
  @IsString()
  @IsOptional()
  jwt2?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token de acceso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
  @ApiProperty({
    description: 'Información del usuario autenticado',
  })
  user: {
    email: string;
    name: string;
    role: string;
  };

  @ApiProperty({
    description: 'Tiempo de expiración del token en segundos',
    example: 86400,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Información de la sesión',
    required: false,
  })
  sessionInfo?: {
    isRememberMe: boolean;
    expiresAt: string;
    isNewDevice: boolean;
    deviceInfo?: any;
  };
}

export class LogoutDto {
  @ApiProperty({
    description: 'Cerrar todas las sesiones del usuario',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  logoutAll?: boolean;

  @ApiProperty({
    description: 'Razón del logout',
    example: 'user_request',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de actualización',
    example: 'refresh_token_here',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'oldpassword123',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 6 caracteres)',
    example: 'newpassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({
    description: 'Cerrar otras sesiones después del cambio',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  logoutOtherSessions?: boolean;
}

export class AuthLogQueryDto {
  @ApiProperty({
    description: 'Tipo de evento a filtrar',
    enum: AuthEventType,
    required: false,
  })
  @IsEnum(AuthEventType)
  @IsOptional()
  eventType?: AuthEventType;

  @ApiProperty({
    description: 'Email del usuario a filtrar',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  userEmail?: string;

  @ApiProperty({
    description: 'Número de registros a devolver',
    example: 50,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Filtrar por éxito/fallo',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  success?: boolean;

  @ApiProperty({
    description: 'Fecha desde (ISO string)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiProperty({
    description: 'Fecha hasta (ISO string)',
    example: '2024-01-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}

export class SessionQueryDto {
  @ApiProperty({
    description: 'Solo sesiones activas',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean;

  @ApiProperty({
    description: 'Número de sesiones a devolver',
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class SecurityReportDto {
  @ApiProperty({
    description: 'Período del reporte en días',
    example: 7,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  days?: number;

  @ApiProperty({
    description: 'Incluir detalles de IPs sospechosas',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  includeSuspiciousIps?: boolean;
}
