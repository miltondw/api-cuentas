import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { User } from '@/modules/auth/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async createRefreshToken(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    // Revoke existing tokens for the user (optional: limit concurrent sessions)
    await this.revokeUserTokens(user.id);

    // Generate secure random token
    const token = crypto.randomBytes(64).toString('hex');

    // Set expiration (30 days default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Save to database
    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId: user.id,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await this.refreshTokenRepository.save(refreshToken);
    return token;
  }

  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: {
        token,
        isRevoked: false,
      },
      relations: ['user'],
    });

    if (!refreshToken) {
      return null;
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
      await this.revokeToken(token);
      return null;
    }

    return refreshToken;
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    newRefreshToken: string;
  } | null> {
    const tokenEntity = await this.validateRefreshToken(refreshToken);

    if (!tokenEntity || !tokenEntity.user.is_active) {
      return null;
    }

    // Generate new access token
    const payload = {
      sub: tokenEntity.user.id,
      email: tokenEntity.user.email,
      role: tokenEntity.user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    // Generate new refresh token (rotation)
    const newRefreshToken = await this.createRefreshToken(
      tokenEntity.user,
      tokenEntity.ipAddress,
      tokenEntity.userAgent,
    );

    // Revoke old refresh token
    await this.revokeToken(refreshToken);

    return {
      accessToken,
      newRefreshToken,
    };
  }

  async revokeToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update({ token }, { isRevoked: true });
  }

  async revokeUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update({ userId }, { isRevoked: true });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async getUserActiveSessions(userId: number): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
