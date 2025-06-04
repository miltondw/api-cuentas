# 🔐 Configuración Final de Permisos - NestJS API

## 📋 Resumen de Roles

- **admin**: Acceso completo a todo el sistema, puede crear/editar/eliminar cualquier recurso
- **lab**: Acceso a módulos de laboratorio (apiques, perfiles) y visualización de solicitudes
- **client**: Puede crear solicitudes de servicio y ver catálogo de servicios

## 🛠️ Endpoints por Módulo

### 🔐 **AUTENTICACIÓN** (`/api/auth/*`)
| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| POST | `/auth/login` | **Público** | Iniciar sesión |
| POST | `/auth/register` | **Público** | Registrar usuario |

### 🔧 **APIQUES** (`/api/lab/apiques/*`)
| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| POST | `/lab/apiques` | `admin, lab` | Crear nuevo apique |
| GET | `/lab/apiques/project/:projectId` | `admin, lab` | Obtener apiques por proyecto |
| GET | `/lab/apiques/:projectId/:apiqueId` | `admin, lab` | Obtener apique específico |
| PUT | `/lab/apiques/:projectId/:apiqueId` | `admin, lab` | Actualizar apique |
| DELETE | `/lab/apiques/:projectId/:apiqueId` | `admin` | Eliminar apique |
| GET | `/lab/apiques/project/:projectId/statistics` | `admin, lab` | Estadísticas de apiques |

### 👥 **PERFILES** (`/api/lab/profiles/*`)
| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| POST | `/lab/profiles` | `admin, lab` | Crear nuevo perfil |
| GET | `/lab/profiles` | `admin, lab` | Obtener todos los perfiles |
| GET | `/lab/profiles/project/:projectId` | `admin, lab` | Perfiles por proyecto |
| GET | `/lab/profiles/project/:projectId/sounding/:soundingNumber` | `admin, lab` | Perfil por sondeo |
| GET | `/lab/profiles/:id` | `admin, lab` | Obtener perfil por ID |
| PATCH | `/lab/profiles/:id` | `admin, lab` | Actualizar perfil |
| DELETE | `/lab/profiles/:id` | `admin` | Eliminar perfil |
| POST | `/lab/profiles/:profileId/blows` | `admin, lab` | Agregar golpeo |
| GET | `/lab/profiles/:profileId/blows` | `admin, lab` | Obtener golpeos |
| PATCH | `/lab/profiles/blows/:blowId` | `admin, lab` | Actualizar golpeo |
| DELETE | `/lab/profiles/blows/:blowId` | `admin, lab` | Eliminar golpeo |

### 🏗️ **PROYECTOS** (`/api/projects/*`)
| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| POST | `/projects` | `admin` | Crear nuevo proyecto |
| GET | `/projects` | `admin` | Obtener todos los proyectos |
| GET | `/projects/summary` | `admin` | Resumen de proyectos |
| GET | `/projects/:id` | `admin` | Obtener proyecto por ID |
| PATCH | `/projects/:id` | `admin` | Actualizar proyecto |
| PATCH | `/projects/:id/payment` | `admin` | Agregar pago |
| DELETE | `/projects/:id` | `admin` | Eliminar proyecto |

### 💰 **FINANZAS** (`/api/gastos-mes/*`)
| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| POST | `/gastos-mes/expenses` | `admin` | Crear gastos empresa |
| GET | `/gastos-mes/expenses` | `admin` | Obtener gastos empresa |
| GET | `/gastos-mes/expenses/month/:mes` | `admin` | Gastos por mes |
| GET | `/gastos-mes/expenses/month/:mes/total` | `admin` | Total gastos por mes |
| PATCH | `/gastos-mes/expenses/:id` | `admin` | Actualizar gastos |
| DELETE | `/gastos-mes/expenses/:id` | `admin` | Eliminar gastos |
| POST | `/gastos-mes/summary` | `admin` | Crear resumen financiero |
| GET | `/gastos-mes/summary` | `admin` | Obtener resúmenes |
| PATCH | `/gastos-mes/summary/:id` | `admin` | Actualizar resumen |
| DELETE | `/gastos-mes/summary/:id` | `admin` | Eliminar resumen |

### 📄 **SOLICITUDES DE SERVICIO** (`/api/service-requests/*`)
| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| POST | `/service-requests` | **Público** | Crear solicitud (clientes) |
| GET | `/service-requests` | `admin` | Ver todas las solicitudes |
| GET | `/service-requests/:id` | `admin, lab` | Ver solicitud específica |
| PATCH | `/service-requests/:id` | `admin` | Actualizar solicitud |
| DELETE | `/service-requests/:id` | `admin` | Eliminar solicitud |

### 📄 **SOLICITUDES DE CLIENTES** (`/api/client/service-requests/*`)
| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| POST | `/client/service-requests` | **Público** | Crear solicitud |
| GET | `/client/service-requests` | `admin, client, lab` | Ver solicitudes |
| GET | `/client/service-requests/:id` | `admin, client, lab` | Ver solicitud |
| PATCH | `/client/service-requests/:id` | `admin, client, lab` | Actualizar solicitud |

### 🔧 **SERVICIOS** (`/api/services/*`)
| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| GET | `/services` | **Público** | Catálogo de servicios |
| GET | `/services/categories` | **Público** | Categorías de servicios |
| GET | `/services/category/:categoryId` | **Público** | Servicios por categoría |
| GET | `/services/:id` | **Público** | Servicio específico |

### 📋 **GENERACIÓN DE PDFs** (`/api/pdf/*`)
| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| GET | `/pdf/service-request/:id` | `admin` | Generar PDF de solicitud |

### 📊 **RESUMEN FINANCIERO** (`/api/resumen/*`)
| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| GET | `/resumen/financial/:year` | `admin` | Resumen financiero anual |
| GET | `/resumen/projects/:year` | `admin` | Resumen de proyectos |

## 🎯 **Configuración Implementada**

### ✅ **Cambios Realizados:**

1. **Módulo Profiles**: Cambiado de `admin, ingeniero, tecnico` a `admin, lab`
2. **Módulo Projects**: Cambiado de `admin, user` a solo `admin`
3. **Módulo PDF**: Cambiado de público a solo `admin`
4. **Módulo Apiques**: Eliminación solo para `admin` (ya estaba correcto)
5. **Módulo Financial**: Solo `admin` (ya estaba correcto)

### 🔒 **Sistema de Seguridad:**

- **JWT Authentication**: Requerido para endpoints protegidos
- **Role-based Guards**: Verificación de roles en cada endpoint
- **Public Endpoints**: Solo para servicios de catálogo y creación de solicitudes
- **Admin Only**: Proyectos, finanzas, PDFs y eliminaciones

### 🚀 **Siguientes Pasos:**

1. **Probar la autenticación** con diferentes usuarios
2. **Verificar permisos** de cada rol
3. **Documenter en Swagger** los cambios realizados
4. **Crear usuarios de prueba** para cada rol
5. **Testear endpoints** con diferentes permisos

## 🛡️ **Seguridad Adicional Implementada:**

- Rate limiting en autenticación
- Validación de entrada con DTOs
- Manejo centralizado de errores
- Headers de seguridad (Helmet)
- CORS configurado correctamente
- Logging de accesos por rol

## 📞 **Contacto para Dudas:**

Si necesitas ajustar algún permiso específico o agregar nuevos roles, me puedes decir cuáles endpoints necesitas modificar y para qué roles.
