# Frontend Integration Guide - API Cuentas Updates

## Prompt para Claude Sonnet (Frontend Agent)

````
# CONTEXTO DEL PROYECTO

Eres un experto desarrollador frontend especializado en React + TypeScript + Vite. Necesitas actualizar un proyecto frontend existente para integrarlo con las nuevas mejoras implementadas en la API backend de "API Cuentas" (sistema de autenticación y gestión de cuentas).

## ESTADO ACTUAL DEL BACKEND

El backend (NestJS + MySQL) ha sido completamente refactorizado y mejorado con las siguientes características:

### 🔐 SISTEMA DE AUTENTICACIÓN ACTUALIZADO

#### Nuevos Endpoints y Estructura de Respuesta:
- **Respuestas Estandarizadas**: Todos los endpoints ahora devuelven un `ResponseDto<T>` estándar:
  ```typescript
  interface ResponseDto<T> {
    success: boolean;
    data: T;
    message: string;
    timestamp?: string;
    path?: string;
  }
````

#### Endpoints de Autenticación:

1. **POST /api/auth/register**

   - Body: `{ email, password, confirmPassword, name, role? }`
   - Response: `ResponseDto<AuthResponseDto>`

2. **POST /api/auth/login**

   - Body: `{ email, password, rememberMe? }`
   - Response: `ResponseDto<AuthResponseDto>`

3. **POST /api/auth/refresh**

   - Header: `Authorization: Bearer {refreshToken}`
   - Response: `ResponseDto<AuthResponseDto>`

4. **POST /api/auth/logout**

   - Header: `Authorization: Bearer {accessToken}`
   - Body: `{ logoutAllDevices?: boolean }`
   - Response: `ResponseDto<{ message: string, sessionsRevoked: number }>`

5. **GET /api/auth/profile**

   - Header: `Authorization: Bearer {accessToken}`
   - Response: `ResponseDto<UserProfile>`

6. **GET /api/auth/sessions**

   - Header: `Authorization: Bearer {accessToken}`
   - Response: `ResponseDto<UserSession[]>`

7. **PATCH /api/auth/change-password**
   - Header: `Authorization: Bearer {accessToken}`
   - Body: `{ currentPassword, newPassword, confirmNewPassword }`
   - Response: `ResponseDto<{ message: string, sessionsRevoked: number }>`

#### AuthResponseDto Structure:

```typescript
interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    lastLogin?: Date;
    loginCount?: number;
    twoFactorEnabled?: boolean;
  };
}
```

### 🔄 CARACTERÍSTICAS IMPORTANTES

1. **Refresh Tokens**: Sistema implementado y funcional
2. **Revocación de Tokens**: Los tokens se revocan correctamente en logout/cambio de contraseña
3. **Gestión de Sesiones**: Múltiples sesiones por usuario con geolocalización
4. **Rate Limiting**: Protección contra ataques de fuerza bruta
5. **Validaciones Mejoradas**: DTOs con validaciones completas
6. **Manejo de Errores**: Sistema centralizado de manejo de errores

### 🛡️ SEGURIDAD IMPLEMENTADA

- Hash de contraseñas con bcrypt (salt rounds: 12)
- JWT con expiración configurable
- Refresh tokens con rotación
- Blacklist de tokens revocados
- Logging de eventos de autenticación
- Protección contra intentos de login fallidos
- Headers de seguridad implementados

## TAREAS PARA EL FRONTEND

### 1. ACTUALIZAR TIPOS TYPESCRIPT

Crear/actualizar los tipos para manejar las nuevas estructuras:

```typescript
// types/api.ts
export interface ResponseDto<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp?: string;
  path?: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserDto;
}

export interface UserDto {
  id: number;
  email: string;
  name: string;
  role: string;
  lastLogin?: string;
  loginCount?: number;
  twoFactorEnabled?: boolean;
  isActive?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role?: 'client' | 'admin';
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserSession {
  id: number;
  ipAddress: string;
  deviceInfo: any;
  country?: string;
  city?: string;
  isRememberMe: boolean;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}
```

### 2. SERVICIO DE API ACTUALIZADO

Crear/actualizar el servicio de API para manejar:

- Interceptores para token refresh automático
- Manejo de errores estandarizado
- Estructura de respuesta nueva
- Refresh token en localStorage/sessionStorage

```typescript
// services/api.ts ejemplo de estructura esperada
class ApiService {
  private baseURL = process.env.VITE_API_URL || 'http://localhost:5051/api';

  // Métodos esperados:
  async login(data: LoginDto): Promise<AuthResponseDto>;
  async register(data: RegisterDto): Promise<AuthResponseDto>;
  async refreshToken(): Promise<AuthResponseDto>;
  async logout(
    logoutAllDevices?: boolean,
  ): Promise<{ message: string; sessionsRevoked: number }>;
  async getProfile(): Promise<UserProfile>;
  async getSessions(): Promise<UserSession[]>;
  async changePassword(
    data: ChangePasswordDto,
  ): Promise<{ message: string; sessionsRevoked: number }>;

