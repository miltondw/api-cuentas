# Documentación de Módulos - API Cuentas

## 🏗️ Arquitectura Modular

El proyecto está estructurado siguiendo el patrón modular de NestJS, donde cada módulo encapsula una funcionalidad específica del negocio.

---

## 🔐 Módulo de Autenticación (auth)

**Ubicación:** `src/modules/auth/`

### Propósito

Gestiona la autenticación y autorización de usuarios en el sistema.

### Componentes Principales

#### Controlador (`auth.controller.ts`)

- `POST /auth/login` - Autenticación de usuarios
- `POST /auth/logout` - Cierre de sesión
- `POST /auth/refresh` - Renovación de tokens
- `GET /auth/profile` - Obtener perfil del usuario autenticado

#### Servicio (`auth.service.ts`)

- Validación de credenciales
- Generación y validación de JWT
- Gestión de sesiones de usuario
- Logs de auditoría de autenticación

#### Entidades

- **User** (`user.entity.ts`) - Información del usuario
- **UserSession** (`user-session.entity.ts`) - Sesiones activas
- **AuthLog** (`auth-log.entity.ts`) - Registro de accesos
- **FailedLoginAttempt** (`failed-login-attempt.entity.ts`) - Intentos fallidos

#### Guards y Decoradores

- **JwtAuthGuard** - Protección con JWT
- **RolesGuard** - Control de acceso por roles
- **@Public()** - Decorator para rutas públicas
- **@Roles()** - Decorator para requerir roles específicos

#### Estrategias

- **LocalStrategy** - Autenticación por email/password
- **JwtStrategy** - Validación de tokens JWT

### Funcionalidades Clave

- **Autenticación Segura:** bcrypt para hashing de contraseñas
- **JWT con Expiración:** Tokens con tiempo de vida configurable
- **Control de Sesiones:** Seguimiento de sesiones activas
- **Auditoría:** Log completo de intentos de acceso
- **Rate Limiting:** Protección contra ataques de fuerza bruta

---

## 👨‍💼 Módulo de Administración (admin)

**Ubicación:** `src/modules/admin/`

### Propósito

Proporciona funcionalidades de administración del sistema para usuarios con privilegios elevados.

### Componentes Principales

- **Panel de Control:** Dashboard con métricas del sistema
- **Gestión de Usuarios:** CRUD completo de usuarios
- **Configuración del Sistema:** Parámetros globales
- **Reportes:** Generación de reportes administrativos

### Funcionalidades

- Gestión de roles y permisos
- Monitoreo de actividad del sistema
- Configuración de parámetros globales
- Exportación de datos

---

## 🧪 Módulo de Laboratorio (lab)

**Ubicación:** `src/modules/lab/`

### Propósito

Gestiona todas las operaciones relacionadas con el laboratorio de análisis.

### Submódulos

#### Apiques (`apiques/`)

- Gestión de muestras de apiques
- Seguimiento de análisis geotécnicos
- Resultados de laboratorio

#### Perfiles (`profiles/`)

- Perfiles de suelo
- Clasificación de materiales
- Análisis granulométricos

### Funcionalidades Clave

- **Gestión de Muestras:** Registro y seguimiento
- **Análisis de Laboratorio:** Diferentes tipos de ensayos
- **Resultados:** Almacenamiento y consulta de resultados
- **Reportes Técnicos:** Generación automática de informes

---

## 📋 Módulo de Proyectos (projects)

**Ubicación:** `src/modules/projects/`

### Propósito

Gestión completa del ciclo de vida de proyectos de ingeniería.

### Submódulos

#### Gestión de Proyectos (`project-management/`)

- CRUD de proyectos
- Asignación de recursos
- Seguimiento de progreso
- Cronogramas

#### Financiero (`financial/`)

- Presupuestos
- Facturación
- Control de costos
- Reportes financieros

#### Resumen (`resumen/`)

- Dashboards de proyecto
- Métricas y KPIs
- Reportes ejecutivos

### Componentes Principales

#### Controlador (`projects.controller.ts`)

- `GET /projects` - Listar proyectos
- `POST /projects` - Crear proyecto
- `GET /projects/:id` - Obtener proyecto específico
- `PUT /projects/:id` - Actualizar proyecto
- `DELETE /projects/:id` - Eliminar proyecto

#### Entidades

- **Project** - Información básica del proyecto
- **ProjectTask** - Tareas del proyecto
- **ProjectResource** - Recursos asignados
- **ProjectBudget** - Presupuestos

### Funcionalidades Clave

- **Gestión Completa:** Desde creación hasta cierre
- **Control Financiero:** Presupuestos y seguimiento de costos
- **Recursos:** Asignación de personal y equipos
- **Reportes:** Informes de progreso y financieros

---

## 🛠️ Módulo de Servicios (services)

**Ubicación:** `src/modules/services/`

### Propósito

Gestiona el catálogo de servicios ofrecidos por Ingeocimyc.

### Componentes Principales

#### Controladores

- **ServicesController** - API pública de servicios
- **ServicesAdminController** - Administración de servicios

