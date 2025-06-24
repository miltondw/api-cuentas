import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@/modules/auth/auth.service';
import { SessionService } from '@/modules/auth/services/session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private sessionService: SessionService,
  ) {
    const jwtSecret = configService.get('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true, // Para obtener el token completo
    });
  }
  async validate(req: any, payload: any) {
    try {
      console.log('=== JWT VALIDATION START ===');
      console.log('JWT payload received:', JSON.stringify(payload, null, 2));

      if (!payload.email) {
        console.error('JWT payload missing email field');
        console.log('Available payload fields:', Object.keys(payload));
        return null;
      }

      // Extraer el token del header
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        console.error('No token found in request header');
        return null;
      }

      // Verificar si el token ha sido revocado
      const isRevoked = await this.sessionService.isTokenRevoked(token);
      if (isRevoked) {
        console.error('Token has been revoked');
        return null;
      }

      console.log(`Validating user with email: ${payload.email}`);
      const user = await this.authService.validateUser(payload.email);

      if (!user) {
        console.error(
          'User validation returned null for email:',
          payload.email,
        );
        return null;
      }

      console.log(
        'JWT validation successful for user:',
        user.email,
        'with role:',
        user.role,
      );
      console.log('=== JWT VALIDATION END ===');

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      console.error('JWT validation error:', error.message);
      console.error('Error stack:', error.stack);
      return null;
    }
  }
}