  // Interceptores para refresh automático
  // Manejo de tokens revocados
  // Error handling centralizado
}
```

### 3. CONTEXT/STORE DE AUTENTICACIÓN

Actualizar el contexto de autenticación para:

- Manejar access y refresh tokens por separado
- Auto-refresh de tokens antes de que expiren
- Manejo de sesiones múltiples
- Estado de loading/error mejorado

### 4. COMPONENTES A ACTUALIZAR/CREAR

#### Componentes de Autenticación:

- **LoginForm**: Soporte para "Remember Me"
- **RegisterForm**: Validaciones mejoradas
- **ChangePasswordForm**: Con confirmación
- **SessionsManager**: Gestión de sesiones activas
- **ProfileSettings**: Con información de seguridad

#### Componentes de UI:

- **LoadingSpinner**: Para estados de carga
- **ErrorBoundary**: Para manejo de errores
- **Toast/Notifications**: Para feedback al usuario

### 5. VALIDACIONES FRONTEND

Implementar validaciones que coincidan con el backend:

- Email válido
- Contraseña mínimo 8 caracteres
- Confirmación de contraseñas
- Campos requeridos

### 6. MANEJO DE ERRORES

Implementar manejo de errores para:

- 401: Token expirado/inválido → Auto refresh o redirect a login
- 403: Sin permisos
- 409: Usuario ya existe
- 429: Rate limiting
- 500: Errores del servidor

### 7. FUNCIONALIDADES AVANZADAS

Implementar:

- **Auto-logout**: En múltiples tabs si token es revocado
- **Session timeout warning**: Avisar antes de que expire
- **Device management**: Ver y revocar sesiones
- **Security dashboard**: Logs de actividad
- **Offline handling**: Para cuando no hay conexión

## CONFIGURACIÓN DEL ENTORNO

Variables de entorno necesarias:

```env
VITE_API_URL=http://localhost:5051/api
VITE_TOKEN_REFRESH_MARGIN=300000  # 5 minutos antes de expirar
VITE_ENABLE_LOGGING=true
```

## MEJORES PRÁCTICAS A SEGUIR

### 🔒 Seguridad:

- No almacenar access tokens en localStorage (usar memory o httpOnly cookies si es posible)
- Refresh tokens en localStorage/sessionStorage con rotación
- Limpiar tokens en logout
- Validar tokens antes de requests importantes

### 🎨 UI/UX:

- Loading states en todas las operaciones async
- Error messages claros y actionables
- Confirmaciones para acciones destructivas
- Feedback visual para acciones exitosas

### 🧪 Testing:

- Tests unitarios para servicios de API
- Tests de integración para flujos de auth
- Mock del API service para tests

### 📱 Responsive:

- Diseño mobile-first
- Componentes accesibles (a11y)
- Performance optimizada

## ESTRUCTURA DE ARCHIVOS SUGERIDA

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ChangePasswordForm.tsx
│   │   └── SessionsManager.tsx
│   ├── ui/
│   └── layout/
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useLocalStorage.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── storage.ts
├── types/
│   ├── api.ts
│   ├── auth.ts
│   └── user.ts
├── contexts/
│   └── AuthContext.tsx
├── utils/
│   ├── validation.ts
│   ├── token.ts
│   └── error.ts
└── pages/
    ├── Login.tsx
    ├── Register.tsx
    ├── Dashboard.tsx
    └── Profile.tsx
```

## COMANDOS DE TESTING

El backend tiene scripts de testing que puedes usar como referencia:

- `node scripts/test-auth-system.js` - Test completo de autenticación
- `node scripts/test-validations.js` - Test de validaciones

Estas pruebas muestran exactamente cómo debe comportarse el frontend.

Tu tarea es analizar el código frontend existente y actualizarlo progresivamente para implementar todas estas mejoras, manteniendo la funcionalidad existente pero agregando las nuevas características y siguiendo las mejores prácticas mencionadas.

¿Por dónde te gustaría empezar? Sugiero comenzar por actualizar los tipos TypeScript y el servicio de API, luego el contexto de autenticación, y finalmente los componentes.

````

## Archivos de Referencia del Backend

Aquí tienes los archivos principales que el frontend agent puede necesitar como referencia:

### DTOs de Autenticación (Backend):
```typescript
// Estructura de los DTOs que usa el backend
interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role?: 'client' | 'admin';
}

interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    lastLogin?: Date;
    loginCount?: number;
    twoFactorEnabled?: boolean;
  };
}
````

### Endpoints Disponibles:

- Base URL: `http://localhost:5051/api`
- Prefix de auth: `/auth`
- Todos los endpoints devuelven `ResponseDto<T>`
- Headers de autorización: `Authorization: Bearer {token}`

## Scripts de Testing de Referencia

Los scripts `test-auth-system.js` y `test-validations.js` del backend muestran exactamente cómo debe comportarse el frontend y qué responses esperar.

¡Con este prompt, el agente de frontend tendrá toda la información necesaria para realizar las actualizaciones correctamente!
