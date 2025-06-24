import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { User } from '@/modules/auth/entities/user.entity';
import { AuthLog } from '@/modules/auth/entities/auth-log.entity';
import { UserSession } from '@/modules/auth/entities/user-session.entity';
import { FailedLoginAttempt } from '@/modules/auth/entities/failed-login-attempt.entity';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { AuthLogService } from '@/modules/auth/services/auth-log.service';
import { SessionService } from '@/modules/auth/services/session.service';
import { SecurityService } from '@/modules/auth/services/security.service';
import { RefreshTokenService } from '@/modules/auth/services/refresh-token.service';
import { CleanupService } from '@/common/services/cleanup.service';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AuthLog,
      UserSession,
      FailedLoginAttempt,
      RefreshToken, // Now enabled after migration
    ]),
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
    RefreshTokenService,
    CleanupService,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    AuthLogService,
    SessionService,
    SecurityService,
    RefreshTokenService,
    CleanupService,
  ],
})
export class AuthModule {}
