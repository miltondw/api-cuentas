import { AuthLogService } from '@/modules/auth/services/auth-log.service';
import { SecurityService } from '@/modules/auth/services/security.service';
import { SessionService } from '@/modules/auth/services/session.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly authLogService: AuthLogService,
    private readonly sessionService: SessionService,
    private readonly securityService: SecurityService,
  ) {}

  // Ejecutar limpieza diaria a las 2:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyCleanup() {
    this.logger.log('🧹 Iniciando limpieza diaria de datos...');

    try {
      // Limpiar sesiones expiradas
      const expiredSessions = await this.sessionService.revokeExpiredSessions();
      this.logger.log(`✅ Sesiones expiradas revocadas: ${expiredSessions}`);

      // Limpiar logs antiguos (más de 90 días)
      const oldLogs = await this.authLogService.cleanOldLogs(90);
      this.logger.log(`✅ Logs antiguos eliminados: ${oldLogs}`);

      // Limpiar sesiones antiguas (más de 30 días)
      const oldSessions = await this.sessionService.cleanOldSessions(30);
      this.logger.log(`✅ Sesiones antiguas eliminadas: ${oldSessions}`);

      // Limpiar intentos fallidos antiguos (más de 30 días)
      const oldFailedAttempts =
        await this.securityService.cleanOldFailedAttempts(30);
      this.logger.log(
        `✅ Intentos fallidos antiguos eliminados: ${oldFailedAttempts}`,
      );

      this.logger.log('🎉 Limpieza diaria completada exitosamente');
    } catch (error) {
      this.logger.error('❌ Error durante la limpieza diaria:', error);
    }
  }

  // Ejecutar limpieza de sesiones expiradas cada hora
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySessionCleanup() {
    try {
      const expiredSessions = await this.sessionService.revokeExpiredSessions();
      if (expiredSessions > 0) {
        this.logger.log(
          `🕐 Limpieza horaria: ${expiredSessions} sesiones expiradas revocadas`,
        );
      }
    } catch (error) {
      this.logger.error(
        '❌ Error durante limpieza horaria de sesiones:',
        error,
      );
    }
  }

  // Ejecutar limpieza semanal profunda los domingos a las 3:00 AM
  @Cron('0 3 * * 0') // Domingos a las 3:00 AM
  async handleWeeklyDeepCleanup() {
    this.logger.log('🔄 Iniciando limpieza semanal profunda...');

    try {
      // Limpiar logs muy antiguos (más de 180 días)
      const veryOldLogs = await this.authLogService.cleanOldLogs(180);
      this.logger.log(`✅ Logs muy antiguos eliminados: ${veryOldLogs}`);

      // Limpiar sesiones muy antiguas (más de 60 días)
      const veryOldSessions = await this.sessionService.cleanOldSessions(60);
      this.logger.log(
        `✅ Sesiones muy antiguas eliminadas: ${veryOldSessions}`,
      );

      // Limpiar intentos fallidos muy antiguos (más de 60 días)
      const veryOldFailedAttempts =
        await this.securityService.cleanOldFailedAttempts(60);
      this.logger.log(
        `✅ Intentos fallidos muy antiguos eliminados: ${veryOldFailedAttempts}`,
      );

      this.logger.log('🎉 Limpieza semanal profunda completada');
    } catch (error) {
      this.logger.error('❌ Error durante limpieza semanal:', error);
    }
  }

  // Método manual para limpieza on-demand
  async performManualCleanup(days: number = 30): Promise<{
    authLogsDeleted: number;
    sessionsDeleted: number;
    failedAttemptsDeleted: number;
    expiredSessionsRevoked: number;
  }> {
    this.logger.log(`🧹 Iniciando limpieza manual (${days} días)...`);

    const authLogsDeleted = await this.authLogService.cleanOldLogs(days);
    const sessionsDeleted = await this.sessionService.cleanOldSessions(days);
    const failedAttemptsDeleted =
      await this.securityService.cleanOldFailedAttempts(days);
    const expiredSessionsRevoked =
      await this.sessionService.revokeExpiredSessions();

    const result = {
      authLogsDeleted,
      sessionsDeleted,
      failedAttemptsDeleted,
      expiredSessionsRevoked,
    };

    this.logger.log('✅ Limpieza manual completada:', result);
    return result;
  }

  // Obtener estadísticas de limpieza
  async getCleanupStats(): Promise<{
    totalActiveSessions: number;
    totalAuthLogs: number;
    totalFailedAttempts: number;
    lastCleanupInfo: string;
  }> {
    try {
      // Obtener estadísticas generales
      const sessionStats = await this.sessionService.getSessionStats();
      const loginStats = await this.authLogService.getLoginStats(30);
      const securityStats = await this.securityService.getSecurityReport();

      return {
        totalActiveSessions: sessionStats.activeSessions,
        totalAuthLogs: loginStats.successfulLogins + loginStats.failedLogins,
        totalFailedAttempts: securityStats.totalFailedAttempts,
        lastCleanupInfo: 'Datos de los últimos 30 días',
      };
    } catch (error) {
      this.logger.error('❌ Error obteniendo estadísticas de limpieza:', error);
      throw error;
    }
  }
}
