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
  }  async validate(payload: any) {
    try {
      console.log('JWT validation - email:', payload.email);
      
      if (!payload.email) {
        console.error('JWT payload missing email field');
        return null;
      }

      const user = await this.authService.validateUser(payload.email);
      
      if (!user) {
        console.error('User validation returned null');
        return null;
      }
      
      console.log('JWT validation successful for user:', user.email);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      console.error('JWT validation error:', error.message);
      return null;
    }
  }
}
