# 📚 Documentación - API Cuentas Ingeocimyc

## 📋 Índice de Documentación

Esta carpeta contiene toda la documentación técnica del proyecto API Cuentas de Ingeocimyc.

### 📖 Documentos Principales

| Documento                                | Descripción                                      | Audiencia             |
| ---------------------------------------- | ------------------------------------------------ | --------------------- |
| [README.md](./README.md)                 | Información general del proyecto y setup inicial | Desarrolladores, PM   |
| [MODULES.md](./MODULES.md)               | Documentación detallada de cada módulo           | Desarrolladores       |
| [BEST_PRACTICES.md](./BEST_PRACTICES.md) | Estándares de código y buenas prácticas          | Desarrolladores       |
| [API_REFERENCE.md](./API_REFERENCE.md)   | Documentación completa de endpoints              | Frontend, QA, Cliente |
| [DEPLOYMENT.md](./DEPLOYMENT.md)         | Guía de deployment y configuración               | DevOps, SysAdmin      |

### 🛠️ Scripts de Utilidad

| Script                  | Comando                               | Descripción                         |
| ----------------------- | ------------------------------------- | ----------------------------------- |
| `structure_db.js`       | `node scripts/structure_db.js`        | Analiza estructura de base de datos |
| Database Structure JSON | `node scripts/structure_db.js --file` | Genera archivo JSON con estructura  |

---

## 🚀 Quick Start

### Para Desarrolladores Nuevos

1. Lee [README.md](./README.md) para entender el proyecto
2. Revisa [MODULES.md](./MODULES.md) para la arquitectura
3. Estudia [BEST_PRACTICES.md](./BEST_PRACTICES.md) antes de codificar

### Para Frontend/Mobile Developers

1. Consulta [API_REFERENCE.md](./API_REFERENCE.md) para endpoints
2. Usa Swagger UI en `http://localhost:5051/api-docs`

### Para DevOps/SysAdmin

1. Sigue [DEPLOYMENT.md](./DEPLOYMENT.md) para deployment
2. Ejecuta `node scripts/structure_db.js` para validar BD

---

## 📊 Análisis de Base de Datos

Para analizar tu base de datos actual:

```bash
# Análisis completo en consola
node scripts/structure_db.js

# Generar archivo JSON detallado
node scripts/structure_db.js --file
```

El script generará:

- **Consola:** Análisis detallado con recomendaciones
- **Archivo:** `docs/database-structure.json` con estructura completa

### Información que Proporciona

- ✅ Lista de todas las tablas
- ✅ Columnas con tipos de datos
- ✅ Claves primarias y foráneas
- ✅ Índices y relaciones
- ✅ Estadísticas de tamaño
- ✅ Recomendaciones de optimización

---

## 🏗️ Arquitectura del Proyecto

```
📁 docs/                           # Documentación del proyecto
├── 📄 README.md                   # Información general
├── 📄 MODULES.md                  # Documentación de módulos
├── 📄 BEST_PRACTICES.md          # Buenas prácticas
├── 📄 API_REFERENCE.md           # Referencia de API
├── 📄 DEPLOYMENT.md              # Guía de deployment
├── 📄 INDEX.md                   # Este archivo
└── 📄 database-structure.json    # Estructura de BD (generado)

📁 scripts/                        # Scripts de utilidad
└── 📄 structure_db.js            # Analizador de base de datos

📁 src/                            # Código fuente
├── 📁 modules/                   # Módulos de negocio
│   ├── 🔐 auth/                  # Autenticación
│   ├── 👨‍💼 admin/                 # Administración
│   ├── 🧪 lab/                   # Laboratorio
│   ├── 📋 projects/              # Proyectos
│   ├── 🛠️ services/              # Servicios
│   ├── 👥 client/                # Cliente
│   ├── 📄 pdf/                   # Generación PDF
│   └── ❤️ health/                # Health checks
├── 📁 common/                    # Componentes compartidos
├── 📁 migrations/                # Migraciones de BD
└── 📁 scripts/                   # Scripts de testing
```

---

## 🔍 Módulos Principales

