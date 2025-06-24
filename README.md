# 🏗️ API Cuentas - Ingeocimyc

**Versión:** 0.0.1  
**Framework:** NestJS + TypeScript  
**Base de Datos:** MySQL  
**Puerto Local:** 5051

API REST para la gestión integral del sistema de cuentas de Ingeocimyc, especializada en servicios de ingeniería geotécnica.

## ⚡ Quick Start

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar en desarrollo
npm run start:dev

# Analizar base de datos
npm run db:analyze
```

La API estará disponible en: `http://localhost:5051`

## 📚 Documentación Completa

| Documento                                       | Descripción                        |
| ----------------------------------------------- | ---------------------------------- |
| [📖 Documentación Principal](./docs/README.md)  | Información detallada del proyecto |
| [🏗️ Módulos](./docs/MODULES.md)                 | Arquitectura y módulos del sistema |
| [⭐ Buenas Prácticas](./docs/BEST_PRACTICES.md) | Estándares de desarrollo           |
| [🌐 API Reference](./docs/API_REFERENCE.md)     | Documentación de endpoints         |
| [🚀 Deployment](./docs/DEPLOYMENT.md)           | Guía de despliegue                 |
| [📋 Índice Completo](./docs/INDEX.md)           | Navegación de documentación        |

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- MySQL 8.0+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone [url-del-repositorio]
cd api-cuentas

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en desarrollo
npm run start:dev
```

- **Manejo de Errores**: Sistema centralizado de manejo de errores
- **TypeScript**: Tipado estático para mayor robustez

## 📁 Estructura del Proyecto

```
src/
├── main.ts                 # Punto de entrada de la aplicación
├── app.module.ts           # Módulo principal
├── common/                 # Utilities compartidas
│   └── filters/           # Filtros de excepción
├── modules/               # Módulos de funcionalidad
│   ├── auth/             # Autenticación y autorización
│   ├── service-requests/ # Gestión de solicitudes de servicio
│   ├── services/         # Gestión de servicios y categorías
│   ├── projects/         # Gestión de proyectos
│   ├── profiles/         # Gestión de perfiles
│   └── financial/        # Módulo financiero
└── scripts/              # Scripts de migración y utilidades
```

## 🛠️ Instalación y Configuración

### 1. Instalar dependencias

```bash
cd nest-migration
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=tu_base_de_datos

# JWT Configuration
JWT_SECRET=tu_clave_secreta_jwt_muy_segura
JWT_EXPIRES_IN=24h

