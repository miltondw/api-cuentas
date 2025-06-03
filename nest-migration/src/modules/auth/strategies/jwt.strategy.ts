import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtSecret = configService.get('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }
  async validate(payload: any) {
    try {
      // For debugging
      /*    console.log('JWT payload:', JSON.stringify(payload));
      
      if (!payload.email) {
        console.error('JWT payload missing email field');
        return null;
      } */

      // Use email from payload instead of sub for user lookup
      const user = await this.authService.validateUser(payload.email);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      console.error('JWT validation error:', error.message);
      return null; // This will trigger unauthorized response
    }
  }
}
