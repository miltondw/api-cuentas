import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}  // Add validateUser method that's required by the JWT strategy
  async validateUser(email: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        console.error(`User with email ${email} not found in database`);
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      console.error(`Database error validating user ${email}:`, error.message);
      return null;
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    } // Generar token JWT
    const payload = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    console.log('Login payload:', JSON.stringify(payload));
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
  async register(registerDto: RegisterDto) {
    const { email, password, name, firstName, lastName, role, jwt2 } =
      registerDto;

    // Construct the full name from firstName + lastName or use name directly
    const fullName =
      name ||
      (firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || lastName || 'User');
    // Determine the role - default to USUARIO
    const userRole = role || UserRole.CLIENT;

    // Validate admin registration
    if (userRole === UserRole.ADMIN) {
      if (!jwt2 || jwt2 !== process.env.JWT_SECRET_2) {
        throw new ForbiddenException(
          'Código de autorización inválido para crear cuenta de administrador',
        );
      }
    }

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12); // Crear nuevo usuario
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name: fullName,
      role: userRole,
    });

    const savedUser = await this.userRepository.save(user); // Generar token JWT
    const payload = {
      sub: savedUser.id,
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
      },
    };
  }
}
