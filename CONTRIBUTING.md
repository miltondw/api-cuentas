# Contributing to API Cuentas Ingeocimyc

## 🎯 Bienvenido

¡Gracias por tu interés en contribuir al proyecto API Cuentas de Ingeocimyc! Este documento te guiará a través del proceso de contribución.

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [¿Cómo Contribuir?](#cómo-contribuir)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Proceso de Desarrollo](#proceso-de-desarrollo)
5. [Estándares de Código](#estándares-de-código)
6. [Testing](#testing)
7. [Pull Requests](#pull-requests)
8. [Reportar Issues](#reportar-issues)

## 🤝 Código de Conducta

Este proyecto adhiere a un código de conducta. Al participar, se espera que mantengas este código. Por favor reporta comportamientos inaceptables al equipo de desarrollo.

### Nuestros Estándares

**Comportamientos que contribuyen a un ambiente positivo:**

- Usar lenguaje acogedor e inclusivo
- Respetar diferentes puntos de vista y experiencias
- Aceptar crítica constructiva de manera elegante
- Enfocarse en lo que es mejor para la comunidad
- Mostrar empatía hacia otros miembros de la comunidad

**Comportamientos inaceptables:**

- Uso de lenguaje o imágenes sexualizadas
- Trolling, comentarios insultantes/despectivos, y ataques personales o políticos
- Acoso público o privado
- Publicar información privada de otros, como direcciones físicas o electrónicas, sin permiso explícito

## 🚀 ¿Cómo Contribuir?

### Tipos de Contribución

1. **Reportar Bugs** - Ayuda a identificar y documentar problemas
2. **Sugerir Mejoras** - Propón nuevas funcionalidades
3. **Escribir Código** - Implementa fixes o nuevas features
4. **Mejorar Documentación** - Ayuda a mantener la documentación actualizada
5. **Testing** - Escribe o mejora tests existentes

### Proceso General

1. **Fork** el repositorio
2. **Crea** una branch para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la branch (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

## 🛠️ Configuración del Entorno

### Prerrequisitos

- Node.js >= 18.x
- npm >= 8.x
- MySQL >= 8.x
- Git

### Setup Inicial

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/ingeocimyc/api-cuentas.git
   cd api-cuentas
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   # Edita .env con tus configuraciones locales
   ```

4. **Configurar base de datos**

   ```bash
   # Crear base de datos
   mysql -u root -p -e "CREATE DATABASE api_cuentas_dev;"

   # Ejecutar migraciones
   npm run typeorm:migration:run
   ```

5. **Verificar instalación**
   ```bash
   npm run start:dev
   # La API debería estar corriendo en http://localhost:5051
   ```

## 🔄 Proceso de Desarrollo

### Branch Strategy

Usamos **Git Flow** simplificado:

- `main` - Rama de producción, siempre estable
- `develop` - Rama de desarrollo, integración de features
- `feature/*` - Ramas para nuevas funcionalidades
- `bugfix/*` - Ramas para corrección de bugs
- `hotfix/*` - Ramas para fixes urgentes en producción

### Convenciones de Naming

#### Branches

```bash
feature/auth-jwt-refresh
bugfix/user-login-validation
hotfix/security-vulnerability
docs/api-documentation-update
```

#### Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(auth): add JWT refresh token functionality
fix(projects): resolve validation error on project creation
docs(api): update authentication endpoints documentation
test(lab): add unit tests for sample service
refactor(pdf): optimize PDF generation performance
style(eslint): fix linting issues in auth module
```

### Workflow de Desarrollo

1. **Sincronizar con develop**

   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Crear feature branch**

   ```bash
   git checkout -b feature/nombre-de-tu-feature
   ```

3. **Desarrollar feature**

   - Escribir código siguiendo estándares
   - Escribir/actualizar tests
   - Actualizar documentación si es necesario

4. **Commit changes**

   ```bash
   git add .
   git commit -m "feat(module): description of feature"
   ```

5. **Push y crear PR**
   ```bash
   git push origin feature/nombre-de-tu-feature
   # Crear Pull Request desde GitHub
   ```

## 📝 Estándares de Código

### TypeScript/JavaScript

- **Linting:** ESLint con config de NestJS
- **Formatting:** Prettier
- **Style Guide:** Seguir [BEST_PRACTICES.md](./docs/BEST_PRACTICES.md)

### Convenciones de Nombres

```typescript
// ✅ Correcto
// Clases: PascalCase
export class UserService {}
export class AuthController {}

// Variables y funciones: camelCase
const userName = 'john';
async function validateUser() {}

// Constantes: SCREAMING_SNAKE_CASE
const JWT_SECRET_KEY = 'secret';
const DEFAULT_PAGE_SIZE = 10;

// Archivos: kebab-case
user.service.ts;
auth.controller.ts;
jwt - auth.guard.ts;
```

### Estructura de Archivos

```typescript
// ✅ Estructura recomendada para un controlador
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll() {
    return this.userService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
```

## 🧪 Testing

### Estrategia de Testing

1. **Unit Tests** - Servicios individuales
2. **Integration Tests** - Controladores con dependencias
3. **E2E Tests** - Flujos completos de usuario

### Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con coverage
npm run test:cov

# Tests en watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

### Escribir Tests

```typescript
// ✅ Ejemplo de unit test
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ id: '1', email: 'test@test.com' }];
      jest.spyOn(repository, 'find').mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(repository.find).toHaveBeenCalled();
    });
  });
});
```

### Coverage Requirements

- **Branches:** Mínimo 70%
- **Functions:** Mínimo 70%
- **Lines:** Mínimo 70%
- **Statements:** Mínimo 70%

## 📥 Pull Requests

### Checklist de PR

Antes de crear un PR, asegúrate de que:

- [ ] **Tests pasan:** `npm test` sin errores
- [ ] **Linting pasa:** `npm run lint` sin errores
- [ ] **Build funciona:** `npm run build` exitoso
- [ ] **Documentación actualizada:** Si es necesario
- [ ] **Commits son descriptivos:** Siguen convenciones
- [ ] **Branch está actualizada:** Con la rama base
- [ ] **Sin conflictos:** PR puede ser merged cleanly

### Template de PR

```markdown
## Descripción

Breve descripción de los cambios realizados.

## Tipo de Cambio

- [ ] Bug fix (non-breaking change que soluciona un issue)
- [ ] Nueva feature (non-breaking change que agrega funcionalidad)
- [ ] Breaking change (fix o feature que causaría que funcionalidad existente no funcione como se esperaba)
- [ ] Cambio de documentación

## ¿Cómo ha sido probado?

Describe las pruebas que ejecutaste para verificar tus cambios.

## Screenshots (si aplica)

Agrega screenshots para ayudar a explicar tu cambio.

## Checklist

- [ ] Mi código sigue el style guide del proyecto
- [ ] He realizado una self-review de mi código
- [ ] He comentado mi código, particularmente en áreas difíciles de entender
- [ ] He hecho los cambios correspondientes a la documentación
- [ ] Mis cambios no generan nuevas warnings
- [ ] He agregado tests que prueban que mi fix es efectivo o que mi feature funciona
- [ ] Tests nuevos y existentes pasan localmente con mis cambios
```

### Proceso de Review

1. **Automated Checks** - CI/CD ejecuta tests y linting
2. **Code Review** - Al menos un reviewer debe aprobar
3. **Testing** - QA puede probar funcionalidad si es necesario
4. **Merge** - Solo después de aprobación y checks pasando

## 🐛 Reportar Issues

### Antes de Reportar

1. **Busca** issues existentes similares
2. **Verifica** que estés usando la versión más reciente
3. **Reproduce** el problema en un ambiente limpio

### Información a Incluir

- **Descripción clara** del problema
- **Pasos para reproducir** el issue
- **Comportamiento esperado** vs actual
- **Screenshots** si es visual
- **Información del ambiente:**
  - Versión de Node.js
  - Versión de la API
  - Sistema operativo
  - Base de datos y versión

### Labels

Usamos estos labels para categorizar issues:

- `bug` - Errores en funcionalidad existente
- `enhancement` - Nuevas funcionalidades
- `documentation` - Mejoras a documentación
- `good first issue` - Bueno para nuevos contribuidores
- `help wanted` - Necesitamos ayuda de la comunidad
- `priority: high` - Issues de alta prioridad
- `status: in progress` - Actualmente siendo trabajado

## 🎓 Recursos para Nuevos Contribuidores

### Documentación

- [README.md](./README.md) - Información general del proyecto
- [BEST_PRACTICES.md](./docs/BEST_PRACTICES.md) - Estándares de código
- [MODULES.md](./docs/MODULES.md) - Arquitectura de módulos

### Good First Issues

Busca issues marcados con `good first issue` para comenzar a contribuir.

### Mentoring

Si eres nuevo contribuyendo a open source, no dudes en:

- Hacer preguntas en los issues
- Pedir feedback en PRs
- Solicitar ayuda en nuestro canal de comunicación

## 📞 ¿Necesitas Ayuda?

- **Issues Técnicos:** Crea un issue en GitHub
- **Preguntas Generales:** Envía email a desarrollo@ingeocimyc.com
- **Chat:** Únete a nuestro canal de Slack #api-cuentas-dev

## 🎉 ¡Gracias!

Tu contribución hace que este proyecto sea mejor para todos. ¡Apreciamos tu tiempo y esfuerzo!

---

_Este documento es revisado regularmente. Para sugerencias de mejora, por favor abre un issue._
