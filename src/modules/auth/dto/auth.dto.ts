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
import { UserRole } from '@/modules/auth/entities/user.entity';
import { AuthEventType } from '@/modules/auth/entities/auth-log.entity';
import {
  IsStrongPassword,
  IsValidName,
} from '@common/validators/custom.validators';

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
      device: 'Desktop',
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
    example: 'Juan Pérez García',
  })
  @IsString()
  @IsNotEmpty()
  @IsValidName()
  name: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'juan.perez@ejemplo.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña segura del usuario',
    example: 'MySecureP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: 'Confirmación de contraseña',
    example: 'MySecureP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty({
    description: 'Rol del usuario',
    enum: UserRole,
    example: UserRole.CLIENT,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.CLIENT;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token para renovar el access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token de acceso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token para renovar la sesión',
    example: 'a1b2c3d4e5f6...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tipo de token',
    example: 'Bearer',
  })
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: 'Tiempo de expiración del access token en segundos',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Información del usuario autenticado',
  })
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    twoFactorEnabled?: boolean;
  };
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'OldP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña segura',
    example: 'NewSecureP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;

  @ApiProperty({
    description: 'Confirmación de la nueva contraseña',
    example: 'NewSecureP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  confirmNewPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'user@ejemplo.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de restablecimiento de contraseña',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña segura',
    example: 'NewSecureP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;

  @ApiProperty({
    description: 'Confirmación de la nueva contraseña',
    example: 'NewSecureP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  confirmNewPassword: string;
}

export class Enable2FADto {
  @ApiProperty({
    description: 'Código de verificación del authenticator',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  verificationCode: string;
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

export class LogoutDto {
  @ApiProperty({
    description: 'Cerrar sesión en todos los dispositivos',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  logoutAllDevices?: boolean = false;
}
