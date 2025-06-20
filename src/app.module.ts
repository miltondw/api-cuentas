import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler'; // Re-enabled with proper configuration
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { AppController } from './app.controller';
import { SimpleRootController } from './simple-root.controller';

// Modules
import { AuthModule } from './modules/auth/auth.module';
//ADMIN
import { AdminModule } from './modules/admin/admin.module';
//LAB
import { LabModule } from './modules/lab/lab.module';
import { ApiquesModule } from './modules/lab/apiques/apiques.module';
import { ProfilesModule } from './modules/lab/profiles/profiles.module';
//PROJECTS
import { ProjectsModule } from './modules/projects/projects.module';
import { ProjectManagementModule } from './modules/projects/project-management/project-management.module';
import { ResumenModule } from './modules/projects/resumen/resumen.module';
import { FinancialModule } from './modules/projects/financial/financial.module';
//CLIENT
import { ClientModule } from './modules/client/client.module';
//PDF
import { PDFModule } from './modules/pdf/pdf.module';
//SERVICES
import { ServicesModule } from './modules/services/services.module';
//HEALTH - Handled by SimpleRootController
// import { HealthModule } from './modules/health/health.module';

@Module({
  controllers: [AppController, SimpleRootController],
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(), // Database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST') || 'localhost',
        port: parseInt(configService.get('DB_PORT') || '3306'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
        synchronize: false, // Disabled to prevent issues with existing database
        logging: configService.get('NODE_ENV') === 'development',
        timezone: 'Z',
        charset: 'utf8mb4',
        ssl:
          configService.get('NODE_ENV') === 'production'
            ? {
                rejectUnauthorized: false,
              }
            : false,
      }),
      inject: [ConfigService],
    }),

    // Rate limiting with smart IP detection
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const trustProxy = configService.get('TRUST_PROXY') === 'true';

        return {
          throttlers: [
            {
              ttl: parseInt(
                configService.get('RATE_LIMIT_WINDOW_MS') || '900000',
              ), // 15 minutes
              limit: parseInt(
                configService.get('RATE_LIMIT_MAX_REQUESTS') || '100',
              ),
            },
          ],
          skipIf: () => false,
          // Función inteligente para obtener la IP basada en trust proxy
          getTracker: req => {
            // Si trust proxy está deshabilitado, usar la IP directa
            if (!trustProxy) {
              return (
                req.ip ||
                req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                'localhost'
              );
            }

            // Con trust proxy habilitado, usar headers de proxy
            const forwarded = req.headers['x-forwarded-for'];
            const realIp = req.headers['x-real-ip'];
            const cfConnectingIp = req.headers['cf-connecting-ip'];

            if (cfConnectingIp) return cfConnectingIp as string;
            if (realIp) return realIp as string;
            if (forwarded) {
              const ips = (forwarded as string).split(',');
              return ips[0].trim();
            }
            return req.ip || req.connection?.remoteAddress || 'unknown';
          },
        };
      },
      inject: [ConfigService],
    }), // Feature modules
    AuthModule,
    AdminModule,
    LabModule,
    ProjectManagementModule,
    ClientModule,
    PDFModule,
    ServicesModule,
    // HealthModule, // Removed - handled by SimpleRootController
    ResumenModule,
    ApiquesModule,
    ProfilesModule,
    ProjectsModule,
    FinancialModule,
  ],
})
export class AppModule {}
