# 🔌 API Interfaces - INGEOCIMYC Frontend

> Interfaces TypeScript completas para el consumo de la API de gestión de proyectos y servicios INGEOCIMYC

## 📋 Tabla de Contenidos

- [🔐 Autenticación](#-autenticación)
- [👤 Usuario y Perfil](#-usuario-y-perfil)
- [📁 Proyectos](#-proyectos)
- [🕳️ Apiques](#️-apiques)
- [📊 Perfiles](#-perfiles)
- [📝 Solicitudes de Servicio](#-solicitudes-de-servicio)
- [🛠️ Servicios](#️-servicios)
- [💰 Financiero](#-financiero)
- [📄 PDF](#-pdf)
- [🏥 Sistema](#-sistema)
- [🔧 Utilidades y Tipos Comunes](#-utilidades-y-tipos-comunes)

---

## 🔐 Autenticación

### Interfaces de Login

```typescript
// Request para login
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Response del login
export interface LoginResponse {
  accessToken: string;
  user: UserInfo;
  expiresIn: number;
  sessionInfo: SessionInfo;
}

export interface UserInfo {
  email: string;
  name: string;
  role: 'admin' | 'lab' | 'client';
}

export interface SessionInfo {
  isRememberMe: boolean;
  expiresAt: string;
  isNewDevice: boolean;
}
```

### Interfaces de Registro

```typescript
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'lab' | 'client';
  jwt2?: string; // Para crear admin
}

export interface RegisterResponse {
  accessToken: string;
  user: UserInfo;
  expiresIn: number;
}
```

### Interfaces de Sesión

```typescript
export interface UserSession {
  id: number;
  ipAddress: string;
  deviceInfo: DeviceInfo;
  country?: string;
  city?: string;
  isRememberMe: boolean;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface DeviceInfo {
  os: string;
  device: string;
  engine: string;
  browser: string;
}

export interface LogoutRequest {
  logoutAll?: boolean;
  reason?: string;
}

export interface LogoutResponse {
  message: string;
  sessionsRevoked: number;
}
```

---

## 👤 Usuario y Perfil

### Perfil de Usuario

```typescript
export interface UserProfile {
  user: UserDetails;
  sessionStats: SessionStats;
  recentSessions: UserSession[];
}

export interface UserDetails {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  lastLoginIp: string;
  loginCount: number;
  twoFactorEnabled: boolean;
  isActive: boolean;
  lastPasswordChange: string;
}

export interface SessionStats {
  activeSessions: number;
  totalSessions: number;
  rememberMeSessions: number;
  expiredSessions: number;
}
```

### Cambio de Contraseña

```typescript
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  logoutOtherSessions?: boolean;
}

export interface ChangePasswordResponse {
  message: string;
  sessionsRevoked: number;
}
```

---

## 📁 Proyectos

### Interfaces Principales

```typescript
export interface Project {
  id: number;
  fecha: string;
  solicitante: string;
  nombreProyecto: string;
  obrero: string;
  costoServicio: string;
  abono: string;
  factura: string;
  valorRetencion: string;
  metodoDePago: string;
  estado: ProjectStatus;
  created_at: string;
  expenses?: ProjectExpense[];
}

export type ProjectStatus = 'activo' | 'completado' | 'cancelado' | 'pausado';

export interface CreateProjectRequest {
  fecha: string;
  solicitante: string;
  nombreProyecto: string;
  obrero: string;
  costoServicio: string;
  abono: string;
  factura?: string;
  valorRetencion?: string;
  metodoDePago: string;
  estado: ProjectStatus;
}

export interface UpdateProjectRequest {
  fecha?: string;
  solicitante?: string;
  nombreProyecto?: string;
  obrero?: string;
  costoServicio?: string;
  abono?: string;
  factura?: string;
  valorRetencion?: string;
  metodoDePago?: string;
  estado?: ProjectStatus;
}
```

### Listas y Filtros

```typescript
export interface ProjectsListResponse {
  data: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  solicitante?: string;
  nombreProyecto?: string;
  obrero?: string;
  metodoDePago?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProjectSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalValue: string;
  totalPayments: string;
  pendingAmount: string;
  monthlyStats: MonthlyProjectStats[];
}

export interface MonthlyProjectStats {
  month: string;
  count: number;
  value: string;
}
```

### Gastos de Proyecto

```typescript
export interface ProjectExpense {
  id: number;
  proyectoId: number;
  camioneta: string;
  campo: string;
  obreros: string;
  comidas: string;
  otros: string;
  peajes: string;
  combustible: string;
  hospedaje: string;
  otrosCampos: Record<string, number> | null;
}

export interface CreateProjectExpenseRequest {
  proyectoId: number;
  camioneta: string;
  campo: string;
  obreros: string;
  comidas: string;
  otros: string;
  peajes: string;
  combustible: string;
  hospedaje: string;
  otrosCampos?: Record<string, number>;
}

export interface UpdateProjectExpenseRequest {
  camioneta?: string;
  campo?: string;
  obreros?: string;
  comidas?: string;
  otros?: string;
  peajes?: string;
  combustible?: string;
  hospedaje?: string;
  otrosCampos?: Record<string, number>;
}
```

### Pagos

```typescript
export interface PaymentRequest {
  amount: string;
  date: string;
  method: string;
  description?: string;
}
```

---

## 🕳️ Apiques

### Interfaces Principales

```typescript
export interface Apique {
  id: number;
  projectId: number;
  apique: number;
  location: string;
  depth: string;
  date: string;
  cbr_unaltered: number;
  depth_tomo: string;
  molde: number;
  created_at: string;
  updated_at: string;
  project?: Project;
  layers?: ApiqueLayer[];
}

export interface ApiqueLayer {
  id: number;
  apiqueId: number;
  layerNumber: number;
  thickness: string;
  sampleId?: string;
  observation?: string;
}

export interface CreateApiqueRequest {
  projectId: number;
  apique: number;
  location: string;
  depth: string;
  date: string;
  cbr_unaltered: number;
  depth_tomo: string;
  molde: number;
}

export interface UpdateApiqueRequest {
  apique?: number;
  location?: string;
  depth?: string;
  date?: string;
  cbr_unaltered?: number;
  depth_tomo?: string;
  molde?: number;
}
```

### Listas y Respuestas

```typescript
export interface ApiquesListResponse {
  data: Apique[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectWithApiques {
  proyecto_id: number;
  nombre_proyecto: string;
  solicitante: string;
  obrero: string;
  fecha: string;
  estado: ProjectStatus;
  total_apiques: number;
  apiques: ApiqueWithLayers[];
}

export interface ApiqueWithLayers {
  apique_id: number;
  apique: number;
  location: string;
  depth: string;
  date: string;
  cbr_unaltered: number;
  depth_tomo: string;
  molde: number;
  total_layers: number;
  layers: ApiqueLayer[];
}

export interface ApiqueFilters {
  apiqueNumber?: number;
  startDepth?: number;
  endDepth?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

---

## 📊 Perfiles

### Interfaces Principales

```typescript
export interface Profile {
  id: number;
  projectId: number;
  soundingNumber: string;
  waterLevel: string;
  profileDate: string;
  samplesNumber: number;
  location?: string;
  created_at: string;
  updatedAt: string;
  project?: Project;
  blows?: ProfileBlow[];
}

export interface ProfileBlow {
  id: number;
  profileId: number;
  depth: string;
  blows6: number;
  blows12: number;
  blows18: number;
  n: number;
  observation?: string;
}

export interface CreateProfileRequest {
  projectId: number;
  soundingNumber: string;
  waterLevel: string;
  profileDate: string;
  samplesNumber: number;
  location?: string;
}

export interface UpdateProfileRequest {
  soundingNumber?: string;
  waterLevel?: string;
  profileDate?: string;
  samplesNumber?: number;
  location?: string;
}
```

### Listas y Respuestas

```typescript
export interface ProfilesListResponse {
  data: Profile[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectWithProfiles {
  proyecto_id: number;
  nombre_proyecto: string;
  solicitante: string;
  obrero: string;
  fecha: string;
  estado: ProjectStatus;
  total_profiles: number;
  profiles: ProfileWithBlows[];
}

export interface ProfileWithBlows {
  profile_id: number;
  soundingNumber: string;
  waterLevel: string;
  profileDate: string;
  samplesNumber: number;
  location?: string;
  total_blows: number;
  blows: ProfileBlow[];
}

export interface CreateBlowRequest {
  depth: string;
  blows6: number;
  blows12: number;
  blows18: number;
  n: number;
  observation?: string;
}
```

---

## 📝 Solicitudes de Servicio

### Interfaces Principales

```typescript
export interface ServiceRequest {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  empresa?: string;
  direccion?: string;
  servicio: string;
  descripcion: string;
  estado: ServiceRequestStatus;
  fecha_solicitud: string;
  fecha_respuesta?: string;
  notas_internas?: string;
  created_at: string;
  updated_at?: string;
}

export type ServiceRequestStatus =
  | 'pendiente'
  | 'en_proceso'
  | 'completada'
  | 'cancelada';

export interface CreateServiceRequestRequest {
  nombre: string;
  email: string;
  telefono: string;
  empresa?: string;
  direccion?: string;
  servicio: string;
  descripcion: string;
}

export interface UpdateServiceRequestRequest {
  nombre?: string;
  email?: string;
  telefono?: string;
  empresa?: string;
  direccion?: string;
  servicio?: string;
  descripcion?: string;
  estado?: ServiceRequestStatus;
  fecha_respuesta?: string;
  notas_internas?: string;
}
```

### Listas y Filtros

```typescript
export interface ServiceRequestsListResponse {
  data: ServiceRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface ServiceRequestFilters {
  estado?: ServiceRequestStatus;
  servicio?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

---

## 🛠️ Servicios

### Interfaces de Servicios

```typescript
export interface Service {
  id: number;
  nombre: string;
  descripcion: string;
  precio_base?: string;
  categoria: string;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateServiceRequest {
  nombre: string;
  descripcion: string;
  precio_base?: string;
  categoria: string;
  activo?: boolean;
}

export interface UpdateServiceRequest {
  nombre?: string;
  descripcion?: string;
  precio_base?: string;
  categoria?: string;
  activo?: boolean;
}

export interface ServicesListResponse {
  data: Service[];
  total: number;
  page: number;
  limit: number;
}
```

---

## 💰 Financiero

### Gastos de Empresa

```typescript
export interface CompanyExpense {
  id: number;
  mes: string;
  arriendo_oficina: string;
  servicios_publicos: string;
  combustible: string;
  viaticos: string;
  salarios: string;
  prestaciones_sociales: string;
  seguros: string;
  mantenimiento_equipos: string;
  papeleria: string;
  otros_gastos: string;
  total_gastos: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateCompanyExpenseRequest {
  mes: string;
  arriendo_oficina: string;
  servicios_publicos: string;
  combustible: string;
  viaticos: string;
  salarios: string;
  prestaciones_sociales: string;
  seguros: string;
  mantenimiento_equipos: string;
  papeleria: string;
  otros_gastos: string;
}

export interface UpdateCompanyExpenseRequest {
  mes?: string;
  arriendo_oficina?: string;
  servicios_publicos?: string;
  combustible?: string;
  viaticos?: string;
  salarios?: string;
  prestaciones_sociales?: string;
  seguros?: string;
  mantenimiento_equipos?: string;
  papeleria?: string;
  otros_gastos?: string;
}
```

### Resumen Financiero

```typescript
export interface FinancialSummary {
  id: number;
  mes: string;
  total_ingresos: string;
  total_gastos_empresa: string;
  total_gastos_proyectos: string;
  utilidad_bruta: string;
  utilidad_neta: string;
  margen_utilidad: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateFinancialSummaryRequest {
  mes: string;
  total_ingresos: string;
  total_gastos_empresa: string;
  total_gastos_proyectos: string;
}

export interface UpdateFinancialSummaryRequest {
  mes?: string;
  total_ingresos?: string;
  total_gastos_empresa?: string;
  total_gastos_proyectos?: string;
}

export interface FinancialListResponse {
  data: CompanyExpense[] | FinancialSummary[];
  total: number;
  page: number;
  limit: number;
}
```

### Resumen General

```typescript
export interface ResumenFinanciero {
  id: number;
  fecha: string;
  total_proyectos: number;
  ingresos_totales: string;
  gastos_totales: string;
  utilidad_neta: string;
  proyectos_activos: number;
  proyectos_completados: number;
  created_at: string;
}

export interface ResumenFinancieroResponse {
  data: ResumenFinanciero[];
  total: number;
  page: number;
  limit: number;
}
```

---

## 📄 PDF

### Interfaces de PDF

```typescript
export interface PDFGenerationRequest {
  serviceRequestId: number;
  template?: string;
  options?: PDFOptions;
}

export interface PDFOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
}

export interface PDFGenerationResponse {
  success: boolean;
  message: string;
  filePath?: string;
  size?: number;
}
```

---

## 🏥 Sistema

### Health Check

```typescript
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
}

export interface APIRootResponse {
  name: string;
  version: string;
  description: string;
  environment: string;
  timestamp: string;
  status: string;
  docs: string;
  endpoints: {
    auth: string;
    projects: string;
    serviceRequests: string;
    lab: string;
    services: string;
    health: string;
  };
  config: {
    port: string;
    nodeEnv: string;
    renderUrl: string;
    isProduction: boolean;
  };
}
```

---

## 🔧 Utilidades y Tipos Comunes

### Tipos de Respuesta Genéricos

```typescript
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
  method: string;
}
```

### Tipos de Filtro Comunes

```typescript
export interface BaseFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

### Constantes y Enums

```typescript
export enum UserRole {
  ADMIN = 'admin',
  LAB = 'lab',
  CLIENT = 'client',
}

export enum ProjectStatus {
  ACTIVE = 'activo',
  COMPLETED = 'completado',
  CANCELLED = 'cancelado',
  PAUSED = 'pausado',
}

export enum ServiceRequestStatus {
  PENDING = 'pendiente',
  IN_PROCESS = 'en_proceso',
  COMPLETED = 'completada',
  CANCELLED = 'cancelada',
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    SESSIONS: '/api/auth/sessions',
    REFRESH: '/api/auth/refresh',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  PROJECTS: {
    LIST: '/api/projects',
    CREATE: '/api/projects',
    DETAIL: (id: number) => `/api/projects/${id}`,
    UPDATE: (id: number) => `/api/projects/${id}`,
    DELETE: (id: number) => `/api/projects/${id}`,
    SUMMARY: '/api/projects/summary',
    EXPENSES: (id: number) => `/api/projects/${id}/expenses`,
    PAYMENTS: (id: number) => `/api/projects/${id}/payment`,
  },
  APIQUES: {
    LIST: '/api/lab/apiques',
    CREATE: '/api/lab/apiques',
    BY_PROJECT: (projectId: number) => `/api/lab/apiques/project/${projectId}`,
    DETAIL: (projectId: number, apiqueId: number) =>
      `/api/lab/apiques/${projectId}/${apiqueId}`,
    UPDATE: (projectId: number, apiqueId: number) =>
      `/api/lab/apiques/${projectId}/${apiqueId}`,
    DELETE: (projectId: number, apiqueId: number) =>
      `/api/lab/apiques/${projectId}/${apiqueId}`,
    STATISTICS: (projectId: number) =>
      `/api/lab/apiques/project/${projectId}/statistics`,
  },
  PROFILES: {
    LIST: '/api/lab/profiles',
    CREATE: '/api/lab/profiles',
    BY_PROJECT: (projectId: number) => `/api/lab/profiles/project/${projectId}`,
    BY_SOUNDING: (projectId: number, soundingNumber: string) =>
      `/api/lab/profiles/project/${projectId}/sounding/${soundingNumber}`,
    DETAIL: (id: number) => `/api/lab/profiles/${id}`,
    UPDATE: (id: number) => `/api/lab/profiles/${id}`,
    DELETE: (id: number) => `/api/lab/profiles/${id}`,
    ADD_BLOW: (profileId: number) => `/api/lab/profiles/${profileId}/blows`,
  },
  SERVICE_REQUESTS: {
    LIST: '/api/service-requests',
    CREATE: '/api/service-requests',
    DETAIL: (id: number) => `/api/service-requests/${id}`,
    UPDATE: (id: number) => `/api/service-requests/${id}`,
    DELETE: (id: number) => `/api/service-requests/${id}`,
  },
  SERVICES: {
    LIST: '/api/services',
    CREATE: '/api/services',
    DETAIL: (id: number) => `/api/services/${id}`,
    UPDATE: (id: number) => `/api/services/${id}`,
    DELETE: (id: number) => `/api/services/${id}`,
  },
  FINANCIAL: {
    EXPENSES: '/api/gastos-mes/expenses',
    SUMMARIES: '/api/gastos-mes/summaries',
    RESUMEN: '/api/resumen',
  },
  PDF: {
    SERVICE_REQUEST: (id: number) => `/api/pdf/service-request/${id}`,
    PREVIEW: (id: number) => `/api/pdf/service-request/${id}/preview`,
    REGENERATE: (id: number) => `/api/pdf/service-request/${id}/regenerate`,
  },
  SYSTEM: {
    HEALTH: '/api/health',
    ROOT: '/api',
  },
} as const;
```

---

## 🎯 Ejemplo de Uso

```typescript
// Ejemplo de uso con las interfaces
import {
  ApiResponse,
  Project,
  CreateProjectRequest,
  ProjectsListResponse,
} from './api-interfaces';

// Cliente HTTP con tipos
class ApiClient {
  async getProjects(filters?: ProjectFilters): Promise<ProjectsListResponse> {
    const response = await fetch('/api/projects', {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  async createProject(project: CreateProjectRequest): Promise<Project> {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    return response.json();
  }

  private getToken(): string {
    return localStorage.getItem('accessToken') || '';
  }
}
```

---

## ⚠️ Notas Importantes sobre las Interfaces

### 📋 Cambios Recientes (Verificado con Datos Reales)

> **Última verificación**: ${new Date().toLocaleDateString()} - Interfaces actualizadas basadas en datos reales de la API

#### ✅ **Correcciones Realizadas en Project Interface:**

1. **Campos obligatorios**: Todos los campos string son obligatorios (no opcionales):

   - `factura: string` (puede estar vacío `""` pero siempre presente)
   - `valorRetencion: string` (puede ser `"0.00"` pero siempre presente)

2. **Array de gastos incluido**:

   - `expenses?: ProjectExpense[]` - Incluido directamente en la respuesta del proyecto

3. **Eliminado `updated_at`**: No presente en los datos reales

#### ✅ **Estructura Real de ProjectExpense:**

```typescript
export interface ProjectExpense {
  id: number;
  proyectoId: number;
  camioneta: string;
  campo: string;
  obreros: string;
  comidas: string;
  otros: string;
  peajes: string;
  combustible: string;
  hospedaje: string;
  otrosCampos: Record<string, number> | null;
}
```

---

## 🎯 **Resumen de Verificación**

### ✅ \*\*Interfaces Verificadas y Correctas:

| Endpoint                         | Status | Interfaz                        | Notas                                |
| -------------------------------- | ------ | ------------------------------- | ------------------------------------ |
| `POST /api/auth/login`           | ✅     | `LoginRequest`, `LoginResponse` | Verificado con datos reales          |
| `GET /api/auth/profile`          | ✅     | `UserProfile`                   | Estructura completa                  |
| `GET /api/auth/sessions`         | ✅     | `UserSession[]`                 | Array de sesiones                    |
| `GET /api/projects`              | ✅     | `ProjectsListResponse`          | **Corregido** con expenses incluidos |
| `GET /api/projects/:id`          | ✅     | `Project`                       | Individual project con expenses      |
| `GET /api/projects/:id/expenses` | ✅     | `ProjectExpense[]`              | **Estructura real verificada**       |
| `GET /api/lab/profiles`          | ✅     | `ProfilesListResponse`          | Con profiles y blows                 |
| `GET /api/lab/apiques`           | ✅     | `ApiquesListResponse`           | Con apiques y layers                 |
| `GET /api/service-requests`      | ✅     | `ServiceRequestsListResponse`   | Requests públicos y privados         |
| `GET /api/services`              | ✅     | `Service[]`                     | Servicios disponibles                |
| `GET /api/health`                | ✅     | `HealthCheckResponse`           | Estado del sistema                   |

### ⚠️ **Endpoints que Requieren Atención:**

| Endpoint                        | Status | Problema                   |
| ------------------------------- | ------ | -------------------------- |
| `GET /api/gastos-mes/summaries` | ❌ 500 | Error interno del servidor |

### 🔧 **Recomendaciones para el Frontend:**

1. **Manejo de Montos**: Todos los valores monetarios son `string`, no `number`
2. **Campos Vacíos**: Campos como `factura` pueden estar vacíos `""` pero siempre presentes
3. **otrosCampos**: Manejar tanto `null` como objeto vacío `{}`
4. **Paginación**: Siempre incluir `page`, `limit`, `total` en las respuestas
5. **Fechas**: Formato ISO 8601 para todas las fechas

---

### 🆕 **Nuevo Endpoint de Laboratorio - `/api/lab/projects`**

#### **Respuesta del Endpoint:**

```typescript
// Interfaz principal de respuesta
export interface LabProjectsResponse {
  data: LabProjectData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: LabProjectsSummary;
}

// Estructura de cada proyecto
export interface LabProjectData {
  proyecto_id: number;
  nombre_proyecto: string;
  solicitante: string;
  obrero: string;
  fecha: string;
  estado: ProjectStatus;
  costoServicio: string;
  abono: string;
  metodoDePago: string;
  total_apiques: number; // ✅ NUEVO: Conteo de apiques
  total_profiles: number; // ✅ NUEVO: Conteo de perfiles
  created_at: string;
}

// Resumen estadístico
export interface LabProjectsSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalApiques: number;
  totalProfiles: number;
  projectsWithApiques: number;
  projectsWithProfiles: number;
}

// Filtros disponibles
export interface LabProjectFilters {
  // Filtros de búsqueda
  nombreProyecto?: string;
  solicitante?: string;
  obrero?: string;

  // Filtros de estado
  estado?: 'todos' | 'activo' | 'completado' | 'cancelado' | 'pausado';

  // Filtros de fecha
  startDate?: string; // Formato: YYYY-MM-DD
  endDate?: string; // Formato: YYYY-MM-DD

  // Filtros de conteo
  hasApiques?: boolean; // true: con apiques, false: sin apiques
  hasProfiles?: boolean; // true: con perfiles, false: sin perfiles
  minApiques?: number; // Mínimo número de apiques
  maxApiques?: number; // Máximo número de apiques
  minProfiles?: number; // Mínimo número de perfiles
  maxProfiles?: number; // Máximo número de perfiles

  // Filtros financieros
  minCosto?: string; // Costo mínimo del servicio
  maxCosto?: string; // Costo máximo del servicio
  metodoDePago?: string; // Método de pago específico

  // Paginación y ordenamiento
  page?: number; // Página actual (default: 1)
  limit?: number; // Elementos por página (default: 10)
  sortBy?:
    | 'proyecto_id'
    | 'nombre_proyecto'
    | 'solicitante'
    | 'fecha'
    | 'estado'
    | 'total_apiques'
    | 'total_profiles';
  sortOrder?: 'ASC' | 'DESC'; // Orden (default: DESC)
}
```

### 🔍 **Filtros del Endpoint `/api/lab/projects`**

```typescript
export interface LabProjectFilters {
  // Paginación
  page?: number;                    // Página actual (default: 1)
  limit?: number;                   // Elementos por página (default: 10)
  
  // Búsqueda por campos específicos
  nombreProyecto?: string;          // Busca en el NOMBRE del proyecto
  solicitante?: string;             // Busca en el SOLICITANTE
  obrero?: string;                  // Busca en el OBRERO
  
  // Búsqueda global
  search?: string;                  // Busca en nombre, solicitante y obrero
  
  // Filtros de estado y fechas
  estado?: 'activo' | 'completado' | 'cancelado' | 'pausado';
  startDate?: string;               // Fecha inicio (YYYY-MM-DD)
  endDate?: string;                 // Fecha fin (YYYY-MM-DD)
  
  // Filtros numéricos
  minCosto?: number;                // Costo mínimo del servicio
  maxCosto?: number;                // Costo máximo del servicio
  minAbono?: number;                // Abono mínimo
  maxAbono?: number;                // Abono máximo
  
  // Filtros de conteo
  hasApiques?: boolean;             // true: con apiques, false: sin apiques
  hasProfiles?: boolean;            // true: con perfiles, false: sin perfiles
  minApiques?: number;              // Mínimo número de apiques
  maxApiques?: number;              // Máximo número de apiques
  minProfiles?: number;             // Mínimo número de perfiles
  maxProfiles?: number;             // Máximo número de perfiles
  
  // Ordenamiento
  sortBy?: 'fecha' | 'nombreProyecto' | 'solicitante' | 'costoServicio' | 'estado';
  sortOrder?: 'ASC' | 'DESC';       // Orden ascendente o descendente
}
```

### 💡 **Ejemplos de Uso de Filtros**

```typescript
// ✅ Buscar por nombre del proyecto
const filtros1 = {
  nombreProyecto: 'geotecnico',     // Busca "geotecnico" en el nombre
  page: 1,
  limit: 10
};

// ✅ Buscar por solicitante
const filtros2 = {
  solicitante: 'abdul',             // Busca "abdul" en el solicitante
  page: 1,
  limit: 10
};

// ✅ Búsqueda global (recomendado para casos generales)
const filtros3 = {
  search: 'abdul',                  // Busca "abdul" en nombre, solicitante y obrero
  page: 1,
  limit: 10
};

// ✅ Filtros combinados
const filtros4 = {
  estado: 'activo',
  hasApiques: true,
  minCosto: 1000000,
  search: 'estudio',
  sortBy: 'fecha',
  sortOrder: 'DESC'
};
```

### 🎯 **Ejemplos con Datos Reales**

Basado en el proyecto: `"Estudio geotecnico para tramos viales Toledo- Labateca, Norte de Santander"` (Solicitante: `"Abdul Farud Gandur"`)

```typescript
// ✅ CASOS QUE FUNCIONAN
const ejemplosCorrectos = [
  // Buscar en el nombre del proyecto
  { nombreProyecto: 'geotecnico' },    // ✅ Encuentra el proyecto
  { nombreProyecto: 'Toledo' },        // ✅ Encuentra el proyecto
  { nombreProyecto: 'viales' },        // ✅ Encuentra el proyecto
  
  // Buscar en el solicitante
  { solicitante: 'Abdul' },            // ✅ Encuentra el proyecto
  { solicitante: 'Farud' },            // ✅ Encuentra el proyecto
  { solicitante: 'Gandur' },           // ✅ Encuentra el proyecto
  
  // Búsqueda global (busca en todos los campos)
  { search: 'Abdul' },                 // ✅ Encuentra el proyecto
  { search: 'geotecnico' },            // ✅ Encuentra el proyecto
  { search: 'Toledo' },                // ✅ Encuentra el proyecto
];

// ❌ CASOS QUE NO FUNCIONAN (uso incorrecto)
const ejemplosIncorrectos = [
  // Buscar "Abdul" en el nombre del proyecto (Abdul está en solicitante)
  { nombreProyecto: 'Abdul' },         // ❌ No encuentra nada
  
  // Buscar "geotecnico" en el solicitante (geotecnico está en el nombre)
  { solicitante: 'geotecnico' },       // ❌ No encuentra nada
];
```

### 🔧 **Migración del Frontend Actual**

Si tu frontend actual usa `nombreProyecto` para búsqueda general, cámbialo a `search`:

```typescript
// ❌ ANTES (búsqueda limitada)
const handleSearch = (searchTerm: string) => {
  updateFilter("nombreProyecto", searchTerm); // Solo busca en nombre
};

// ✅ DESPUÉS (búsqueda completa)
const handleSearch = (searchTerm: string) => {
  updateFilter("search", searchTerm); // Busca en nombre, solicitante y obrero
};
```

### 📱 **Componente de Búsqueda Recomendado**

```typescript
// Componente con búsqueda inteligente
const SearchComponent = () => {
  const [searchMode, setSearchMode] = useState<'global' | 'specific'>('global');
  
  return (
    <Box>
      {/* Búsqueda principal (global) */}
      <TextField
        fullWidth
        label="Buscar proyectos"
        value={filters.search || ""}
        onChange={(e) => updateFilter("search", e.target.value)}
        placeholder="Buscar por nombre, solicitante o obrero..."
        InputProps={{
          startAdornment: <SearchIcon />,
          endAdornment: (
            <Button onClick={() => setSearchMode(searchMode === 'global' ? 'specific' : 'global')}>
              {searchMode === 'global' ? 'Específico' : 'Global'}
            </Button>
          )
        }}
      />
      
      {/* Búsquedas específicas (opcional) */}
      <Collapse in={searchMode === 'specific'}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={4}>
            <TextField
              label="Nombre del proyecto"
              value={filters.nombreProyecto || ""}
              onChange={(e) => updateFilter("nombreProyecto", e.target.value)}
              placeholder="geotecnico, estudio..."
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Solicitante"
              value={filters.solicitante || ""}
              onChange={(e) => updateFilter("solicitante", e.target.value)}
              placeholder="Abdul, Jose Luis..."
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Obrero"
              value={filters.obrero || ""}
              onChange={(e) => updateFilter("obrero", e.target.value)}
              placeholder="daniel, carlos..."
            />
          </Grid>
        </Grid>
      </Collapse>
    </Box>
  );
};
```

---
