import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { AuthLogService } from './services/auth-log.service';
import { SessionService } from './services/session.service';
import { SecurityService } from './services/security.service';
import { AuthEventType } from './entities/auth-log.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private authLogService: AuthLogService,
    private sessionService: SessionService,
    private securityService: SecurityService,
  ) {} // Add validateUser method that's required by the JWT strategy
  async validateUser(email: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        console.error(`User with email ${email} not found in database`);
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      console.error(`Database error validating user ${email}:`, error.message);
      return null;
    }
  }

  async login(loginDto: LoginDto, req?: Request): Promise<AuthResponseDto> {
    const { email, password, rememberMe = false } = loginDto;
    const ipAddress = this.getClientIp(req);

    // Verificar seguridad antes del login
    const securityCheck = await this.securityService.checkLoginSecurity(
      email,
      ipAddress,
      req,
    );
    if (!securityCheck.allowed) {
      await this.authLogService.createLog({
        eventType: AuthEventType.FAILED_LOGIN,
        userEmail: email,
        success: false,
        errorMessage: securityCheck.reason,
        metadata: {
          blocked: true,
          remainingAttempts: securityCheck.remainingAttempts,
          retryAfter: securityCheck.retryAfter?.toISOString(),
        },
        req,
      });

      throw new UnauthorizedException({
        message: securityCheck.reason,
        remainingAttempts: securityCheck.remainingAttempts,
        retryAfter: securityCheck.retryAfter,
        blockDurationMinutes: securityCheck.blockDurationMinutes,
      });
    }

    // Buscar usuario por email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      await this.securityService.recordFailedAttempt(
        email,
        ipAddress,
        'user_not_found',
        req,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    } // Verificar si la cuenta está bloqueada
    if (user.account_locked_until && user.account_locked_until > new Date()) {
      await this.authLogService.createLog({
        eventType: AuthEventType.FAILED_LOGIN,
        userEmail: email,
        userId: user.id,
        success: false,
        errorMessage: 'Account is locked',
        metadata: {
          lockedUntil: user.account_locked_until.toISOString(),
        },
        req,
      });

      throw new UnauthorizedException({
        message: 'Account is temporarily locked',
        retryAfter: user.account_locked_until,
        blockDurationMinutes: Math.ceil(
          (user.account_locked_until.getTime() - Date.now()) / (1000 * 60),
        ),
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      await this.authLogService.createLog({
        eventType: AuthEventType.FAILED_LOGIN,
        userEmail: email,
        userId: user.id,
        success: false,
        errorMessage: 'Account is deactivated',
        req,
      });

      throw new UnauthorizedException('Account is deactivated');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.securityService.recordFailedAttempt(
        email,
        ipAddress,
        'invalid_password',
        req,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Detectar actividad sospechosa
    const suspiciousCheck = await this.sessionService.detectSuspiciousLogin(
      user.id,
      ipAddress,
      req?.headers['user-agent'] || '',
    );

    if (suspiciousCheck.suspicious) {
      this.logger.warn(
        `Suspicious login detected for user ${email} from IP ${ipAddress}: ${suspiciousCheck.reasons.join(', ')}`,
      );

      await this.authLogService.createLog({
        eventType: AuthEventType.SUSPICIOUS_ACTIVITY,
        userEmail: email,
        userId: user.id,
        success: true,
        metadata: {
          suspiciousReasons: suspiciousCheck.reasons,
          newDevice: true,
        },
        req,
      });
    }

    // Generar token JWT
    const payload = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const expiresIn = rememberMe ? '24h' : '8h'; // 24h si "recordarme", 8h normal
    const accessToken = this.jwtService.sign(payload, { expiresIn });

    // Crear sesión
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (rememberMe ? 24 : 8));

    await this.sessionService.createSession({
      userId: user.id,
      token: accessToken,
      isRememberMe: rememberMe,
      expiresAt,
      req,
    });

    // Limpiar intentos fallidos exitosos
    await this.securityService.clearFailedAttempts(email, ipAddress); // Actualizar datos del usuario
    await this.userRepository.update(user.id, {
      last_login: new Date(),
      last_login_ip: ipAddress,
      login_count: (user.login_count || 0) + 1,
      failed_attempts: 0,
      last_failed_attempt: null,
    });

    // Log del login exitoso
    await this.authLogService.createLog({
      eventType: AuthEventType.LOGIN,
      userEmail: email,
      userId: user.id,
      success: true,
      metadata: {
        rememberMe,
        isNewDevice: suspiciousCheck.suspicious,
        login_count: (user.login_count || 0) + 1,
      },
      req,
    });

    const response: AuthResponseDto = {
      accessToken,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expiresIn: rememberMe ? 86400 : 28800, // seconds
      sessionInfo: {
        isRememberMe: rememberMe,
        expiresAt: expiresAt.toISOString(),
        isNewDevice: suspiciousCheck.suspicious,
        deviceInfo: suspiciousCheck.suspicious ? null : undefined,
      },
    };

    return response;
  }
  async register(registerDto: RegisterDto) {
    const { email, password, name, firstName, lastName, role, jwt2 } =
      registerDto;

    // Construct the full name from firstName + lastName or use name directly
    const fullName =
      name ||
      (firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || lastName || 'User');
    // Determine the role - default to USUARIO
    const userRole = role || UserRole.CLIENT;

    // Validate admin registration
    if (userRole === UserRole.ADMIN) {
      if (!jwt2 || jwt2 !== process.env.JWT_SECRET_2) {
        throw new ForbiddenException(
          'Código de autorización inválido para crear cuenta de administrador',
        );
      }
    }

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12); // Crear nuevo usuario
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name: fullName,
      role: userRole,
    });

    const savedUser = await this.userRepository.save(user); // Generar token JWT
    const payload = {
      sub: savedUser.id,
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
      },
      expiresIn: 28800, // 8 hours in seconds
    };
  }

  async logout(
    token: string,
    logoutAll: boolean = false,
    reason: string = 'user_logout',
    req?: Request,
  ): Promise<{ message: string; sessionsRevoked: number }> {
    let sessionsRevoked = 0;

    if (logoutAll) {
      // Obtener el usuario del token para cerrar todas sus sesiones
      try {
        const decoded = this.jwtService.verify(token);
        sessionsRevoked = await this.sessionService.revokeUserSessions(
          decoded.userId,
          undefined,
          reason,
        );
      } catch (error) {
        this.logger.warn('Invalid token provided for logout all');
      }
    } else {
      // Cerrar solo la sesión actual
      const revoked = await this.sessionService.revokeSession(token, reason);
      sessionsRevoked = revoked ? 1 : 0;
    }

    // Log del logout
    try {
      const decoded = this.jwtService.verify(token);
      await this.authLogService.createLog({
        eventType: AuthEventType.LOGOUT,
        userEmail: decoded.email,
        userId: decoded.userId,
        success: true,
        metadata: {
          logoutAll,
          reason,
          sessionsRevoked,
        },
        req,
      });
    } catch (error) {
      // Token inválido, pero aún podemos hacer logout
      this.logger.warn('Logout attempted with invalid token');
    }

    return {
      message: logoutAll
        ? 'All sessions logged out successfully'
        : 'Logged out successfully',
      sessionsRevoked,
    };
  }

  async refreshToken(token: string, req?: Request): Promise<AuthResponseDto> {
    try {
      // Verificar que el token sea válido
      const decoded = this.jwtService.verify(token);

      // Verificar que la sesión exista y esté activa
      const session = await this.sessionService.validateSession(token);
      if (!session) {
        throw new UnauthorizedException('Invalid session');
      }

      // Buscar el usuario
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId },
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generar nuevo token
      const payload = {
        sub: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
      };

      const expiresIn = session.isRememberMe ? '24h' : '8h';
      const newAccessToken = this.jwtService.sign(payload, { expiresIn });

      // Revocar la sesión anterior y crear nueva
      await this.sessionService.revokeSession(token, 'token_refresh');

      const expiresAt = new Date();
      expiresAt.setHours(
        expiresAt.getHours() + (session.isRememberMe ? 24 : 8),
      );

      await this.sessionService.createSession({
        userId: user.id,
        token: newAccessToken,
        isRememberMe: session.isRememberMe,
        expiresAt,
        req,
      });

      // Log del refresh
      await this.authLogService.createLog({
        eventType: AuthEventType.SESSION_EXTENDED,
        userEmail: user.email,
        userId: user.id,
        success: true,
        metadata: {
          previousTokenExpiry: session.expiresAt.toISOString(),
          newTokenExpiry: expiresAt.toISOString(),
        },
        req,
      });

      return {
        accessToken: newAccessToken,
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
        expiresIn: session.isRememberMe ? 86400 : 28800,
        sessionInfo: {
          isRememberMe: session.isRememberMe,
          expiresAt: expiresAt.toISOString(),
          isNewDevice: false,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
    req?: Request,
  ): Promise<{ message: string; sessionsRevoked: number }> {
    const {
      currentPassword,
      newPassword,
      logoutOtherSessions = true,
    } = changePasswordDto;

    // Buscar el usuario
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      await this.authLogService.createLog({
        eventType: AuthEventType.FAILED_LOGIN,
        userEmail: user.email,
        userId: user.id,
        success: false,
        errorMessage: 'Invalid current password for password change',
        req,
      });

      throw new UnauthorizedException('Current password is incorrect');
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash de la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
      last_password_change: new Date(),
    });

    let sessionsRevoked = 0;
    if (logoutOtherSessions) {
      sessionsRevoked = await this.sessionService.revokeUserSessions(
        userId,
        undefined,
        'password_changed',
      );
    }

    // Log del cambio de contraseña
    await this.authLogService.createLog({
      eventType: AuthEventType.PASSWORD_CHANGED,
      userEmail: user.email,
      userId: user.id,
      success: true,
      metadata: {
        logoutOtherSessions,
        sessionsRevoked,
      },
      req,
    });

    return {
      message: 'Password changed successfully',
      sessionsRevoked,
    };
  }

  async getProfile(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'name',
        'email',
        'role',
        'created_at',
        'last_login',
        'last_login_ip',
        'login_count',
        'two_factor_enabled',
        'is_active',
        'last_password_change',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Obtener estadísticas de sesión
    const sessionStats = await this.sessionService.getSessionStats(userId);
    const recentSessions = await this.sessionService.getRecentSessions(
      userId,
      5,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        lastLoginIp: user.last_login_ip,
        loginCount: user.login_count,
        twoFactorEnabled: user.two_factor_enabled,
        isActive: user.is_active,
        lastPasswordChange: user.last_password_change,
      },
      sessionStats,
      recentSessions: recentSessions.map(session => ({
        id: session.id,
        ipAddress: session.ipAddress,
        deviceInfo: session.deviceInfo,
        isActive: session.isActive,
        isRememberMe: session.isRememberMe,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        loggedOutAt: session.loggedOutAt,
      })),
    };
  }

  async getActiveSessions(userId: number): Promise<any[]> {
    const sessions = await this.sessionService.getActiveSessionsByUser(userId);

    return sessions.map(session => ({
      id: session.id,
      ipAddress: session.ipAddress,
      deviceInfo: session.deviceInfo,
      country: session.country,
      city: session.city,
      isRememberMe: session.isRememberMe,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      isCurrent: false, // This would need to be determined by comparing with current token
    }));
  }
  async revokeSession(
    userId: number,
    sessionId: number,
    req?: Request,
  ): Promise<{ message: string }> {
    const session = await this.sessionService.findSessionById(
      sessionId,
      userId,
    );

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    const revoked = await this.sessionService.revokeSession(
      session.token,
      'user_revoked',
    );

    if (revoked) {
      await this.authLogService.createLog({
        eventType: AuthEventType.LOGOUT,
        userEmail: session.user.email,
        userId: session.userId,
        success: true,
        metadata: {
          sessionId,
          reason: 'user_revoked',
          revokedByUser: true,
        },
        req,
      });
    }

    return { message: 'Session revoked successfully' };
  }

  private getClientIp(req?: Request): string {
    if (!req) return 'unknown';

    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }
}
