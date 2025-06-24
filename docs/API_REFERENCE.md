# API Reference - Endpoints Documentation

## 🌐 Base URL

- **Local Development:** `http://localhost:5051`
- **Production:** `https://tu-dominio.com`

## 🔐 Authentication

La API utiliza JWT (JSON Web Tokens) para autenticación. Incluye el token en el header `Authorization`:

```
Authorization: Bearer your-jwt-token
```

---

## 🔑 Authentication Endpoints

### Login

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "email": "usuario@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "user"
  },
  "expiresIn": "24h"
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer {token}
```

**Response:**

```json
{
  "message": "Successfully logged out"
}
```

### Get Profile

```http
GET /auth/profile
Authorization: Bearer {token}
```

**Response:**

```json
{
  "id": "uuid-string",
  "email": "usuario@example.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "user",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

## 📋 Projects Endpoints

### Get All Projects

```http
GET /projects?page=1&limit=10&status=active
Authorization: Bearer {token}
```

**Query Parameters:**

- `page` (optional): Número de página (default: 1)
- `limit` (optional): Elementos por página (default: 10, max: 100)
- `status` (optional): Filtrar por estado (active, completed, cancelled)
- `search` (optional): Buscar por nombre o descripción

**Response:**

```json
{
  "data": [
    {
      "id": "uuid-string",
      "name": "Estudio Geotécnico Edificio Central",
      "description": "Análisis de suelos para construcción",
      "status": "active",
      "startDate": "2025-01-15",
      "endDate": "2025-03-15",
      "budget": 50000.0,
      "owner": {
        "id": "uuid-string",
        "firstName": "Juan",
        "lastName": "Pérez"
      },
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Get Project by ID

```http
GET /projects/{id}
Authorization: Bearer {token}
```

**Response:**

```json
{
  "id": "uuid-string",
  "name": "Estudio Geotécnico Edificio Central",
  "description": "Análisis de suelos para construcción",
  "status": "active",
  "startDate": "2025-01-15",
  "endDate": "2025-03-15",
  "budget": 50000.0,
  "actualCost": 35000.0,
  "progress": 70,
  "owner": {
    "id": "uuid-string",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com"
  },
  "tasks": [
    {
      "id": "task-uuid",
      "name": "Perforación de sondeos",
      "status": "completed",
      "completedAt": "2025-02-01T00:00:00Z"
    }
  ],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-02-15T00:00:00Z"
}
```

### Create Project

```http
POST /projects
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "name": "Nuevo Proyecto de Ingeniería",
  "description": "Descripción detallada del proyecto",
  "clientId": "client-uuid",
  "startDate": "2025-03-01",
  "endDate": "2025-06-01",
  "budget": 75000.0,
  "status": "planning"
}
```

**Response:**

```json
{
  "id": "new-project-uuid",
  "name": "Nuevo Proyecto de Ingeniería",
  "status": "planning",
  "createdAt": "2025-02-24T00:00:00Z",
  "message": "Project created successfully"
}
```

### Update Project

```http
PUT /projects/{id}
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "name": "Nombre Actualizado",
  "status": "active",
  "budget": 80000.0
}
```

### Delete Project

```http
DELETE /projects/{id}
Authorization: Bearer {token}
```

**Response:**

```json
{
  "message": "Project deleted successfully"
}
```

---

## 🛠️ Services Endpoints

### Get All Services

```http
GET /services
```

**Response:**

```json
{
  "data": [
    {
      "id": "service-uuid",
      "name": "Estudio Geotécnico",
      "description": "Análisis completo de suelos",
      "category": "geotechnical",
      "basePrice": 15000.0,
      "duration": "30 days",
      "isActive": true
    }
  ]
}
```

### Get Service by ID

```http
GET /services/{id}
```

### Request Service Quote

```http
POST /services/{id}/quote
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "projectDetails": "Detalles específicos del proyecto",
  "urgency": "normal",
  "additionalRequirements": ["Análisis químico adicional", "Informe en inglés"]
}
```

---

## 🧪 Laboratory Endpoints

### Get Lab Samples

```http
GET /lab/samples?type=apique&status=pending
Authorization: Bearer {token}
```

**Response:**

```json
{
  "data": [
    {
      "id": "sample-uuid",
      "code": "APQ-2025-001",
      "type": "apique",
      "depth": 2.5,
      "location": "Sondeo 1",
      "status": "pending",
      "collectedAt": "2025-02-20T00:00:00Z",
      "project": {
        "id": "project-uuid",
        "name": "Proyecto Example"
      }
    }
  ]
}
```

### Create Lab Sample

```http
POST /lab/samples
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "code": "APQ-2025-002",
  "type": "apique",
  "projectId": "project-uuid",
  "depth": 3.0,
  "location": "Sondeo 2",
  "description": "Muestra de arcilla"
}
```

### Update Sample Results

```http
PUT /lab/samples/{id}/results
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "results": {
    "moistureContent": 18.5,
    "liquidLimit": 45.2,
    "plasticLimit": 22.8,
    "classification": "CL"
  },
  "notes": "Arcilla de baja plasticidad",
  "testedBy": "tech-uuid"
}
```

---

## 📄 PDF Generation Endpoints

### Generate PDF Report

```http
POST /pdf/generate
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "templateType": "lab-report",
  "data": {
    "projectId": "project-uuid",
    "sampleIds": ["sample-1", "sample-2"],
    "includeGraphs": true,
    "language": "es"
  },
  "options": {
    "format": "A4",
    "orientation": "portrait",
    "includeWatermark": true
  }
}
```

**Response:**

```json
{
  "pdfUrl": "/uploads/pdfs/report-uuid.pdf",
  "filename": "informe-laboratorio-2025-02-24.pdf",
  "size": "2.5 MB",
  "generatedAt": "2025-02-24T10:30:00Z"
}
```

### Get PDF Templates

```http
GET /pdf/templates
Authorization: Bearer {token}
```

**Response:**

```json
{
  "templates": [
    {
      "id": "lab-report",
      "name": "Informe de Laboratorio",
      "description": "Reporte completo de análisis de suelos",
      "requiredFields": ["projectId", "sampleIds"]
    },
    {
      "id": "quote",
      "name": "Cotización",
      "description": "Propuesta comercial de servicios",
      "requiredFields": ["clientId", "serviceIds"]
    }
  ]
}
```

---

## 👥 Admin Endpoints

### Get All Users (Admin Only)

```http
GET /admin/users
Authorization: Bearer {admin-token}
```

### Create User (Admin Only)

```http
POST /admin/users
Authorization: Bearer {admin-token}
```

**Request Body:**

```json
{
  "email": "nuevo@example.com",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user",
  "password": "securePassword123"
}
```

### Update User Role (Admin Only)

```http
PUT /admin/users/{id}/role
Authorization: Bearer {admin-token}
```

**Request Body:**

```json
{
  "role": "admin"
}
```

---

## ❤️ Health Check Endpoints

### Basic Health Check

```http
GET /
```

**Response:**

```json
{
  "message": "API Cuentas Ingeocimyc is running",
  "version": "0.0.1",
  "timestamp": "2025-02-24T10:30:00Z",
  "uptime": "72h 15m 32s"
}
```

### Detailed Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-02-24T10:30:00Z",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "details": {
        "connection": "active",
        "latency": "15ms"
      }
    },
    {
      "name": "memory",
      "status": "healthy",
      "details": {
        "usage": "45%",
        "total": "512MB"
      }
    }
  ]
}
```

