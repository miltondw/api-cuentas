# Buenas Prácticas - API Cuentas Ingeocimyc

## 📋 Índice

1. [Estructura de Código](#estructura-de-código)
2. [Naming Conventions](#naming-conventions)
3. [Arquitectura y Diseño](#arquitectura-y-diseño)
4. [Seguridad](#seguridad)
5. [Base de Datos](#base-de-datos)
6. [API Design](#api-design)
7. [Testing](#testing)
8. [Performance](#performance)
9. [Logging y Monitoreo](#logging-y-monitoreo)
10. [Deployment](#deployment)

---

## 🏗️ Estructura de Código

### Organización de Módulos

```typescript
// ✅ CORRECTO - Estructura modular clara
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   ├── entities/
│   │   └── guards/
│   └── ...
```

### Separación de Responsabilidades

```typescript
// ✅ CORRECTO - Cada clase tiene una responsabilidad
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}

@Injectable()
export class AuthService {
  // Lógica de negocio aquí
}
```

### Imports Organizados

```typescript
// ✅ CORRECTO - Imports organizados por categorías
// Core imports
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Third party imports
import * as bcrypt from 'bcryptjs';

// Local imports
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
```

---

## 📝 Naming Conventions

### Archivos y Carpetas

```bash
# ✅ CORRECTO - Kebab-case para archivos
auth.controller.ts
user.entity.ts
login.dto.ts
jwt-auth.guard.ts

# ✅ CORRECTO - Camel-case para carpetas
serviceRequests/
projectManagement/
```

### Variables y Funciones

```typescript
// ✅ CORRECTO - CamelCase descriptivo
const userAuthToken = 'abc123';
const isUserAuthenticated = true;

async function authenticateUser(credentials: LoginDto): Promise<User> {
  // Implementation
}

// ✅ CORRECTO - Nombres de clases PascalCase
export class AuthController {}
export class UserService {}
```

### Constantes y Enums

```typescript
// ✅ CORRECTO - SCREAMING_SNAKE_CASE para constantes
export const JWT_SECRET_KEY = 'your-secret-key';
export const DEFAULT_PAGE_SIZE = 10;

// ✅ CORRECTO - PascalCase para enums
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  CLIENT = 'client',
}
```

---

## 🏛️ Arquitectura y Diseño

### Dependency Injection

```typescript
// ✅ CORRECTO - DI apropiada
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly userService: UserService,
    private readonly pdfService: PdfService,
  ) {}
}
```

### DTOs para Validación

```typescript
// ✅ CORRECTO - DTO con validaciones
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @IsDateString()
  startDate: string;
}
```

### Interfaces para Contratos

```typescript
// ✅ CORRECTO - Interfaces para definir contratos
export interface IAuthService {
  login(credentials: LoginDto): Promise<AuthResponse>;
  validateToken(token: string): Promise<User>;
  logout(userId: string): Promise<void>;
}

@Injectable()
export class AuthService implements IAuthService {
  // Implementation
}
```

### Exception Handling

```typescript
// ✅ CORRECTO - Excepciones específicas
@Injectable()
export class AuthService {
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }
}
```

---

## 🔐 Seguridad

### Autenticación JWT

```typescript
// ✅ CORRECTO - JWT con expiración
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Importante: no ignorar expiración
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }
}
```

### Validación de Entrada

```typescript
// ✅ CORRECTO - Validación estricta
@Post('create')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
async createProject(@Body() createProjectDto: CreateProjectDto) {
  return this.projectService.create(createProjectDto);
}
```

### Rate Limiting

```typescript
// ✅ CORRECTO - Rate limiting por endpoint
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Post('login')
  @Throttle(5, 60) // 5 intentos por minuto
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

### Sanitización de Datos

```typescript
// ✅ CORRECTO - Sanitización de entrada
export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @Length(2, 50)
  firstName: string;
}
```

---

## 🗄️ Base de Datos

### Entidades Bien Definidas

```typescript
// ✅ CORRECTO - Entidad completa con relaciones
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // No incluir en selects por defecto
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Project, project => project.owner)
  projects: Project[];
}
```

### Migraciones

```typescript
// ✅ CORRECTO - Migraciones con rollback
export class CreateUserTable1700000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          // ... más columnas
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### Índices para Performance

```typescript
// ✅ CORRECTO - Índices en campos consultados frecuentemente
@Entity('projects')
@Index(['status', 'createdAt'])
@Index(['ownerId'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index() // Índice individual si se consulta solo
  status: string;
}
```

---

## 🌐 API Design

### Endpoints RESTful

```typescript
// ✅ CORRECTO - Endpoints REST consistentes
@Controller('projects')
export class ProjectsController {
  @Get() // GET /projects
  findAll(@Query() query: QueryDto) {}

  @Get(':id') // GET /projects/:id
  findOne(@Param('id') id: string) {}

  @Post() // POST /projects
  create(@Body() dto: CreateProjectDto) {}

  @Put(':id') // PUT /projects/:id
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {}

  @Delete(':id') // DELETE /projects/:id
  remove(@Param('id') id: string) {}
}
```

### Códigos de Estado HTTP

```typescript
// ✅ CORRECTO - Códigos de estado apropiados
@Post()
@HttpCode(HttpStatus.CREATED)
async create(@Body() dto: CreateProjectDto) {
  return this.projectService.create(dto);
}

@Get(':id')
async findOne(@Param('id') id: string) {
  const project = await this.projectService.findOne(id);
  if (!project) {
    throw new NotFoundException(`Project with ID ${id} not found`);
  }
  return project;
}
```

### Paginación Consistente

```typescript
// ✅ CORRECTO - Paginación estándar
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// Respuesta de paginación
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 🧪 Testing

### Estructura de Tests

```typescript
// ✅ CORRECTO - Tests bien estructurados
describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('should return auth response for valid credentials', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: expect.objectContaining({ id: '1' }),
      });
    });
  });
});
```

### Mocking Apropiado

```typescript
// ✅ CORRECTO - Mocks realistas
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
};

