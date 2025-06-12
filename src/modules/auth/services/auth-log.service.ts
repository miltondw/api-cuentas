import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { AuthLog, AuthEventType } from '../entities/auth-log.entity';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export interface CreateAuthLogDto {
  eventType: AuthEventType;
  userId?: number;
  userEmail?: string;
  success?: boolean;
  errorMessage?: string;
  sessionDuration?: number;
  metadata?: Record<string, any>;
  req?: Request;
}

@Injectable()
export class AuthLogService {
  constructor(
    @InjectRepository(AuthLog)
    private authLogRepository: Repository<AuthLog>,
  ) {}
  async createLog(data: CreateAuthLogDto): Promise<AuthLog> {
    let ipAddress = 'unknown';
    let userAgent = 'unknown';

    if (data.req) {
      // Obtener IP real considerando proxies
      ipAddress = this.getRealIpAddress(data.req);
      userAgent = data.req.headers['user-agent'] || 'unknown';
    }
    const log = this.authLogRepository.create({
      eventType: data.eventType,
      userId: data.userId,
      ipAddress,
      userAgent,
      success: data.success ?? true,
      errorMessage: data.errorMessage,
      sessionDuration: data.sessionDuration,
      metadata: data.metadata,
      // TODO: Agregar geolocalización si es necesario
      country: null,
      city: null,
    });

    return this.authLogRepository.save(log);
  }

  async getLogsByUser(
    userEmail: string,
    limit: number = 50,
  ): Promise<AuthLog[]> {
    return this.authLogRepository.find({
      where: { userEmail },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentFailedLogins(
    email: string,
    hours: number = 1,
  ): Promise<AuthLog[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.authLogRepository.find({
      where: {
        userEmail: email,
        eventType: AuthEventType.FAILED_LOGIN,
        createdAt: MoreThan(since),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getFailedLoginsByIp(
    ipAddress: string,
    hours: number = 1,
  ): Promise<AuthLog[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.authLogRepository.find({
      where: {
        ipAddress,
        eventType: AuthEventType.FAILED_LOGIN,
        createdAt: MoreThan(since),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getSuspiciousActivity(hours: number = 24): Promise<AuthLog[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    // Buscar actividad sospechosa: múltiples fallos desde la misma IP
    const result = await this.authLogRepository
      .createQueryBuilder('log')
      .select(['log.ipAddress', 'COUNT(*) as failedCount'])
      .where('log.eventType = :eventType', {
        eventType: AuthEventType.FAILED_LOGIN,
      })
      .andWhere('log.createdAt > :since', { since })
      .groupBy('log.ipAddress')
      .having('failedCount > :threshold', { threshold: 5 })
      .getRawMany();

    if (result.length === 0) return [];

    // Obtener los logs completos de las IPs sospechosas
    const suspiciousIps = result.map(r => r.log_ipAddress);
    return this.authLogRepository.find({
      where: {
        ipAddress: { $in: suspiciousIps } as any,
        eventType: AuthEventType.FAILED_LOGIN,
        createdAt: MoreThan(since),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getLoginStats(days: number = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const successfulLogins = await this.authLogRepository.count({
      where: {
        eventType: AuthEventType.LOGIN,
        success: true,
        createdAt: MoreThan(since),
      },
    });

    const failedLogins = await this.authLogRepository.count({
      where: {
        eventType: AuthEventType.FAILED_LOGIN,
        createdAt: MoreThan(since),
      },
    });

    const uniqueUsers = await this.authLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.userEmail)', 'count')
      .where('log.eventType = :eventType', { eventType: AuthEventType.LOGIN })
      .andWhere('log.success = :success', { success: true })
      .andWhere('log.createdAt > :since', { since })
      .getRawOne();

    return {
      period: `${days} days`,
      successfulLogins,
      failedLogins,
      uniqueUsers: parseInt(uniqueUsers.count) || 0,
      successRate:
        failedLogins > 0
          ? (
              (successfulLogins / (successfulLogins + failedLogins)) *
              100
            ).toFixed(2) + '%'
          : '100%',
    };
  }

  async cleanOldLogs(days: number = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.authLogRepository.delete({
      createdAt: LessThan(cutoff),
    });

    return result.affected || 0;
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
      browser: `${result.browser.name} ${result.browser.version}`,
      os: `${result.os.name} ${result.os.version}`,
      device: result.device.type || 'desktop',
      engine: result.engine.name,
    };
  }
}
