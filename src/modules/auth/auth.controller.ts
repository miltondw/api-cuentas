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
import { AuthService } from './auth.service';
import { AuthLogService } from './services/auth-log.service';
import { SessionService } from './services/session.service';
import { SecurityService } from './services/security.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
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
import { User } from './entities/user.entity';
import { CleanupService } from '@/common/services/cleanup.service';

interface AuthenticatedRequest extends Request {
  user: User;
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
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta bloqueada',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        remainingAttempts: { type: 'number' },
        retryAfter: { type: 'string', format: 'date-time' },
        blockDurationMinutes: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos de login',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer JWT token',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        sessionsRevoked: { type: 'number' },
      },
    },
  })
  async logout(
    @Body() logoutDto: LogoutDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string; sessionsRevoked: number }> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.authService.logout(
      token,
      logoutDto.logoutAll || false,
      logoutDto.reason || 'user_logout',
      req,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        sessionsRevoked: { type: 'number' },
      },
    },
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
  ): Promise<{ message: string; sessionsRevoked: number }> {
    return this.authService.changePassword(req.user.id, changePasswordDto, req);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time' },
            lastLoginIp: { type: 'string' },
            loginCount: { type: 'number' },
            twoFactorEnabled: { type: 'boolean' },
            isActive: { type: 'boolean' },
            lastPasswordChange: { type: 'string', format: 'date-time' },
          },
        },
        sessionStats: { type: 'object' },
        recentSessions: { type: 'array' },
      },
    },
  })
  async getProfile(@Req() req: AuthenticatedRequest): Promise<any> {
    return this.authService.getProfile(req.user.id);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener sesiones activas del usuario' })
  @ApiQuery({ type: SessionQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Lista de sesiones activas',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          ipAddress: { type: 'string' },
          deviceInfo: { type: 'object' },
          country: { type: 'string' },
          city: { type: 'string' },
          isRememberMe: { type: 'boolean' },
          lastActivity: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          isCurrent: { type: 'boolean' },
        },
      },
    },
  })
  async getActiveSessions(
    @Req() req: AuthenticatedRequest,
    @Query() _query: SessionQueryDto,
  ): Promise<any[]> {
    return this.authService.getActiveSessions(req.user.id);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revocar una sesión específica' })
  @ApiParam({
    name: 'sessionId',
    description: 'ID de la sesión a revocar',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión revocada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Sesión no encontrada',
  })
  async revokeSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.authService.revokeSession(req.user.id, sessionId, req);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener logs de autenticación del usuario' })
  @ApiQuery({ type: AuthLogQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs de autenticación',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/AuthLog' },
    },
  })
  async getAuthLogs(
    @Req() req: AuthenticatedRequest,
    @Query() query: AuthLogQueryDto,
  ): Promise<any[]> {
    return this.authLogService.getLogsByUser(req.user.email, query.limit || 50);
  }

  @Get('security/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @ApiBearerAuth()
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
  @ApiBearerAuth()
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
  @ApiBearerAuth()
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

    return this.cleanupService.getCleanupStats();
  }
}