# Application Configuration
PORT=5050
NODE_ENV=development
```

### 3. Preparar la base de datos

Ejecuta el script de migración de datos:

```bash
npm run build
npm run migrate:data
```

### 4. Ejecutar la aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 📋 Plan de Migración Gradual

### Fase 1: ✅ Completada

- [x] Configuración inicial de Nest.js
- [x] Configuración de TypeORM y base de datos
- [x] Módulo de autenticación (JWT)
- [x] Módulo de solicitudes de servicio
- [x] Módulo de servicios y categorías
- [x] Sistema de validación con DTOs
- [x] Documentación Swagger
- [x] Manejo global de errores

### Fase 2: 🚧 Pendiente

- [ ] Migración del módulo de proyectos
- [ ] Migración del módulo de perfiles
- [ ] Migración del módulo financiero
- [ ] Migración del módulo de apiques
- [ ] Sistema de generación de PDFs
- [ ] Migración de middleware personalizado

### Fase 3: 🚧 Pendiente

- [ ] Testing unitario y de integración
- [ ] Optimización de consultas a base de datos
- [ ] Implementación de caché (Redis)
- [ ] Logging avanzado
- [ ] Monitoreo y métricas

## 🔄 Comparación Express vs Nest.js

### Express.js (Actual)

```javascript
// router.get('/service-requests', async (req, res) => {
app.get('/service-requests', async (req, res) => {
  try {
    const requests = await getServiceRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Nest.js (Nuevo)

```typescript
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las solicitudes de servicio' })
  @ApiResponse({ status: 200, type: [ServiceRequest] })
  async findAll(@Query('status') status?: string): Promise<ServiceRequest[]> {
    if (status) {
      return this.serviceRequestsService.findByStatus(status);
    }
    return this.serviceRequestsService.findAll();
  }
}
```

## 🎯 Beneficios de la Migración

1. **Tipado Estático**: TypeScript elimina errores en tiempo de compilación
2. **Inyección de Dependencias**: Facilita testing y mantenimiento
3. **Decoradores**: Código más limpio y expresivo
4. **Validación Automática**: DTOs validan automáticamente las entradas
5. **Documentación Automática**: Swagger se genera automáticamente
6. **Estructura Modular**: Código más organizado y reutilizable
7. **Manejo de Errores**: Sistema centralizado y consistente

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests e2e
npm run test:e2e
```

## 📖 Documentación API

Una vez que la aplicación esté corriendo, puedes acceder a la documentación Swagger en:

```
http://localhost:5050/api-docs
```

## 🛠️ Scripts Disponibles

### Desarrollo

```bash
npm run start:dev      # Servidor con hot reload
npm run start:debug    # Modo debug
npm run build          # Build para producción
npm run lint           # Linting y formato
npm test              # Ejecutar tests
```

### Base de Datos

```bash
npm run db:analyze      # Analizar estructura de BD
npm run db:analyze:file # Generar JSON con estructura
```

### Testing

```bash
npm run test:watch     # Tests en modo watch
npm run test:cov       # Coverage report
npm run test:e2e       # Tests end-to-end
```

## 🏗️ Arquitectura

### Módulos Principales

```
📁 src/modules/
├── 🔐 auth/           # Autenticación JWT, roles, sesiones
├── 👨‍💼 admin/          # Panel administrativo
├── 🧪 lab/            # Laboratorio (apiques, perfiles)
├── 📋 projects/       # Gestión de proyectos
├── 🛠️ services/       # Catálogo de servicios
├── 👥 client/         # Portal del cliente
├── 📄 pdf/           # Generación de documentos
└── ❤️ health/        # Monitoreo del sistema
```

### Tecnologías

- **Backend:** NestJS, TypeScript, Express
- **Base de Datos:** MySQL + TypeORM
- **Autenticación:** JWT + Passport
- **Documentación:** Swagger/OpenAPI
- **Testing:** Jest
- **PDF:** PDFKit + Puppeteer

## 📊 Estado de la Base de Datos

**Última análisis:** Ejecutado exitosamente ✅

```
📊 Base de datos: ingeocim_form
🗂️  Total de tablas: 21
🔗 Total de relaciones: 8
🌐 Host: 162.241.61.244:3306
```

### Tablas Principales

- **usuarios** (19 registros) - Gestión de usuarios
- **proyectos** (13 registros) - Proyectos de ingeniería
- **services** (49 registros) - Catálogo de servicios
- **auth_logs** (71 registros) - Auditoría de autenticación
- **user_sessions** (60 registros) - Sesiones activas

### Relaciones Clave

- `gastos_proyectos` → `proyectos`
- `profiles` → `proyectos`
- `selected_services` → `service_requests`
- `user_sessions` → `usuarios`

## 🔐 Seguridad Implementada

- JWT con expiración configurable ✅
- Rate limiting inteligente ✅
- Validación estricta de datos (DTOs) ✅
- Headers de seguridad (Helmet) ✅
- Hashing seguro de contraseñas (bcrypt) ✅
- Auditoría completa de accesos ✅
- Control de sesiones activas ✅

## 📱 Swagger/OpenAPI

Documentación interactiva disponible en:

- **Local:** http://localhost:5051/api-docs
- **Producción:** https://tu-dominio.com/api-docs

## 🤝 Contribuir

1. Lee [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Revisa [Buenas Prácticas](./docs/BEST_PRACTICES.md)
3. Ejecuta análisis: `npm run db:analyze`
4. Desarrolla tu feature siguiendo estándares
5. Ejecuta tests: `npm test`
6. Crea un Pull Request

---

**¡Bienvenido al proyecto API Cuentas de Ingeocimyc!** 🚀

Para comenzar, revisa la [📋 documentación completa](./docs/INDEX.md)

_Última actualización: Junio 2025_
