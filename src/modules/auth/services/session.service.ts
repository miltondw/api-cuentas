import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { UserSession } from '@/modules/auth/entities/user-session.entity';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';

export interface CreateSessionDto {
  userId: number;
  token: string;
  isRememberMe?: boolean;
  expiresAt: Date;
  req?: Request;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
  ) {}

  async createSession(data: CreateSessionDto): Promise<UserSession> {
    // Hash del token para seguridad (no almacenar JWT completo)
    const tokenHash = crypto
      .createHash('sha256')
      .update(data.token)
      .digest('hex');

    let ipAddress = 'unknown';
    let userAgent = 'unknown';
    let deviceInfo = {};

    if (data.req) {
      ipAddress = this.getRealIpAddress(data.req);
      userAgent = data.req.headers['user-agent'] || 'unknown';
      deviceInfo = this.parseUserAgent(userAgent);
    }

    const session = this.sessionRepository.create({
      token: tokenHash,
      userId: data.userId,
      ipAddress,
      userAgent,
      deviceInfo,
      isRememberMe: data.isRememberMe || false,
      expiresAt: data.expiresAt,
      lastActivity: new Date(),
      isActive: true,
    });

    return this.sessionRepository.save(session);
  }

  async getActiveSessionsByUser(userId: number): Promise<UserSession[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
      order: { lastActivity: 'DESC' },
    });
  }

  async updateLastActivity(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.sessionRepository.update(
      { token: tokenHash, isActive: true },
      { lastActivity: new Date() },
    );
  }

  async validateSession(token: string): Promise<UserSession | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.sessionRepository.findOne({
      where: {
        token: tokenHash,
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (session) {
      // Actualizar última actividad
      await this.updateLastActivity(token);
    }

    return session;
  }

  async revokeSession(
    token: string,
    reason: string = 'user_logout',
  ): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await this.sessionRepository.update(
      { token: tokenHash, isActive: true },
      {
        isActive: false,
        loggedOutAt: new Date(),
        logoutReason: reason,
      },
    );

    return (result.affected || 0) > 0;
  }

  async revokeUserSessions(
    userId: number,
    excludeToken?: string,
    reason: string = 'logout_all',
  ): Promise<number> {
    const whereCondition: any = {
      userId,
      isActive: true,
    };

    if (excludeToken) {
      const excludeTokenHash = crypto
        .createHash('sha256')
        .update(excludeToken)
        .digest('hex');
      whereCondition.token = { $ne: excludeTokenHash } as any;
    }

    const result = await this.sessionRepository.update(whereCondition, {
      isActive: false,
      loggedOutAt: new Date(),
      logoutReason: reason,
    });

    return result.affected || 0;
  }

  async revokeExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository.update(
      {
        isActive: true,
        expiresAt: LessThan(new Date()),
      },
      {
        isActive: false,
        loggedOutAt: new Date(),
        logoutReason: 'expired',
      },
    );

    return result.affected || 0;
  }

  async getSessionStats(userId?: number): Promise<any> {
    const whereCondition = userId ? { userId } : {};

    const activeSessions = await this.sessionRepository.count({
      where: {
        ...whereCondition,
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
    });

    const totalSessions = await this.sessionRepository.count({
      where: whereCondition,
    });

    const rememberMeSessions = await this.sessionRepository.count({
      where: {
        ...whereCondition,
        isRememberMe: true,
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
    });

    return {
      activeSessions,
      totalSessions,
      rememberMeSessions,
      expiredSessions: totalSessions - activeSessions,
    };
  }

  async getRecentSessions(
    userId: number,
    limit: number = 10,
  ): Promise<UserSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async detectSuspiciousLogin(
    userId: number,
    currentIp: string,
    currentUserAgent: string,
  ): Promise<{ suspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    let suspicious = false;

    // Obtener sesiones recientes del usuario
    const recentSessions = await this.sessionRepository.find({
      where: {
        userId,
        createdAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // 30 días
      },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    if (recentSessions.length === 0) {
      return { suspicious: false, reasons: [] };
    }

    // Verificar IP inusual
    const knownIps = recentSessions.map(s => s.ipAddress);
    const uniqueIps = [...new Set(knownIps)];

    if (!uniqueIps.includes(currentIp) && uniqueIps.length > 0) {
      suspicious = true;
      reasons.push('IP address not previously seen');
    }

    // Verificar dispositivo inusual
    const currentDevice = this.parseUserAgent(currentUserAgent);
    const knownDevices = recentSessions.map(s => s.deviceInfo);

    const isKnownDevice = knownDevices.some(
      device =>
        device?.browser?.split(' ')[0] ===
          currentDevice.browser?.split(' ')[0] &&
        device?.os?.split(' ')[0] === currentDevice.os?.split(' ')[0],
    );

    if (!isKnownDevice && knownDevices.length > 0) {
      suspicious = true;
      reasons.push('Unknown device/browser combination');
    }

    // Verificar múltiples sesiones activas desde diferentes ubicaciones
    const activeSessions = recentSessions.filter(s => s.isActive);
    const activeIps = [...new Set(activeSessions.map(s => s.ipAddress))];

    if (activeIps.length > 2 && !activeIps.includes(currentIp)) {
      suspicious = true;
      reasons.push('Multiple active sessions from different locations');
    }

    return { suspicious, reasons };
  }

  async cleanOldSessions(days: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.sessionRepository.delete({
      createdAt: LessThan(cutoff),
      isActive: false,
    });

    return result.affected || 0;
  }
  async findSessionById(
    sessionId: number,
    userId: number,
  ): Promise<UserSession | null> {
    return this.sessionRepository.findOne({
      where: { id: sessionId, userId },
      relations: ['user'],
    });
  }

  /**
   * Verifica si un token JWT ha sido revocado
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.sessionRepository.findOne({
      where: { token: tokenHash },
    });

    // Si no existe la sesión o está inactiva, el token ha sido revocado
    return !session || !session.isActive;
  }

  private getRealIpAddress(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  private parseUserAgent(userAgent: string): Record<string, any> {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      browser:
        `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
      os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
      device: result.device.type || 'desktop',
      engine: result.engine.name || 'Unknown',
    };
  }
}
