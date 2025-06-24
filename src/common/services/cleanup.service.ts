import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity';
import { AuthLog } from '@modules/auth/entities/auth-log.entity';
import { FailedLoginAttempt } from '@modules/auth/entities/failed-login-attempt.entity';
import { UserSession } from '@modules/auth/entities/user-session.entity';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(AuthLog)
    private authLogRepository: Repository<AuthLog>,
    @InjectRepository(FailedLoginAttempt)
    private failedLoginRepository: Repository<FailedLoginAttempt>,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens() {
    try {
      this.logger.log('🧹 Iniciando limpieza de tokens expirados...');

      const result = await this.refreshTokenRepository.delete({
        expiresAt: LessThan(new Date()),
      });

      this.logger.log(`✅ Tokens expirados eliminados: ${result.affected}`);
    } catch (error) {
      this.logger.error('❌ Error al limpiar tokens expirados:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldAuthLogs() {
    try {
      this.logger.log('🧹 Iniciando limpieza de logs antiguos...');

      // Mantener logs por 90 días
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const result = await this.authLogRepository.delete({
        createdAt: LessThan(cutoffDate),
      });

      this.logger.log(`✅ Logs antiguos eliminados: ${result.affected}`);
    } catch (error) {
      this.logger.error('❌ Error al limpiar logs antiguos:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupOldFailedAttempts() {
    try {
      this.logger.log('🧹 Iniciando limpieza de intentos fallidos antiguos...');

      // Mantener intentos fallidos por 30 días
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const result = await this.failedLoginRepository.delete({
        createdAt: LessThan(cutoffDate),
      });

      this.logger.log(`✅ Intentos fallidos eliminados: ${result.affected}`);
    } catch (error) {
      this.logger.error('❌ Error al limpiar intentos fallidos:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupInactiveSessions() {
    try {
      this.logger.log('🧹 Iniciando limpieza de sesiones inactivas...');

      // Marcar sesiones como inactivas si la última actividad fue hace más de 24 horas
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);

      const result = await this.userSessionRepository.update(
        {
          isActive: true,
          lastActivity: LessThan(cutoffDate),
        },
        {
          isActive: false,
        },
      );

      this.logger.log(`✅ Sesiones marcadas inactivas: ${result.affected}`);
    } catch (error) {
      this.logger.error('❌ Error al limpiar sesiones inactivas:', error);
    }
  }

  @Cron('0 0 1 * *') // Primer día de cada mes
  async generateCleanupReport() {
    try {
      this.logger.log('📊 Generando reporte mensual...');

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        activeTokens,
        totalAuthLogs,
        recentFailedAttempts,
        activeSessions,
      ] = await Promise.all([
        this.refreshTokenRepository.count({
          where: { isRevoked: false },
        }),
        this.authLogRepository.count({
          where: {
            createdAt: LessThan(thisMonth),
          },
        }),
        this.failedLoginRepository.count({
          where: {
            createdAt: LessThan(thisMonth),
          },
        }),
        this.userSessionRepository.count({
          where: { isActive: true },
        }),
      ]);

      this.logger.log(`📊 Reporte mensual:
        - Tokens activos: ${activeTokens}
        - Logs antiguos: ${totalAuthLogs}
        - Intentos fallidos antiguos: ${recentFailedAttempts}
        - Sesiones activas: ${activeSessions}
      `);
    } catch (error) {
      this.logger.error('❌ Error al generar reporte:', error);
    }
  }

  async performFullCleanup(): Promise<{
    expiredTokens: number;
    oldLogs: number;
    oldAttempts: number;
    inactiveSessions: number;
  }> {
    const results = {
      expiredTokens: 0,
      oldLogs: 0,
      oldAttempts: 0,
      inactiveSessions: 0,
    };

    try {
      // Limpieza de tokens expirados
      const expiredTokensResult = await this.refreshTokenRepository.delete({
        expiresAt: LessThan(new Date()),
      });
      results.expiredTokens = expiredTokensResult.affected || 0;

      // Limpieza de logs antiguos (90+ días)
      const cutoffDate90 = new Date();
      cutoffDate90.setDate(cutoffDate90.getDate() - 90);
      const oldLogsResult = await this.authLogRepository.delete({
        createdAt: LessThan(cutoffDate90),
      });
      results.oldLogs = oldLogsResult.affected || 0;

      // Limpieza de intentos fallidos (30+ días)
      const cutoffDate30 = new Date();
      cutoffDate30.setDate(cutoffDate30.getDate() - 30);
      const oldAttemptsResult = await this.failedLoginRepository.delete({
        createdAt: LessThan(cutoffDate30),
      });
      results.oldAttempts = oldAttemptsResult.affected || 0;

      // Limpieza de sesiones inactivas (24+ horas)
      const cutoffDate24 = new Date();
      cutoffDate24.setHours(cutoffDate24.getHours() - 24);
      const inactiveSessionsResult = await this.userSessionRepository.update(
        {
          isActive: true,
          lastActivity: LessThan(cutoffDate24),
        },
        {
          isActive: false,
        },
      );
      results.inactiveSessions = inactiveSessionsResult.affected || 0;

      this.logger.log('✅ Limpieza completa realizada:', results);
      return results;
    } catch (error) {
      this.logger.error('❌ Error en limpieza completa:', error);
      throw error;
    }
  }
}