#### Funcionalidades

- **Catálogo de Servicios:** Lista completa de servicios
- **Cotizaciones:** Generación automática de cotizaciones
- **Solicitudes:** Gestión de solicitudes de servicio
- **Precios:** Gestión de tarifas y descuentos

### Tipos de Servicios

- Estudios geotécnicos
- Análisis de laboratorio
- Consultoría en ingeniería
- Supervisión técnica

---

## 👥 Módulo de Cliente (client)

**Ubicación:** `src/modules/client/`

### Propósito

Funcionalidades específicas para clientes del sistema.

### Submódulos

#### Solicitudes de Servicio (`service-requests/`)

- Solicitud de cotizaciones
- Seguimiento de servicios
- Comunicación con el equipo técnico

### Funcionalidades

- **Portal del Cliente:** Acceso a información personalizada
- **Solicitudes:** Gestión de requests de servicio
- **Documentos:** Acceso a informes y certificados
- **Comunicación:** Mensajería con el equipo

---

## 📄 Módulo de PDF (pdf)

**Ubicación:** `src/modules/pdf/`

### Propósito

Generación automática de documentos PDF personalizados.

### Componentes Principales

#### Controlador (`pdf.controller.ts`)

- `POST /pdf/generate` - Generar PDF personalizado
- `GET /pdf/template/:type` - Obtener plantillas
- `POST /pdf/preview` - Vista previa de PDF

#### Servicio (`pdf.service.ts`)

- Generación con PDFKit
- Renderizado con Puppeteer
- Gestión de plantillas HTML
- Optimización de tamaño

### Tipos de Documentos

- **Informes Técnicos:** Resultados de análisis
- **Cotizaciones:** Propuestas comerciales
- **Certificados:** Documentos oficiales
- **Facturas:** Documentos contables

### Funcionalidades Avanzadas

- **Plantillas Dinámicas:** HTML con datos variables
- **Gráficos y Tablas:** Visualización de datos
- **Watermarks:** Marcas de agua personalizadas
- **Compresión:** Optimización de tamaño de archivo

---

## ❤️ Módulo de Health (health)

**Ubicación:** `src/modules/health/`

### Propósito

Monitoreo del estado de la aplicación y sus dependencias.

### Componentes

#### Health Controller (`health.controller.ts`)

- `GET /health` - Estado general del sistema
- `GET /health/database` - Estado de base de datos
- `GET /health/memory` - Uso de memoria
- `GET /health/disk` - Espacio en disco

#### API Health Controller (`api-health.controller.ts`)

- Health checks específicos para la API
- Métricas de rendimiento
- Validación de servicios externos

### Métricas Monitoreadas

- **Base de Datos:** Conectividad y latencia
- **Memoria:** Uso de RAM y heap
- **CPU:** Porcentaje de uso
- **Disco:** Espacio disponible
- **Red:** Conectividad externa

---

## 🔧 Módulos de Soporte

### Common (`src/common/`)

#### Filtros (`filters/`)

- **AllExceptionsFilter** - Manejo global de excepciones

#### Interceptores (`interceptors/`)

- **RequestLoggingInterceptor** - Log de todas las requests

#### Middleware (`middleware/`)

- **RateLimitMiddleware** - Limitación de requests por IP

#### Servicios (`services/`)

- **CleanupService** - Limpieza automática de recursos

---

## 📊 Patrones de Diseño Utilizados

### 1. **Repository Pattern**

- Abstracción de acceso a datos
- Facilita testing y mantenimiento

### 2. **Dependency Injection**

- Inversión de control
- Acoplamiento débil entre componentes

### 3. **Decorator Pattern**

- Metadatos para rutas y validaciones
- Reutilización de lógica transversal

### 4. **Strategy Pattern**

- Múltiples estrategias de autenticación
- Diferentes tipos de generación de PDF

### 5. **Observer Pattern**

- Event emitters para notificaciones
- Logs de auditoría automáticos

---

## 🛡️ Seguridad por Módulo

### Niveles de Acceso

1. **Público** - Sin autenticación requerida
2. **Autenticado** - JWT válido requerido
3. **Roles Específicos** - Permisos adicionales
4. **Admin** - Acceso completo al sistema

### Validación de Datos

- **DTOs** con class-validator
- **Transformación** automática de tipos
- **Sanitización** de entrada de datos

---

## 📈 Escalabilidad y Mantenimiento

### Principios Aplicados

- **Single Responsibility** - Cada módulo tiene una responsabilidad clara
- **Open/Closed** - Extensible sin modificar código existente
- **Dependency Inversion** - Dependencias hacia abstracciones

### Facilidades para Desarrollo

- **Hot Reload** - Desarrollo ágil
- **Testing Integrado** - Pruebas automatizadas
- **Documentación Automática** - Swagger/OpenAPI
- **Type Safety** - TypeScript en todo el proyecto

---

_Cada módulo está diseñado para ser independiente y reutilizable, siguiendo las mejores prácticas de NestJS y arquitectura de software._