---

## 📊 Error Responses

### Formato Estándar de Errores

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    "email must be a valid email address",
    "password must be at least 8 characters long"
  ],
  "timestamp": "2025-02-24T10:30:00Z",
  "path": "/auth/login"
}
```

### Códigos de Estado HTTP

| Código | Descripción           | Ejemplo                    |
| ------ | --------------------- | -------------------------- |
| 200    | OK                    | Solicitud exitosa          |
| 201    | Created               | Recurso creado             |
| 400    | Bad Request           | Datos de entrada inválidos |
| 401    | Unauthorized          | Token inválido o expirado  |
| 403    | Forbidden             | Sin permisos suficientes   |
| 404    | Not Found             | Recurso no encontrado      |
| 409    | Conflict              | Recurso ya existe          |
| 422    | Unprocessable Entity  | Error de validación        |
| 429    | Too Many Requests     | Rate limit excedido        |
| 500    | Internal Server Error | Error del servidor         |

---

## 🔄 Rate Limiting

### Límites por Endpoint

| Endpoint         | Límite       | Ventana    |
| ---------------- | ------------ | ---------- |
| `/auth/login`    | 5 requests   | 1 minuto   |
| `/auth/*`        | 20 requests  | 15 minutos |
| `GET /projects`  | 100 requests | 15 minutos |
| `POST /projects` | 10 requests  | 15 minutos |
| `/pdf/generate`  | 5 requests   | 5 minutos  |
| `/*` (general)   | 100 requests | 15 minutos |

### Headers de Rate Limiting

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645678901
```

---

## 🔍 Query Parameters Comunes

### Paginación

- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, max: 100)

### Ordenamiento

- `sortBy`: Campo para ordenar (ej: `createdAt`, `name`)
- `sortOrder`: Dirección del orden (`ASC`, `DESC`)

### Filtrado

- `search`: Búsqueda de texto libre
- `status`: Filtrar por estado
- `dateFrom`: Fecha de inicio (ISO 8601)
- `dateTo`: Fecha de fin (ISO 8601)

### Ejemplo de URL Completa

```
GET /projects?page=2&limit=20&sortBy=createdAt&sortOrder=DESC&status=active&search=geotécnico
```

---

## 📱 Swagger Documentation

La documentación interactiva de la API está disponible en:

- **Local:** `http://localhost:5051/api-docs`
- **Production:** `https://tu-dominio.com/api-docs`

Swagger UI proporciona:

- Exploración interactiva de endpoints
- Pruebas en vivo de la API
- Esquemas de datos detallados
- Ejemplos de requests y responses

---

_Para más detalles técnicos y ejemplos adicionales, consulta la documentación de Swagger en tu instancia local._
