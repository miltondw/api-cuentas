import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { AuthLog } from './entities/auth-log.entity';
import { UserSession } from './entities/user-session.entity';
import { FailedLoginAttempt } from './entities/failed-login-attempt.entity';
import { AuthLogService } from './services/auth-log.service';
import { SessionService } from './services/session.service';
import { SecurityService } from './services/security.service';
import { CleanupService } from '../../common/services/cleanup.service'; // Temporarily disabled due to path alias issues
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthLog, UserSession, FailedLoginAttempt]),
    PassportModule,
    CacheModule.register({
      ttl: 300, // 5 minutes default
      max: 1000, // maximum number of items in cache
    }),
    EventEmitterModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN') || '24h',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthLogService,
    SessionService,
    SecurityService,
    CleanupService, // Temporarily disabled due to path alias issues
    JwtStrategy,
  ],
  exports: [
    AuthService,
    AuthLogService,
    SessionService,
    SecurityService,
    CleanupService, // Temporarily disabled due to path alias issues
  ],
})
export class AuthModule {}
