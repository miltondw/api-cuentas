import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
  Query,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthLogService } from '@/modules/auth/services/auth-log.service';
import { SessionService } from '@/modules/auth/services/session.service';
import { SecurityService } from '@/modules/auth/services/security.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Public } from '@/modules/auth/decorators/public.decorator';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  LogoutDto,
  ChangePasswordDto,
  AuthLogQueryDto,
  SessionQueryDto,
  SecurityReportDto,
} from './dto/auth.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { User } from '@/modules/auth/entities/user.entity';
import { CleanupService } from '@common/services/cleanup.service';

interface AuthenticatedRequest extends Request {
  user: User;
  headers: {
    authorization?: string;
    [key: string]: any;
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authLogService: AuthLogService,
    private readonly sessionService: SessionService,
    private readonly securityService: SecurityService,
    private readonly cleanupService: CleanupService,
  ) {}
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Permite a un usuario autenticarse con email y contraseña. Devuelve un JWT y datos del usuario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
    type: AuthResponseDto,
    examples: {
      success: {
        summary: 'Respuesta exitosa',
        value: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'a1b2c3d4e5f6...',
          tokenType: 'Bearer',
          expiresIn: 900,
          user: {
            id: 1,
            name: 'Juan Pérez García',
            email: 'admin@ingeocimyc.com',
            role: 'ADMIN',
            twoFactorEnabled: false,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta bloqueada',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Credenciales inválidas' },
        remainingAttempts: { type: 'number', example: 2 },
        retryAfter: {
          type: 'string',
          format: 'date-time',
          example: '2025-06-25T12:00:00Z',
        },
        blockDurationMinutes: { type: 'number', example: 15 },
      },
    },
    examples: {
      invalid: {
        summary: 'Credenciales incorrectas',
        value: {
          message: 'Credenciales inválidas',
          remainingAttempts: 2,
        },
      },
      blocked: {
        summary: 'Cuenta bloqueada',
        value: {
          message: 'Cuenta bloqueada por múltiples intentos fallidos',
          retryAfter: '2025-06-25T12:00:00Z',
          blockDurationMinutes: 15,
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos de login',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Demasiados intentos, intente más tarde.',
        },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    // Log para producción: request body y headers
    if (process.env.NODE_ENV === 'production') {
      // Solo loguear campos relevantes, nunca la contraseña
      console.log('[LOGIN] email:', loginDto.email);
      console.log('[LOGIN] headers:', JSON.stringify(req.headers));
      if (loginDto.deviceInfo) {
        console.log('[LOGIN] deviceInfo:', JSON.stringify(loginDto.deviceInfo));
      }
    }
    return this.authService.login(loginDto, req);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya existe',
  })
  @ApiResponse({
    status: 403,
    description: 'Código de autorización inválido para admin',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer JWT token',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    type: ResponseDto,
  })
  async logout(
    @Body() logoutDto: LogoutDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseDto<{ message: string; sessionsRevoked: number }>> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const result = await this.authService.logout(
      token,
      logoutDto.logoutAllDevices || false,
      'user_logout',
      req,
    );
    return {
      success: true,
      data: result,
      message: 'Logged out successfully',
    };
  }
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public() // Endpoint público - no requiere JWT válido
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Renovar token de acceso' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  async refreshToken(
    @Req() req: AuthenticatedRequest,
  ): Promise<AuthResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.authService.refreshToken(token, req);
  }
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cambiar contraseña' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
    type: ResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Contraseña actual incorrecta',
  })
  @ApiResponse({
    status: 400,
    description: 'La nueva contraseña debe ser diferente',
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseDto<{ message: string; sessionsRevoked: number }>> {
    const result = await this.authService.changePassword(
      req.user.id,
      changePasswordDto,
      req,
    );
    return {
      success: true,
      data: result,
      message: 'Password changed successfully',
    };
  }
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    type: ResponseDto,
  })
  async getProfile(
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseDto<any>> {
    const profile = await this.authService.getProfile(req.user.id);
    return {
      success: true,
      data: profile,
      message: 'Profile retrieved successfully',
    };
  }
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener sesiones activas del usuario' })
  @ApiQuery({ type: SessionQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Lista de sesiones activas',
    type: ResponseDto,
  })
  async getActiveSessions(
    @Req() req: AuthenticatedRequest,
    @Query() _query: SessionQueryDto,
  ): Promise<ResponseDto<any[]>> {
    const sessions = await this.authService.getActiveSessions(req.user.id);
    return {
      success: true,
      data: sessions,
      message: 'Active sessions retrieved successfully',
    };
  }
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revocar una sesión específica' })
  @ApiParam({
    name: 'sessionId',
    description: 'ID de la sesión a revocar',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión revocada exitosamente',
    type: ResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Sesión no encontrada',
  })
  async revokeSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseDto<{ message: string }>> {
    const result = await this.authService.revokeSession(
      req.user.id,
      sessionId,
      req,
    );
    return {
      success: true,
      data: result,
      message: 'Session revoked successfully',
    };
  }
  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener logs de autenticación del usuario' })
  @ApiQuery({ type: AuthLogQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs de autenticación',
    type: ResponseDto,
  })
  async getAuthLogs(
    @Req() req: AuthenticatedRequest,
    @Query() query: AuthLogQueryDto,
  ): Promise<ResponseDto<any[]>> {
    const logs = await this.authLogService.getLogsByUser(
      req.user.email,
      query.limit || 50,
    );
    return {
      success: true,
      data: logs,
      message: 'Auth logs retrieved successfully',
    };
  }
  @Get('security/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener reporte de seguridad (solo admin)',
    description: 'Endpoint disponible solo para administradores',
  })
  @ApiQuery({ type: SecurityReportDto })
  @ApiResponse({
    status: 200,
    description: 'Reporte de seguridad',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string' },
        totalFailedAttempts: { type: 'number' },
        currentlyBlockedAccounts: { type: 'number' },
        uniqueTargetedEmails: { type: 'number' },
        topTargetedEmails: { type: 'array' },
        topAttackingIps: { type: 'array' },
        generatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Solo administradores',
  })
  async getSecurityReport(
    @Req() req: AuthenticatedRequest,
    @Query() _query: SecurityReportDto,
  ): Promise<any> {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      throw new Error('Access denied - Admin only');
    }

    return this.securityService.getSecurityReport();
  }
  @Get('security/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener estadísticas de login (solo admin)',
    description: 'Endpoint disponible solo para administradores',
  })
  @ApiQuery({
    name: 'days',
    description: 'Número de días para las estadísticas',
    required: false,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de login',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string' },
        successfulLogins: { type: 'number' },
        failedLogins: { type: 'number' },
        uniqueUsers: { type: 'number' },
        successRate: { type: 'string' },
      },
    },
  })
  async getLoginStats(
    @Req() req: AuthenticatedRequest,
    @Query('days') days: number = 30,
  ): Promise<any> {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      throw new Error('Access denied - Admin only');
    }

    return this.authLogService.getLoginStats(days);
  }
  @Post('security/cleanup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Limpiar logs antiguos (solo admin)',
    description:
      'Limpia logs de autenticación y sesiones antiguas. Solo administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Limpieza completada',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        authLogsDeleted: { type: 'number' },
        sessionsDeleted: { type: 'number' },
        failedAttemptsDeleted: { type: 'number' },
      },
    },
  })
  async cleanupOldLogs(
    @Req() req: AuthenticatedRequest,
    @Query('days') days: number = 90,
  ): Promise<any> {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      throw new Error('Access denied - Admin only');
    }

    const authLogsDeleted = await this.authLogService.cleanOldLogs(days);
    const sessionsDeleted = await this.sessionService.cleanOldSessions(days);
    const failedAttemptsDeleted =
      await this.securityService.cleanOldFailedAttempts(days);

    return {
      message: `Cleanup completed for records older than ${days} days`,
      authLogsDeleted,
      sessionsDeleted,
      failedAttemptsDeleted,
    };
  }
  @Get('security/cleanup-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener estadísticas de limpieza (solo admin)',
    description:
      'Muestra información sobre datos almacenados y limpieza automática',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de limpieza',
    schema: {
      type: 'object',
      properties: {
        totalActiveSessions: { type: 'number' },
        totalAuthLogs: { type: 'number' },
        totalFailedAttempts: { type: 'number' },
        lastCleanupInfo: { type: 'string' },
      },
    },
  })
  async getCleanupStats(@Req() req: AuthenticatedRequest): Promise<any> {
    if (req.user.role !== 'admin') {
      throw new Error('Access denied - Admin only');
    }

    return this.cleanupService.performFullCleanup();
  }
}
