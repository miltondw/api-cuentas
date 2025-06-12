import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { FailedLoginAttempt } from '../entities/failed-login-attempt.entity';
import { AuthLogService } from './auth-log.service';
import { AuthEventType } from '../entities/auth-log.entity';
import { Request } from 'express';

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  remainingAttempts?: number;
  blockDurationMinutes?: number;
  retryAfter?: Date;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  // Configuración de seguridad
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MINUTES = 15;
  private readonly RATE_LIMIT_WINDOW_MINUTES = 5;
  private readonly MAX_REQUESTS_PER_WINDOW = 10;

  constructor(
    @InjectRepository(FailedLoginAttempt)
    private failedAttemptRepository: Repository<FailedLoginAttempt>,
    private authLogService: AuthLogService,
  ) {}
  async checkLoginSecurity(
    email: string,
    ipAddress: string,
    _req?: Request,
  ): Promise<SecurityCheckResult> {
    // Verificar bloqueo por email
    const emailCheck = await this.checkEmailBlocking(email);
    if (!emailCheck.allowed) {
      return emailCheck;
    }

    // Verificar bloqueo por IP
    const ipCheck = await this.checkIpBlocking(ipAddress);
    if (!ipCheck.allowed) {
      return ipCheck;
    }

    // Verificar rate limiting
    const rateLimitCheck = await this.checkRateLimit(ipAddress);
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck;
    }

    return { allowed: true };
  }

  async recordFailedAttempt(
    email: string,
    ipAddress: string,
    reason: string,
    req?: Request,
  ): Promise<void> {
    const userAgent = req?.headers['user-agent'] || 'unknown';

    // Buscar intentos recientes del email
    const recentEmailAttempts = await this.getRecentFailedAttempts(
      email,
      'email',
    );
    const emailAttemptCount = recentEmailAttempts.length + 1;

    // Buscar intentos recientes de la IP
    const recentIpAttempts = await this.getRecentFailedAttempts(
      ipAddress,
      'ip',
    );
    const ipAttemptCount = recentIpAttempts.length + 1;

    // Determinar si debe bloquearse
    const shouldBlockEmail = emailAttemptCount >= this.MAX_FAILED_ATTEMPTS;
    const shouldBlockIp = ipAttemptCount >= this.MAX_FAILED_ATTEMPTS;

    let blockedUntil: Date | null = null;
    if (shouldBlockEmail || shouldBlockIp) {
      blockedUntil = new Date();
      blockedUntil.setMinutes(
        blockedUntil.getMinutes() + this.BLOCK_DURATION_MINUTES,
      );
    }

    // Crear registro del intento fallido
    const failedAttempt = this.failedAttemptRepository.create({
      email,
      ipAddress,
      userAgent,
      reason,
      attemptCount: Math.max(emailAttemptCount, ipAttemptCount),
      blocked: shouldBlockEmail || shouldBlockIp,
      blockedUntil,
    });

    await this.failedAttemptRepository.save(failedAttempt);

    // Log del evento
    await this.authLogService.createLog({
      eventType: AuthEventType.FAILED_LOGIN,
      userEmail: email,
      success: false,
      errorMessage: reason,
      metadata: {
        emailAttempts: emailAttemptCount,
        ipAttempts: ipAttemptCount,
        blocked: shouldBlockEmail || shouldBlockIp,
        blockedUntil: blockedUntil?.toISOString(),
      },
      req,
    });

    if (shouldBlockEmail || shouldBlockIp) {
      this.logger.warn(
        `Security block activated for ${email} from IP ${ipAddress}. Attempts: ${Math.max(emailAttemptCount, ipAttemptCount)}`,
      );

      // Log de bloqueo
      await this.authLogService.createLog({
        eventType: AuthEventType.ACCOUNT_LOCKED,
        userEmail: email,
        success: false,
        errorMessage: `Account/IP blocked due to ${Math.max(emailAttemptCount, ipAttemptCount)} failed attempts`,
        metadata: {
          blockDurationMinutes: this.BLOCK_DURATION_MINUTES,
          blockedUntil: blockedUntil?.toISOString(),
        },
        req,
      });
    }
  }

  async clearFailedAttempts(email: string, ipAddress: string): Promise<void> {
    // Limpiar intentos fallidos del email
    await this.failedAttemptRepository.delete({
      email,
      createdAt: MoreThan(new Date(Date.now() - 60 * 60 * 1000)), // última hora
    });

    // Limpiar intentos fallidos de la IP
    await this.failedAttemptRepository.delete({
      ipAddress,
      createdAt: MoreThan(new Date(Date.now() - 60 * 60 * 1000)), // última hora
    });
  }

  async checkEmailBlocking(email: string): Promise<SecurityCheckResult> {
    const recentAttempts = await this.getRecentFailedAttempts(email, 'email');
    const currentAttempts = recentAttempts.length;

    if (currentAttempts >= this.MAX_FAILED_ATTEMPTS) {
      const lastAttempt = recentAttempts[0];
      if (
        lastAttempt.blocked &&
        lastAttempt.blockedUntil &&
        lastAttempt.blockedUntil > new Date()
      ) {
        return {
          allowed: false,
          reason:
            'Account temporarily blocked due to multiple failed login attempts',
          remainingAttempts: 0,
          retryAfter: lastAttempt.blockedUntil,
          blockDurationMinutes: Math.ceil(
            (lastAttempt.blockedUntil.getTime() - Date.now()) / (1000 * 60),
          ),
        };
      }
    }

    return {
      allowed: true,
      remainingAttempts: Math.max(
        0,
        this.MAX_FAILED_ATTEMPTS - currentAttempts,
      ),
    };
  }

  async checkIpBlocking(ipAddress: string): Promise<SecurityCheckResult> {
    const recentAttempts = await this.getRecentFailedAttempts(ipAddress, 'ip');
    const currentAttempts = recentAttempts.length;

    if (currentAttempts >= this.MAX_FAILED_ATTEMPTS) {
      const lastAttempt = recentAttempts[0];
      if (
        lastAttempt.blocked &&
        lastAttempt.blockedUntil &&
        lastAttempt.blockedUntil > new Date()
      ) {
        return {
          allowed: false,
          reason:
            'IP address temporarily blocked due to multiple failed login attempts',
          remainingAttempts: 0,
          retryAfter: lastAttempt.blockedUntil,
          blockDurationMinutes: Math.ceil(
            (lastAttempt.blockedUntil.getTime() - Date.now()) / (1000 * 60),
          ),
        };
      }
    }

    return {
      allowed: true,
      remainingAttempts: Math.max(
        0,
        this.MAX_FAILED_ATTEMPTS - currentAttempts,
      ),
    };
  }

  async checkRateLimit(ipAddress: string): Promise<SecurityCheckResult> {
    const windowStart = new Date();
    windowStart.setMinutes(
      windowStart.getMinutes() - this.RATE_LIMIT_WINDOW_MINUTES,
    );

    const recentRequests = await this.authLogService.getFailedLoginsByIp(
      ipAddress,
      this.RATE_LIMIT_WINDOW_MINUTES / 60,
    );

    if (recentRequests.length >= this.MAX_REQUESTS_PER_WINDOW) {
      const oldestRequest = recentRequests[recentRequests.length - 1];
      const retryAfter = new Date(oldestRequest.createdAt);
      retryAfter.setMinutes(
        retryAfter.getMinutes() + this.RATE_LIMIT_WINDOW_MINUTES,
      );

      return {
        allowed: false,
        reason: `Rate limit exceeded. Too many requests from IP address.`,
        retryAfter,
        blockDurationMinutes: Math.ceil(
          (retryAfter.getTime() - Date.now()) / (1000 * 60),
        ),
      };
    }

    return { allowed: true };
  }

  async detectSuspiciousActivity(ipAddress: string): Promise<{
    suspicious: boolean;
    indicators: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const indicators: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Verificar múltiples cuentas desde la misma IP
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentAttemptsFromIp = await this.failedAttemptRepository.find({
      where: {
        ipAddress,
        createdAt: MoreThan(last24Hours),
      },
    });

    const uniqueEmails = [
      ...new Set(recentAttemptsFromIp.map(attempt => attempt.email)),
    ];

    if (uniqueEmails.length >= 5) {
      indicators.push(
        `Multiple accounts targeted from same IP (${uniqueEmails.length} accounts)`,
      );
      riskLevel = 'high';
    } else if (uniqueEmails.length >= 3) {
      indicators.push(
        `Several accounts targeted from same IP (${uniqueEmails.length} accounts)`,
      );
      riskLevel = 'medium';
    }

    // Verificar velocidad de intentos
    if (recentAttemptsFromIp.length >= 20) {
      indicators.push(
        `High frequency login attempts (${recentAttemptsFromIp.length} in 24h)`,
      );
      riskLevel = 'high';
    } else if (recentAttemptsFromIp.length >= 10) {
      indicators.push(
        `Moderate frequency login attempts (${recentAttemptsFromIp.length} in 24h)`,
      );
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Verificar patrones de User-Agent
    const userAgents = [
      ...new Set(recentAttemptsFromIp.map(attempt => attempt.userAgent)),
    ];
    if (userAgents.length === 1 && recentAttemptsFromIp.length >= 5) {
      indicators.push('Consistent User-Agent suggests automated activity');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    return {
      suspicious: indicators.length > 0,
      indicators,
      riskLevel,
    };
  }

  async getSecurityReport(): Promise<any> {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const totalFailedAttempts = await this.failedAttemptRepository.count({
      where: { createdAt: MoreThan(last24Hours) },
    });

    const blockedAccounts = await this.failedAttemptRepository.count({
      where: {
        blocked: true,
        blockedUntil: MoreThan(new Date()),
      },
    });

    const uniqueTargetedEmails = await this.failedAttemptRepository
      .createQueryBuilder('attempt')
      .select('COUNT(DISTINCT attempt.email)', 'count')
      .where('attempt.createdAt > :since', { since: last24Hours })
      .getRawOne();

    const topTargetedEmails = await this.failedAttemptRepository
      .createQueryBuilder('attempt')
      .select(['attempt.email', 'COUNT(*) as attemptCount'])
      .where('attempt.createdAt > :since', { since: last24Hours })
      .groupBy('attempt.email')
      .orderBy('attemptCount', 'DESC')
      .limit(10)
      .getRawMany();

    const topAttackingIps = await this.failedAttemptRepository
      .createQueryBuilder('attempt')
      .select(['attempt.ipAddress', 'COUNT(*) as attemptCount'])
      .where('attempt.createdAt > :since', { since: last24Hours })
      .groupBy('attempt.ipAddress')
      .orderBy('attemptCount', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      period: 'Last 24 hours',
      totalFailedAttempts,
      currentlyBlockedAccounts: blockedAccounts,
      uniqueTargetedEmails: parseInt(uniqueTargetedEmails.count) || 0,
      topTargetedEmails: topTargetedEmails.map(item => ({
        email: item.attempt_email,
        attempts: parseInt(item.attemptCount),
      })),
      topAttackingIps: topAttackingIps.map(item => ({
        ipAddress: item.attempt_ipAddress,
        attempts: parseInt(item.attemptCount),
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async cleanOldFailedAttempts(days: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.failedAttemptRepository.delete({
      createdAt: MoreThan(cutoff),
      blocked: false,
    });

    return result.affected || 0;
  }

  private async getRecentFailedAttempts(
    identifier: string,
    type: 'email' | 'ip',
  ): Promise<FailedLoginAttempt[]> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const whereCondition =
      type === 'email' ? { email: identifier } : { ipAddress: identifier };

    return this.failedAttemptRepository.find({
      where: {
        ...whereCondition,
        createdAt: MoreThan(oneHourAgo),
      },
      order: { createdAt: 'DESC' },
    });
  }
}