// ✅ CORRECTO - Spy en métodos específicos
jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
```

---

## ⚡ Performance

### Query Optimization

```typescript
// ✅ CORRECTO - Joins eficientes
async findProjectsWithOwner(): Promise<Project[]> {
  return this.projectRepository.find({
    relations: ['owner'],
    select: {
      id: true,
      name: true,
      status: true,
      owner: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  });
}
```

### Caching Estratégico

```typescript
// ✅ CORRECTO - Cache en datos que no cambian frecuentemente
@Controller('services')
export class ServicesController {
  @Get()
  @CacheInterceptor()
  @CacheTTL(300) // 5 minutos
  async findAll() {
    return this.servicesService.findAll();
  }
}
```

### Lazy Loading

```typescript
// ✅ CORRECTO - Lazy loading para relaciones grandes
@Entity('projects')
export class Project {
  @OneToMany(() => Task, task => task.project, { lazy: true })
  tasks: Promise<Task[]>;
}
```

---

## 📊 Logging y Monitoreo

### Logging Estructurado

```typescript
// ✅ CORRECTO - Logs estructurados con contexto
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    try {
      const user = await this.userService.findByEmail(loginDto.email);

      if (!user) {
        this.logger.warn(`Login failed - user not found: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log(`Login successful for user: ${user.id}`);
      return this.generateAuthResponse(user);
    } catch (error) {
      this.logger.error(`Login error for ${loginDto.email}:`, error.stack);
      throw error;
    }
  }
}
```

### Health Checks

```typescript
// ✅ CORRECTO - Health checks completos
@Controller('health')
export class HealthController {
  constructor(
    private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async checkHealth() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: checks.map((check, index) => ({
        name: ['database', 'memory', 'disk'][index],
        status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        details: check.status === 'fulfilled' ? check.value : check.reason,
      })),
    };
  }
}
```

---

## 🚀 Deployment

### Variables de Entorno

```typescript
// ✅ CORRECTO - Validación de variables de entorno
export class ConfigValidation {
  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsNumberString()
  DB_PORT: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsEnum(['development', 'production', 'test'])
  NODE_ENV: string;
}
```

### Docker Multi-stage

```dockerfile
# ✅ CORRECTO - Multi-stage build
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 5051
CMD ["node", "dist/main.js"]
```

### Process Management

```typescript
// ✅ CORRECTO - Graceful shutdown
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  await app.listen(process.env.PORT || 5051);
}
```

---

## 🔍 Code Review Checklist

### Antes de Commit

- [ ] Código sigue naming conventions
- [ ] DTOs tienen validaciones apropiadas
- [ ] Endpoints tienen códigos de estado correctos
- [ ] Errores son manejados apropiadamente
- [ ] Tests están incluidos y pasan
- [ ] No hay secrets hardcodeados
- [ ] Logging es apropiado
- [ ] Performance fue considerada

### Antes de Deploy

- [ ] Variables de entorno están configuradas
- [ ] Migraciones están probadas
- [ ] Health checks funcionan
- [ ] Monitoring está configurado
- [ ] Rollback plan está preparado
- [ ] Documentation está actualizada

---

## 📚 Recursos Adicionales

### Documentation

- [NestJS Best Practices](https://docs.nestjs.com/)
- [TypeScript Style Guide](https://typescript-eslint.io/rules/)
- [REST API Design Best Practices](https://restfulapi.net/)

### Tools

- **ESLint + Prettier** - Code formatting
- **Husky** - Git hooks
- **Jest** - Testing framework
- **Swagger** - API documentation

---

_Estas buenas prácticas deben ser seguidas consistentemente por todo el equipo para mantener la calidad y mantenibilidad del código._