### 🔐 Autenticación (`auth/`)

- Login/logout con JWT
- Gestión de sesiones
- Control de roles y permisos
- Auditoría de accesos

### 📋 Proyectos (`projects/`)

- CRUD completo de proyectos
- Gestión financiera
- Seguimiento de progreso
- Reportes ejecutivos

### 🧪 Laboratorio (`lab/`)

- Gestión de muestras (apiques, perfiles)
- Análisis geotécnicos
- Resultados de laboratorio
- Informes técnicos

### 🛠️ Servicios (`services/`)

- Catálogo de servicios
- Cotizaciones automáticas
- Solicitudes de cliente
- Gestión de precios

### 📄 PDF (`pdf/`)

- Generación automática de documentos
- Plantillas dinámicas
- Informes técnicos
- Facturas y cotizaciones

---

## 🛡️ Seguridad y Buenas Prácticas

### Implementado

- ✅ JWT con expiración configurable
- ✅ Rate limiting inteligente
- ✅ Validación estricta de datos
- ✅ Headers de seguridad (Helmet)
- ✅ Logging de auditoría
- ✅ Hashing seguro de contraseñas
- ✅ Control de acceso por roles

### Recomendaciones

- 🔐 Cambiar JWT_SECRET en producción
- 🔄 Configurar rotación de logs
- 📊 Implementar monitoreo avanzado
- 🚨 Configurar alertas de seguridad
- 💾 Backup automático de BD

---

## 📈 Performance y Escalabilidad

### Optimizaciones Actuales

- ✅ Conexión pooling de BD
- ✅ Compresión HTTP
- ✅ Cache estratégico
- ✅ Lazy loading en relaciones
- ✅ Índices en campos críticos

### Métricas a Monitorear

- 📊 Tiempo de respuesta API
- 💾 Uso de memoria
- 🔗 Conexiones activas BD
- 📈 Throughput de requests
- ❌ Rate de errores

---

## 🧪 Testing y Calidad

### Tipos de Tests

- **Unit Tests:** Servicios y controladores
- **Integration Tests:** Endpoints completos
- **E2E Tests:** Flujos de usuario
- **Performance Tests:** Carga y estrés

### Coverage Objetivo

- 📊 **Branches:** 70%
- 📊 **Functions:** 70%
- 📊 **Lines:** 70%
- 📊 **Statements:** 70%

---

## 🚀 Deployment y DevOps

### Opciones de Deployment

1. **Render** (Recomendado) - Deployment automático
2. **Docker** - Containerización
3. **VPS** - Servidor dedicado
4. **Cloud** - AWS/GCP/Azure

### CI/CD Pipeline

- ✅ Tests automáticos
- ✅ Build verification
- ✅ Deployment automático
- ✅ Health checks post-deploy

---

## 📞 Soporte y Contacto

### Para Desarrolladores

- 📧 **Email:** desarrollo@ingeocimyc.com
- 💬 **Slack:** #api-cuentas-dev
- 📝 **Issues:** GitHub Issues

### Para Usuarios Finales

- 📧 **Soporte:** soporte@ingeocimyc.com
- 📞 **Teléfono:** +XX XXX XXX XXXX
- 🌐 **Portal:** https://portal.ingeocimyc.com

---

## 🔄 Actualizaciones de Documentación

### Última Actualización

- **Fecha:** Junio 24, 2025
- **Versión:** 1.0.0
- **Cambios:** Documentación inicial completa

### Contribuir a la Documentación

1. Fork del repositorio
2. Crear branch `docs/feature-name`
3. Actualizar documentación relevante
4. Pull request con descripción clara

---

## 📚 Recursos Adicionales

### Enlaces Útiles

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Docker Documentation](https://docs.docker.com/)

### Tutoriales Internos

- 🎥 Video: "Setup de desarrollo local"
- 📝 Tutorial: "Crear nuevo módulo"
- 🔧 Guía: "Debugging avanzado"
- 📊 Workshop: "Testing estrategias"

---

_Esta documentación es un documento vivo que debe actualizarse con cada cambio significativo en el proyecto._
