# API Cuentas - Ingeocimyc

## 📋 Información General

**Proyecto:** API de Cuentas migrada a NestJS  
**Versión:** 0.0.1  
**Empresa:** Ingeocimyc  
**Puerto Local:** 5051  
**Framework:** NestJS con TypeScript  
**Base de Datos:** MySQL  
**Arquitectura:** Modular con patrón MVC

## 🎯 Descripción del Proyecto

Esta API REST está diseñada para gestionar el sistema de cuentas de Ingeocimyc, proporcionando funcionalidades para:

- **Autenticación y Autorización** - JWT, roles, sesiones de usuario
- **Gestión de Proyectos** - CRUD completo, seguimiento financiero
- **Laboratorio** - Gestión de muestras, análisis y perfiles
- **Servicios** - Administración de servicios ofrecidos
- **Generación de PDFs** - Documentos y reportes automatizados
- **Administración** - Panel de control y gestión de usuarios

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────┐
│   Frontend/Client   │
└──────────┬──────────┘
           │ HTTP/HTTPS
┌──────────▼──────────┐
│    NestJS API       │
│   (Puerto 5051)     │
├─────────────────────┤
│   Rate Limiting     │
│   Authentication    │
│   Authorization     │
│   Validation        │
└──────────┬──────────┘
           │ TypeORM
┌──────────▼──────────┐
│   MySQL Database    │
└─────────────────────┘
```

## 📁 Estructura de Directorios

```
src/
├── app.module.ts              # Módulo principal de la aplicación
├── main.ts                    # Punto de entrada y configuración
├── common/                    # Componentes compartidos
│   ├── filters/              # Filtros globales de excepciones
│   ├── interceptors/         # Interceptores de logging y transformación
│   ├── middleware/           # Middleware personalizado (rate limiting)
│   └── services/             # Servicios comunes (cleanup)
├── migrations/               # Migraciones de base de datos
├── modules/                  # Módulos de negocio
│   ├── auth/                # Autenticación y autorización
│   ├── admin/               # Administración del sistema
│   ├── lab/                 # Gestión de laboratorio
│   ├── projects/            # Gestión de proyectos
│   ├── services/            # Servicios de la empresa
│   ├── client/              # Funcionalidades del cliente
│   ├── pdf/                 # Generación de documentos PDF
│   └── health/              # Health checks y monitoreo
├── scripts/                 # Scripts de utilidad y testing
└── templates/               # Plantillas HTML para PDFs
```

## 🔧 Tecnologías Utilizadas

### Core Framework

- **NestJS** - Framework de Node.js para aplicaciones escalables
- **TypeScript** - Tipado estático para JavaScript
- **Express** - Servidor HTTP subyacente

### Base de Datos

- **TypeORM** - ORM para TypeScript/JavaScript
- **MySQL** - Sistema de gestión de base de datos

### Autenticación y Seguridad

- **Passport** - Middleware de autenticación
- **JWT** - JSON Web Tokens para autenticación
- **bcryptjs** - Hashing de contraseñas
- **Helmet** - Seguridad HTTP headers
- **Rate Limiting** - Limitación de requests

### Documentación y Validación

- **Swagger/OpenAPI** - Documentación automática de API
- **class-validator** - Validación de DTOs
- **class-transformer** - Transformación de objetos

### Utilidades

- **PDFKit/Puppeteer** - Generación de documentos PDF
- **Compression** - Compresión de respuestas HTTP
- **Cookie Parser** - Manejo de cookies
- **UUID** - Generación de identificadores únicos

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js >= 18.x
- MySQL >= 8.x
- npm o yarn

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
DB_DATABASE=nombre_base_datos

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=24h

# Servidor
PORT=5051
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
TRUST_PROXY=false

# Otros
APP_NAME="API Cuentas Ingeocimyc"
```

### Comandos de Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo con hot reload
npm run start:dev

# Producción
npm run build
npm run start:prod

# Ejecutar tests
npm test

# Análisis de base de datos
node scripts/structure_db.js
```

## 📊 Análisis de Base de Datos

Para analizar la estructura de tu base de datos, ejecuta:

```bash
# Análisis completo en consola
node scripts/structure_db.js

# Generar archivo JSON con estructura
node scripts/structure_db.js --file
```

Este script te mostrará:

- Todas las tablas con sus columnas
- Tipos de datos y restricciones
- Claves primarias y foráneas
- Índices y relaciones
- Recomendaciones de optimización

## 🛡️ Seguridad Implementada

### Autenticación

- JWT con expiración configurable
- Refresh tokens para sesiones largas
- Logout seguro con invalidación de tokens

### Autorización

- Sistema de roles y permisos
- Guards personalizados para rutas protegidas
- Decoradores para control de acceso

### Protección contra Ataques

- Rate limiting inteligente por IP
- Validación estricta de entrada
- Headers de seguridad con Helmet
- Protección CORS configurada
- Sanitización de datos

### Logging y Auditoría

- Log de todas las requests
- Registro de intentos de login fallidos
- Seguimiento de sesiones de usuario
- Logs estructurados para monitoreo

## 📈 Monitoreo y Health Checks

### Endpoints de Salud

- `GET /` - Estado básico de la API
- `GET /health` - Health check detallado
- `GET /api/health` - Monitoreo de dependencias

### Métricas Incluidas

- Estado de conexión a base de datos
- Tiempo de respuesta de la API
- Uso de memoria y CPU
- Estadísticas de rate limiting

## 🧪 Testing

### Estrategia de Testing

- **Unit Tests** - Pruebas de servicios y controladores
- **Integration Tests** - Pruebas de endpoints completos
- **E2E Tests** - Flujos completos de usuario
- **Database Tests** - Validación de migraciones

### Comandos de Testing

```bash
# Tests unitarios
npm test

# Tests con coverage
npm run test:cov

# Tests end-to-end
npm run test:e2e

# Tests específicos de PDF
npm run test:pdf-services
```

## 🔄 CI/CD y Deployment

### Configuración de Render

- Archivo `render.yaml` para deployment automático
- Variables de entorno configuradas
- Build automático desde repositorio
- SSL/TLS automático

### Docker Support

- `Dockerfile` incluido para containerización
- Multi-stage build para optimización
- Configuración para desarrollo y producción

## 📚 Enlaces Útiles

- [Documentación de NestJS](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [API Documentation (Swagger)](http://localhost:5051/api-docs) - cuando la API está ejecutándose
- [MySQL Documentation](https://dev.mysql.com/doc/)

## 👥 Equipo de Desarrollo

**Empresa:** Ingeocimyc  
**Mantenido por:** Equipo de Desarrollo de Software

---

_Última actualización: Junio 2025_
