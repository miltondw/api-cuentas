# 📖 API de Gestión de Proyectos y Servicios INGEOCIMYC - NestJS

> **⚠️ IMPORTANTE PARA FRONTEND DEVELOPERS**: Esta API ha sido migrada de Express.js a NestJS. Algunos endpoints han cambiado de estructura. Ver sección [🚨 Cambios Críticos](#-cambios-críticos) para detalles.

## 🚨 Cambios Críticos - Migración Express → NestJS

| Módulo | Ruta Anterior (Express) | Ruta Actual (NestJS) | Estado |
|--------|------------------------|---------------------|---------|
| **Apiques** | `/api/projects/:id/apiques/*` | `/api/lab/apiques/*` | ⚠️ **CAMBIO CRÍTICO** |
| **Profiles** | `/api/projects/:id/profiles/*` | `/api/lab/profiles/*` | ⚠️ **CAMBIO CRÍTICO** |
| **Service Requests** | `/api/service-requests/*` | `/api/service-requests/*` | ✅ **COMPATIBLE** |
| **Projects** | `/api/projects/*` | `/api/projects/*` | ✅ **COMPATIBLE** |
| **Authentication** | `/api/auth/*` | `/api/auth/*` | ✅ **COMPATIBLE** |
| **Services** | `/api/services/*` | `/api/services/*` | ✅ **COMPATIBLE** |

## 📑 Tabla de Contenidos

1. [🌟 Descripción General](#-descripción-general)
2. [🏗️ Arquitectura NestJS](#️-arquitectura-nestjs)
3. [🔐 Autenticación y Autorización](#-autenticación-y-autorización)
4. [🚀 Endpoints por Módulos](#-endpoints-por-módulos)
5. [🔍 Filtros y Paginación](#-filtros-y-paginación)
6. [💻 Integración Frontend con TypeScript](#-integración-frontend-con-typescript)
7. [🛡️ Seguridad y Mejores Prácticas](#️-seguridad-y-mejores-prácticas)
8. [📊 Códigos de Estado y Errores](#-códigos-de-estado-y-errores)
9. [🔧 Configuración y Variables de Entorno](#-configuración-y-variables-de-entorno)
10. [📞 Soporte y Documentación](#-soporte-y-documentación)

---

## 🌟 Descripción General

Esta API está construida con **NestJS** y **TypeORM**, diseñada para la gestión integral de proyectos geotécnicos, solicitudes de servicios de laboratorio, autenticación basada en roles y generación de reportes. La arquitectura moderna de NestJS proporciona escalabilidad, mantenibilidad y excelente desarrollo de experiencia.

### 🚀 Características Principales

- **Arquitectura NestJS** con decoradores, guards y middlewares
- **TypeORM** para manejo robusto de base de datos MySQL
- **Sistema de roles** (admin, lab, client) con guards personalizados
- **Autenticación JWT** con estrategias de Passport
- **Documentación Swagger** automática con decoradores
- **Validación de DTOs** con class-validator
- **Rate Limiting** con @nestjs/throttler
- **Generación de PDFs** con Puppeteer
- **Arquitectura modular** organizada por roles y funcionalidades

### 🔗 URLs Base

- **Producción**: `https://api-cuentas-zlut.onrender.com`
- **Desarrollo**: `http://localhost:5051`
- **Documentación Swagger**: `/api-docs`
- **Prefijo API**: `/api`

---

## 🏗️ Arquitectura NestJS

### Estructura Modular por Roles

```
src/modules/
├── admin/              # Módulos solo para administradores
│   ├── auth.module.ts
│   └── pdf.module.ts
├── lab/                # Módulos de laboratorio
│   ├── apiques/
│   └── profiles/
├── projects/           # Gestión de proyectos
│   ├── projects.module.ts
│   ├── financial/
│   └── resumen/
├── client/             # Módulos para clientes
│   └── service-requests/
├── services/           # Catálogo de servicios (público)
└── auth/               # Autenticación base
```

### Tecnologías Core

- **Framework**: NestJS v10+
- **ORM**: TypeORM v0.3+
- **Base de Datos**: MySQL 8+
- **Autenticación**: Passport JWT
- **Validación**: class-validator
- **Documentación**: Swagger/OpenAPI
- **PDF**: Puppeteer

---

## 🔐 Autenticación y Autorización

### Sistema de Roles

| Rol      | Descripción                             | Acceso                                           |
| -------- | --------------------------------------- | ------------------------------------------------ |
| `admin`  | Administrador del sistema               | Acceso completo a todos los módulos             |
| `lab`    | Personal de laboratorio                 | Gestión de apiques, perfiles y solicitudes      |
| `client` | Cliente/Solicitante de servicios       | Creación de solicitudes y visualización         |

### 🔑 Registro de Usuario

**Endpoint**: `POST /api/auth/register`

#### DTO Interface

```typescript
interface RegisterDto {
  name?: string;          // Nombre completo (opcional)
  firstName?: string;     // Primer nombre (opcional)
  lastName?: string;      // Apellido (opcional)
  email: string;          // Email válido y único
  password: string;       // Mínimo 6 caracteres
  role?: 'admin' | 'lab' | 'client';  // Por defecto: 'client'
  jwt2?: string;          // Requerido solo para crear admin
}
```

#### Ejemplo en React con TypeScript

```tsx
import React, { useState } from 'react';
import { z } from 'zod';

// Esquema de validación
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'lab', 'client']).optional(),
  jwt2: z.string().optional(),
});

type RegisterData = z.infer<typeof registerSchema>;

interface AuthResponse {
  accessToken: string;
  user: {
    email: string;
    name: string;
    role: string;
  };
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'client',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validar datos
      const validData = registerSchema.parse(formData);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en registro');
      }

      const authData: AuthResponse = await response.json();
      
      // Guardar token
      localStorage.setItem('accessToken', authData.accessToken);
      
      // Redirigir según rol
      const redirectPath = authData.user.role === 'admin' 
        ? '/admin/dashboard' 
        : authData.user.role === 'lab'
        ? '/lab/dashboard'
        : '/client/dashboard';
        
      window.location.href = redirectPath;

    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error instanceof Error ? error.message : 'Error desconocido' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <h2>Registro de Usuario</h2>
      
      <div className="form-group">
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
          required
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <input
          type="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
          required
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <div className="form-row">
        <input
          type="text"
          placeholder="Primer nombre"
          value={formData.firstName}
          onChange={(e) => setFormData(prev => ({...prev, firstName: e.target.value}))}
        />
        <input
          type="text"
          placeholder="Apellido"
          value={formData.lastName}
          onChange={(e) => setFormData(prev => ({...prev, lastName: e.target.value}))}
        />
      </div>

      <div className="form-group">
        <select
          value={formData.role}
          onChange={(e) => setFormData(prev => ({...prev, role: e.target.value as any}))}
        >
          <option value="client">Cliente</option>
          <option value="lab">Laboratorio</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      {formData.role === 'admin' && (
        <div className="form-group">
          <input
            type="password"
            placeholder="Código de autorización admin"
            value={formData.jwt2}
            onChange={(e) => setFormData(prev => ({...prev, jwt2: e.target.value}))}
            required
          />
          {errors.jwt2 && <span className="error">{errors.jwt2}</span>}
        </div>
      )}

      {errors.general && <div className="error">{errors.general}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Registrando...' : 'Registrar'}
      </button>
    </form>
  );
};

export default RegisterForm;
```

### 🚪 Inicio de Sesión

**Endpoint**: `POST /api/auth/login`

#### DTO Interface

```typescript
interface LoginDto {
  email: string;     // Email del usuario
  password: string;  // Contraseña
}
```

#### Hook Personalizado para Autenticación

```tsx
import { useState, useContext, createContext, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  role: 'admin' | 'lab' | 'client';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (accessToken) {
        try {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          } else {
            // Token inválido
            localStorage.removeItem('accessToken');
            setAccessToken(null);
          }
        } catch (error) {
          console.error('Error verificando token:', error);
          localStorage.removeItem('accessToken');
          setAccessToken(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Credenciales inválidas');
      }

      const authData: AuthResponse = await response.json();
      
      setAccessToken(authData.accessToken);
      setUser(authData.user);
      localStorage.setItem('accessToken', authData.accessToken);

    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 🛡️ Guards y Decoradores

#### Uso de Guards Personalizados

```tsx
// Hook para peticiones autenticadas
const useAuthenticatedFetch = () => {
  const { accessToken, logout } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Manejar token expirado
    if (response.status === 401) {
      logout();
      throw new Error('Sesión expirada');
    }

    return response;
  };

  return authenticatedFetch;
};

// Componente de ruta protegida
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'lab' | 'client';
  allowedRoles?: Array<'admin' | 'lab' | 'client'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Verificando permisos...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar rol específico
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="access-denied">
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <p>Rol requerido: {requiredRole}</p>
        <p>Tu rol: {user.role}</p>
      </div>
    );
  }

  // Verificar roles permitidos
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="access-denied">
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <p>Roles permitidos: {allowedRoles.join(', ')}</p>
        <p>Tu rol: {user.role}</p>
      </div>
    );
  }

  return <>{children}</>;
};
```

---

## 🔐 Autenticación

### Información General

La API utiliza un sistema de autenticación híbrido con **JWT** (JSON Web Tokens):

- **Access Token**: Válido por 1 hora, enviado en headers o cookies
- **Refresh Token**: Válido por 30 días, almacenado en cookies HTTPOnly
- **Protección CSRF**: Requerida para operaciones de escritura

### 🔑 Registro de Usuario

**Endpoint**: `POST /api/auth/register`

#### Payload

```typescript
interface RegisterRequest {
  name: string; // Mínimo 3, máximo 50 caracteres
  email: string; // Email válido
  password: string; // Mínimo 8 caracteres, debe contener mayúscula, minúscula y número
  rol: "admin" | "usuario";
  jwt2?: string; // Requerido solo para crear usuarios admin
}
```

#### Ejemplo en React

```tsx
import { useState } from "react";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    rol: "usuario",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para cookies
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Usuario registrado:", data);
        // Redirigir al login
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input
        type="text"
        placeholder="Nombre completo"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        minLength={3}
        maxLength={50}
        required
      />
      <input
        type="email"
        placeholder="Correo electrónico"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        minLength={8}
        required
      />
      <select
        value={formData.rol}
        onChange={(e) =>
          setFormData({
            ...formData,
            rol: e.target.value as "admin" | "usuario",
          })
        }
      >
        <option value="usuario">Usuario</option>
        <option value="admin">Administrador</option>
      </select>
      <button type="submit">Registrar</button>
    </form>
  );
};
```

#### Respuesta

```json
{
  "message": "Usuario registrado exitosamente",
  "userId": 123
}
```

### 🚪 Inicio de Sesión

**Endpoint**: `POST /api/auth/login`

#### Payload

```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

#### Ejemplo en React

```tsx
import { useState, useContext } from "react";

// Context para manejar la autenticación
const AuthContext = React.createContext<{
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} | null>(null);

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const auth = useContext(AuthContext);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Esencial para recibir cookies
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // El refresh token se almacena automáticamente en cookies
        // Guardar el access token en memoria o localStorage (menos seguro)
        localStorage.setItem("accessToken", data.accessToken);

        // Actualizar contexto de autenticación
        auth?.login(data.user, data.accessToken);

        console.log("Login exitoso:", data.user);
      } else {
        console.error("Error de login:", data.error);

        if (response.status === 429) {
          console.log(`Cuenta bloqueada. Espera ${data.waitMinutes} minutos`);
        }
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Correo electrónico"
        value={credentials.email}
        onChange={(e) =>
          setCredentials({ ...credentials, email: e.target.value })
        }
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={credentials.password}
        onChange={(e) =>
          setCredentials({ ...credentials, password: e.target.value })
        }
        required
      />
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
};
```

#### Respuesta

```json
{
  "message": "Login exitoso",
  "user": {
    "id": 123,
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "rol": "usuario"
  }
}
```

### 🔄 Renovación de Token

**Endpoint**: `POST /api/auth/refresh`

#### Implementación en React

```tsx
// Hook personalizado para manejar tokens
const useTokenRefresh = () => {
  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // Las cookies se envían automáticamente
      });

      const data = await response.json();

      if (response.ok) {
        // Actualizar el access token
        localStorage.setItem("accessToken", data.accessToken);
        return data.accessToken;
      } else {
        // Token de refresco inválido, redirigir al login
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return null;
      }
    } catch (error) {
      console.error("Error refrescando token:", error);
      return null;
    }
  };

  return { refreshToken };
};

// Interceptor para requests automáticos
const createAuthenticatedFetch = () => {
  const { refreshToken } = useTokenRefresh();

  return async (url: string, options: RequestInit = {}) => {
    let accessToken = localStorage.getItem("accessToken");

    // Agregar token a headers
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // Si el token expiró, intentar refrescar
    if (response.status === 401) {
      accessToken = await refreshToken();

      if (accessToken) {
        // Reintentar con el nuevo token
        headers["Authorization"] = `Bearer ${accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      }
    }

    return response;
  };
};
```

### 🛡️ Protección CSRF

Para operaciones que modifican datos, la API requiere tokens CSRF:

```tsx
const useCSRF = () => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch("/api/auth/csrf", {
        credentials: "include",
      });
      const data = await response.json();
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    } catch (error) {
      console.error("Error obteniendo CSRF token:", error);
      return null;
    }
  };

  const authenticatedPost = async (url: string, body: any) => {
    const token = csrfToken || (await fetchCSRFToken());

    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        "X-CSRF-Token": token, // Header requerido
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
  };

  return { fetchCSRFToken, authenticatedPost };
};
```

---

## 📋 Gestión de Proyectos

### 📊 Listar Proyectos

**Endpoint**: `GET /api/projects`

#### Parámetros de consulta

- `page`: Número de página (opcional)
- `limit`: Elementos por página (opcional)

#### Ejemplo en React

```tsx
import { useState, useEffect } from "react";

interface Project {
  id: number;
  nombre: string;
  descripcion: string;
  cliente: string;
  presupuesto: number;
  fechaInicio: string;
  fechaFin: string;
  estado: "activo" | "completado" | "cancelado";
}

const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const authenticatedFetch = createAuthenticatedFetch();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await authenticatedFetch(
          `/api/projects?page=${page}&limit=10`
        );

        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Error cargando proyectos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [page]);

  if (loading) return <div>Cargando proyectos...</div>;

  return (
    <div>
      <h2>Proyectos</h2>
      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <h3>{project.nombre}</h3>
            <p>
              <strong>Cliente:</strong> {project.cliente}
            </p>
            <p>
              <strong>Presupuesto:</strong> $
              {project.presupuesto.toLocaleString()}
            </p>
            <p>
              <strong>Estado:</strong>
              <span className={`status ${project.estado}`}>
                {project.estado}
              </span>
            </p>
            <p>
              <strong>Inicio:</strong>{" "}
              {new Date(project.fechaInicio).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          Anterior
        </button>
        <span>Página {page}</span>
        <button onClick={() => setPage(page + 1)}>Siguiente</button>
      </div>
    </div>
  );
};
```

### ➕ Crear Proyecto

**Endpoint**: `POST /api/projects`

#### Payload

```typescript
interface CreateProjectRequest {
  nombre: string;
  descripcion?: string;
  cliente: string;
  presupuesto: number;
  fechaInicio: string; // ISO date string
  fechaFin?: string;
  estado: "activo" | "completado" | "cancelado";
}
```

#### Ejemplo en React

```tsx
const CreateProjectForm = () => {
  const [project, setProject] = useState<CreateProjectRequest>({
    nombre: "",
    cliente: "",
    presupuesto: 0,
    fechaInicio: "",
    estado: "activo",
  });
  const { authenticatedPost } = useCSRF();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await authenticatedPost("/api/projects", project);
      
      if (response.ok) {
        const newProject: Project = await response.json();
        toast.success("Proyecto creado exitosamente");
        router.push(`/projects/${newProject.id}`);
      } else {
        toast.error("Error al crear el proyecto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <div className="form-group">
        <label htmlFor="nombre">Nombre del Proyecto*</label>
        <input
          type="text"
          id="nombre"
          value={project.nombre}
          onChange={(e) => setProject({ ...project, nombre: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="cliente">Cliente*</label>
        <input
          type="text"
          id="cliente"
          value={project.cliente}
          onChange={(e) => setProject({ ...project, cliente: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="presupuesto">Presupuesto*</label>
        <input
          type="number"
          id="presupuesto"
          min="0"
          step="0.01"
          value={project.presupuesto}
          onChange={(e) => setProject({ ...project, presupuesto: parseFloat(e.target.value) })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="fechaInicio">Fecha de Inicio*</label>
        <input
          type="date"
          id="fechaInicio"
          value={project.fechaInicio}
          onChange={(e) => setProject({ ...project, fechaInicio: e.target.value })}
          required
        />
      </div>

      <button type="submit" className="btn-primary">
        Crear Proyecto
      </button>
    </form>
  );
};
```

---

## 🔍 Filtros y Paginación

La API implementa un sistema consistente de filtros y paginación a través de todos los módulos. Todos los endpoints de listado soportan los siguientes parámetros base:

### Parámetros de Paginación Globales

```typescript
interface PaginationParams {
  page?: number;        // Página actual (default: 1)
  limit?: number;       // Elementos por página (default: 10, max: 100)
  sortBy?: string;      // Campo para ordenar
  sortOrder?: 'ASC' | 'DESC'; // Dirección del orden (default: 'DESC')
}
```

### 📋 Service Requests - Filtros Disponibles

```typescript
interface ServiceRequestFilters extends PaginationParams {
  // Filtros de estado
  status?: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  
  // Filtros de búsqueda
  name?: string;              // Búsqueda en nombre del solicitante
  email?: string;             // Email exacto o parcial
  serviceType?: string;       // Tipo de servicio específico
  
  // Filtros de fecha
  startDate?: string;         // ISO date (YYYY-MM-DD)
  endDate?: string;           // ISO date (YYYY-MM-DD)
  
  // Filtros de ubicación
  location?: string;          // Búsqueda en ubicación del proyecto
  
  // Campos de ordenamiento disponibles
  sortBy?: 'created_at' | 'updated_at' | 'nombre' | 'status' | 'fechaSolicitud';
}
```

**Ejemplo de uso:**
```typescript
// Buscar solicitudes pendientes de los últimos 30 días
GET /api/service-requests?status=pendiente&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20&sortBy=created_at&sortOrder=DESC

// Buscar por tipo de servicio específico
GET /api/service-requests?serviceType=análisis_granulométrico&page=1&limit=10
```

### 🏗️ Projects - Filtros Disponibles

```typescript
interface ProjectFilters extends PaginationParams {
  // Filtros de estado
  status?: 'activo' | 'completado' | 'suspendido' | 'cancelado';
  
  // Filtros de búsqueda
  solicitante?: string;       // Nombre del solicitante
  nombreProyecto?: string;    // Nombre del proyecto
  obrero?: string;           // Nombre del obrero asignado
  
  // Filtros de fecha
  startDate?: string;         // Fecha de inicio del proyecto
  endDate?: string;          // Fecha de finalización
  
  // Filtros financieros
  metodoDePago?: 'efectivo' | 'transferencia' | 'cheque' | 'credito';
  
  // Campos de ordenamiento disponibles
  sortBy?: 'created_at' | 'updated_at' | 'nombreProyecto' | 'fechaInicio' | 'status';
}
```

**Ejemplo de uso:**
```typescript
// Proyectos activos ordenados por fecha
GET /api/projects?status=activo&sortBy=fechaInicio&sortOrder=ASC&page=1&limit=15

// Buscar proyectos por solicitante
GET /api/projects?solicitante=CONSTRUCTORA%20ABC&page=1&limit=10
```

### 💰 Financial - Filtros Avanzados

```typescript
interface FinancialFilters extends PaginationParams {
  // Filtros de empresa
  empresa?: string;           // Nombre de la empresa
  
  // Filtros de fecha (muy importantes para reportes financieros)
  startDate?: string;         // ISO date
  endDate?: string;          // ISO date
  month?: number;            // Mes específico (1-12)
  year?: number;             // Año específico
  
  // Filtros de tipo
  tipoGasto?: string;        // Tipo de gasto/ingreso
  categoria?: string;        // Categoría contable
  
  // Filtros de monto
  minAmount?: number;        // Monto mínimo
  maxAmount?: number;        // Monto máximo
  
  // Campos de ordenamiento específicos
  sortBy?: 'fecha' | 'monto' | 'empresa' | 'tipoGasto' | 'created_at';
}
```

**Ejemplo de uso:**
```typescript
// Gastos del último trimestre ordenados por monto
GET /api/projects/financial?startDate=2024-01-01&endDate=2024-03-31&sortBy=monto&sortOrder=DESC

// Filtrar por empresa y tipo
GET /api/projects/financial?empresa=INGEOCIMYC&tipoGasto=materiales&page=1&limit=50
```

### 🔬 Lab Apiques - Filtros Específicos

```typescript
interface ApiquesFilters extends PaginationParams {
  // Filtro principal (requerido)
  projectId: number;          // ID del proyecto asociado
  
  // Filtros de muestra
  sampleNumber?: string;      // Número de muestra
  depth?: number;            // Profundidad específica
  minDepth?: number;         // Profundidad mínima
  maxDepth?: number;         // Profundidad máxima
  
  // Filtros de ubicación
  location?: string;         // Ubicación de la muestra
  coordinates?: string;      // Coordenadas GPS
  
  // Filtros de fecha
  collectionDate?: string;   // Fecha de recolección (ISO)
  analysisDate?: string;     // Fecha de análisis (ISO)
  
  // Filtros de estado
  status?: 'collected' | 'analyzing' | 'completed' | 'reported';
  
  // Campos de ordenamiento
  sortBy?: 'depth' | 'collectionDate' | 'analysisDate' | 'sampleNumber' | 'created_at';
}
```

**Ejemplo de uso:**
```typescript
// Muestras de un proyecto específico por profundidad
GET /api/lab/apiques?projectId=123&minDepth=0&maxDepth=10&sortBy=depth&sortOrder=ASC

// Muestras completadas de los últimos 7 días
GET /api/lab/apiques?projectId=123&status=completed&analysisDate=2024-01-15&page=1&limit=25
```

### 📊 Lab Profiles - Filtros Específicos

```typescript
interface ProfilesFilters extends PaginationParams {
  // Filtro principal (requerido)
  projectId: number;          // ID del proyecto asociado
  
  // Filtros de perfil
  profileNumber?: string;     // Número del perfil
  profileType?: string;      // Tipo de perfil estratigráfico
  
  // Filtros de profundidad
  totalDepth?: number;       // Profundidad total específica
  minDepth?: number;         // Profundidad mínima
  maxDepth?: number;         // Profundidad máxima
  
  // Filtros de estratigrafía
  soilType?: string;         // Tipo de suelo encontrado
  layerCount?: number;       // Número de estratos
  
  // Filtros de fecha
  drillingDate?: string;     // Fecha de perforación (ISO)
  completionDate?: string;   // Fecha de completación (ISO)
  
  // Filtros de estado
  status?: 'drilling' | 'sampling' | 'analyzing' | 'completed' | 'reported';
  
  // Campos de ordenamiento
  sortBy?: 'profileNumber' | 'totalDepth' | 'drillingDate' | 'completionDate' | 'created_at';
}
```

**Ejemplo de uso:**
```typescript
// Perfiles por profundidad total
GET /api/lab/profiles?projectId=456&minDepth=15&maxDepth=30&sortBy=totalDepth&sortOrder=ASC

// Perfiles completados por fecha
GET /api/lab/profiles?projectId=456&status=completed&completionDate=2024-01-20&page=1&limit=10
```

### 🎯 Mejores Prácticas para Filtros

#### 1. **Combinación de Filtros**
```typescript
// ✅ Buena práctica: Combinar múltiples filtros
GET /api/service-requests?status=pendiente&serviceType=análisis_suelo&startDate=2024-01-01&page=1&limit=20&sortBy=created_at&sortOrder=DESC

// ❌ Evitar: Demasiados filtros complejos en una sola consulta
```

#### 2. **Paginación Eficiente**
```typescript
// ✅ Usar límites razonables
const defaultParams = {
  page: 1,
  limit: 20,          // Óptimo para UI
  sortBy: 'created_at',
  sortOrder: 'DESC'
};

// ❌ Evitar límites muy altos
// limit: 1000  // Puede causar problemas de performance
```

#### 3. **Filtros de Fecha**
```typescript
// ✅ Formato ISO correcto
startDate: '2024-01-01'
endDate: '2024-12-31'

// ✅ Para consultas de mes específico
month: 1,
year: 2024

// ❌ Formatos incorrectos
// startDate: '01/01/2024'
// startDate: '2024-1-1'
```

#### 4. **Manejo de Búsqueda de Texto**
```typescript
// ✅ La API maneja búsquedas parciales automáticamente
name: 'Juan'        // Encuentra: Juan Pérez, Juan Carlos, etc.
email: 'gmail'      // Encuentra: usuario@gmail.com, test@gmail.com

// ✅ URL encoding para caracteres especiales
solicitante: encodeURIComponent('CONSTRUCTORA ABC & ASOCIADOS')
```

### 📊 Estructura de Respuesta Paginada

Todos los endpoints paginados devuelven la siguiente estructura:

```typescript
interface PaginatedResponse<T> {
  data: T[];                    // Array de elementos
  pagination: {
    currentPage: number;        // Página actual
    totalPages: number;         // Total de páginas
    totalItems: number;         // Total de elementos
    itemsPerPage: number;       // Elementos por página
    hasNextPage: boolean;       // Hay página siguiente
    hasPreviousPage: boolean;   // Hay página anterior
  };
  filters?: {                   // Filtros aplicados
    [key: string]: any;
  };
  sort?: {                      // Ordenamiento aplicado
    field: string;
    direction: 'ASC' | 'DESC';
  };
}
```

**Ejemplo de respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "status": "pendiente"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 95,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "filters": {
    "status": "pendiente",
    "startDate": "2024-01-01"
  },
  "sort": {
    "field": "created_at",
    "direction": "DESC"
  }
}
```

---

## 💻 Integración Frontend con TypeScript

### Configuración Base del Cliente HTTP

```typescript
// api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para añadir token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor para manejar errores globales
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Redirect to login
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }
}

// Configuración para diferentes entornos
const apiConfig: ApiConfig = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5051/api',
  timeout: 15000,
};

export const apiClient = new ApiClient(apiConfig);
```

### Servicios Específicos por Módulo

#### 1. **Service Requests Service**

```typescript
// services/service-requests.service.ts
import { apiClient } from '../api-client';
import { PaginatedResponse } from '../types/pagination';

interface ServiceRequest {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  tipoServicio: string;
  descripcion: string;
  ubicacionProyecto: string;
  fechaSolicitud: string;
  status: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  created_at: string;
  updated_at: string;
}

interface ServiceRequestFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: string;
  name?: string;
  email?: string;
  serviceType?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

interface CreateServiceRequestDto {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  tipoServicio: string;
  descripcion: string;
  ubicacionProyecto: string;
}

class ServiceRequestsService {
  private basePath = '/service-requests';

  async getAll(filters?: ServiceRequestFilters): Promise<PaginatedResponse<ServiceRequest>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.request<PaginatedResponse<ServiceRequest>>({
      method: 'GET',
      url: `${this.basePath}?${params.toString()}`,
    });
  }

  async getById(id: number): Promise<ServiceRequest> {
    return apiClient.request<ServiceRequest>({
      method: 'GET',
      url: `${this.basePath}/${id}`,
    });
  }

  async create(data: CreateServiceRequestDto): Promise<ServiceRequest> {
    return apiClient.request<ServiceRequest>({
      method: 'POST',
      url: this.basePath,
      data,
    });
  }

  async update(id: number, data: Partial<CreateServiceRequestDto>): Promise<ServiceRequest> {
    return apiClient.request<ServiceRequest>({
      method: 'PATCH',
      url: `${this.basePath}/${id}`,
      data,
    });
  }

  async updateStatus(id: number, status: ServiceRequest['status']): Promise<ServiceRequest> {
    return apiClient.request<ServiceRequest>({
      method: 'PATCH',
      url: `${this.basePath}/${id}/status`,
      data: { status },
    });
  }

  async delete(id: number): Promise<void> {
    return apiClient.request<void>({
      method: 'DELETE',
      url: `${this.basePath}/${id}`,
    });
  }

  // Métodos de conveniencia para filtros comunes
  async getPending(page = 1, limit = 20): Promise<PaginatedResponse<ServiceRequest>> {
    return this.getAll({ status: 'pendiente', page, limit, sortBy: 'created_at', sortOrder: 'DESC' });
  }

  async getByDateRange(startDate: string, endDate: string): Promise<PaginatedResponse<ServiceRequest>> {
    return this.getAll({ startDate, endDate, sortBy: 'fechaSolicitud', sortOrder: 'DESC' });
  }

  async searchByName(name: string, page = 1): Promise<PaginatedResponse<ServiceRequest>> {
    return this.getAll({ name, page, limit: 10 });
  }
}

export const serviceRequestsService = new ServiceRequestsService();
```

#### 2. **Projects Service**

```typescript
// services/projects.service.ts
import { apiClient } from '../api-client';
import { PaginatedResponse } from '../types/pagination';

interface Project {
  id: number;
  nombreProyecto: string;
  descripcion: string;
  solicitante: string;
  fechaInicio: string;
  fechaFinalizacion?: string;
  ubicacion: string;
  status: 'activo' | 'completado' | 'suspendido' | 'cancelado';
  obrero: string;
  metodoDePago: 'efectivo' | 'transferencia' | 'cheque' | 'credito';
  created_at: string;
  updated_at: string;
}

interface ProjectFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: string;
  solicitante?: string;
  nombreProyecto?: string;
  obrero?: string;
  startDate?: string;
  endDate?: string;
  metodoDePago?: string;
}

class ProjectsService {
  private basePath = '/projects';

  async getAll(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.request<PaginatedResponse<Project>>({
      method: 'GET',
      url: `${this.basePath}?${params.toString()}`,
    });
  }

  async getById(id: number): Promise<Project> {
    return apiClient.request<Project>({
      method: 'GET',
      url: `${this.basePath}/${id}`,
    });
  }

  // Métodos específicos con filtros predefinidos
  async getActiveProjects(): Promise<PaginatedResponse<Project>> {
    return this.getAll({ 
      status: 'activo', 
      sortBy: 'fechaInicio', 
      sortOrder: 'DESC' 
    });
  }

  async getProjectsByWorker(obrero: string): Promise<PaginatedResponse<Project>> {
    return this.getAll({ 
      obrero, 
      status: 'activo',
      sortBy: 'fechaInicio' 
    });
  }

  async getProjectsByDateRange(startDate: string, endDate: string): Promise<PaginatedResponse<Project>> {
    return this.getAll({ 
      startDate, 
      endDate, 
      sortBy: 'fechaInicio', 
      sortOrder: 'ASC' 
    });
  }
}

export const projectsService = new ProjectsService();
```

#### 3. **Lab Services (Apiques & Profiles)**

```typescript
// services/lab.service.ts
import { apiClient } from '../api-client';
import { PaginatedResponse } from '../types/pagination';

interface Apique {
  id: number;
  projectId: number;
  sampleNumber: string;
  depth: number;
  location: string;
  coordinates?: string;
  collectionDate: string;
  analysisDate?: string;
  status: 'collected' | 'analyzing' | 'completed' | 'reported';
  results?: any;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: number;
  projectId: number;
  profileNumber: string;
  profileType: string;
  totalDepth: number;
  soilType: string;
  layerCount: number;
  drillingDate: string;
  completionDate?: string;
  status: 'drilling' | 'sampling' | 'analyzing' | 'completed' | 'reported';
  stratigraphicData?: any;
  created_at: string;
  updated_at: string;
}

class LabService {
  private apiquesPath = '/lab/apiques';
  private profilesPath = '/lab/profiles';

  // Apiques methods
  async getApiques(projectId: number, filters?: any): Promise<PaginatedResponse<Apique>> {
    const params = new URLSearchParams({ projectId: projectId.toString() });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.request<PaginatedResponse<Apique>>({
      method: 'GET',
      url: `${this.apiquesPath}?${params.toString()}`,
    });
  }

  async getApiqueById(id: number): Promise<Apique> {
    return apiClient.request<Apique>({
      method: 'GET',
      url: `${this.apiquesPath}/${id}`,
    });
  }

  // Profiles methods
  async getProfiles(projectId: number, filters?: any): Promise<PaginatedResponse<Profile>> {
    const params = new URLSearchParams({ projectId: projectId.toString() });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.request<PaginatedResponse<Profile>>({
      method: 'GET',
      url: `${this.profilesPath}?${params.toString()}`,
    });
  }

  async getProfileById(id: number): Promise<Profile> {
    return apiClient.request<Profile>({
      method: 'GET',
      url: `${this.profilesPath}/${id}`,
    });
  }

  // Métodos de conveniencia
  async getApiquesByDepth(projectId: number, minDepth: number, maxDepth: number): Promise<PaginatedResponse<Apique>> {
    return this.getApiques(projectId, { 
      minDepth, 
      maxDepth, 
      sortBy: 'depth', 
      sortOrder: 'ASC' 
    });
  }

  async getCompletedAnalyses(projectId: number): Promise<PaginatedResponse<Apique>> {
    return this.getApiques(projectId, { 
      status: 'completed',
      sortBy: 'analysisDate',
      sortOrder: 'DESC'
    });
  }
}

export const labService = new LabService();
```

### Hook Personalizado para React

```typescript
// hooks/useApiData.ts
import { useState, useEffect, useCallback } from 'react';
import { PaginatedResponse } from '../types/pagination';

interface UseApiDataOptions<T> {
  service: (...args: any[]) => Promise<PaginatedResponse<T>>;
  dependencies?: any[];
  initialFilters?: any;
  autoFetch?: boolean;
}

interface UseApiDataResult<T> {
  data: T[];
  pagination: PaginatedResponse<T>['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateFilters: (newFilters: any) => void;
  filters: any;
}

export function useApiData<T>({
  service,
  dependencies = [],
  initialFilters = {},
  autoFetch = true,
}: UseApiDataOptions<T>): UseApiDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<T>['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await service(filters);
      setData(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [service, filters, ...dependencies]);

  const updateFilters = useCallback((newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    data,
    pagination,
    loading,
    error,
    refetch: fetchData,
    updateFilters,
    filters,
  };
}

// Ejemplo de uso en componente React
/*
function ServiceRequestsList() {
  const {
    data: requests,
    pagination,
    loading,
    error,
    updateFilters,
    filters
  } = useApiData({
    service: (filters) => serviceRequestsService.getAll(filters),
    initialFilters: { page: 1, limit: 20, status: 'pendiente' }
  });

  const handleStatusFilter = (status: string) => {
    updateFilters({ status, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <StatusFilter onStatusChange={handleStatusFilter} />
      <RequestsList requests={requests} />
      <Pagination 
        current={pagination?.currentPage || 1}
        total={pagination?.totalPages || 1}
        onChange={handlePageChange}
      />
    </div>
  );
}
*/
```

---

## 🛡️ Seguridad y Mejores Prácticas

### 🔐 Gestión de Tokens JWT

```typescript
// auth/token-manager.ts
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  static setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    const expiryTime = Date.now() + (expiresIn * 1000);
    
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  static getAccessToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) return null;
    
    if (Date.now() > parseInt(expiry)) {
      this.clearTokens();
      return null;
    }
    
    return token;
  }

  static isTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    
    return Date.now() > parseInt(expiry);
  }

  static clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/auth/refresh',
        data: { refreshToken }
      });

      this.setTokens(
        response.accessToken, 
        response.refreshToken, 
        response.expiresIn
      );

      return response.accessToken;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }
}
```

### 🚫 Rate Limiting y Manejo de Errores

```typescript
// utils/error-handler.ts
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export class ApiErrorHandler {
  static handle(error: any): ApiError {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return {
            status,
            message: data.message || 'Solicitud inválida',
            code: 'BAD_REQUEST',
            details: data.details
          };
        
        case 401:
          TokenManager.clearTokens();
          return {
            status,
            message: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
            code: 'UNAUTHORIZED'
          };
        
        case 403:
          return {
            status,
            message: 'No tienes permisos para realizar esta acción',
            code: 'FORBIDDEN'
          };
        
        case 404:
          return {
            status,
            message: 'Recurso no encontrado',
            code: 'NOT_FOUND'
          };
        
        case 429:
          return {
            status,
            message: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
            code: 'RATE_LIMITED'
          };
        
        case 500:
          return {
            status,
            message: 'Error interno del servidor. Contacta al administrador.',
            code: 'INTERNAL_ERROR'
          };
        
        default:
          return {
            status,
            message: data.message || 'Error desconocido',
            code: 'UNKNOWN'
          };
      }
    }
    
    if (error.request) {
      return {
        status: 0,
        message: 'Error de conexión. Verifica tu conexión a internet.',
        code: 'NETWORK_ERROR'
      };
    }
    
    return {
      status: 0,
      message: error.message || 'Error desconocido',
      code: 'UNKNOWN'
    };
  }
}

// utils/retry-logic.ts
export class RetryLogic {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // No reintentar en errores 4xx (excepto 429)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Backoff exponencial
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}
```

### 🔒 Validación de Roles en Frontend

```typescript
// auth/role-guard.ts
export type UserRole = 'admin' | 'lab' | 'client';

export interface User {
  id: number;
  email: string;
  nombre: string;
  role: UserRole;
  permissions?: string[];
}

export class RoleGuard {
  private static currentUser: User | null = null;

  static setCurrentUser(user: User) {
    this.currentUser = user;
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static hasRole(requiredRole: UserRole | UserRole[]): boolean {
    if (!this.currentUser) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(this.currentUser.role);
  }

  static canAccessModule(module: string): boolean {
    if (!this.currentUser) return false;
    
    const { role } = this.currentUser;
    
    switch (module) {
      case 'admin':
        return role === 'admin';
      
      case 'lab':
        return ['admin', 'lab'].includes(role);
      
      case 'projects':
        return ['admin', 'lab'].includes(role);
      
      case 'service-requests':
        return true; // Todos los roles autenticados
      
      case 'reports':
        return ['admin', 'lab'].includes(role);
      
      default:
        return false;
    }
  }

  static canPerformAction(action: string, resource?: string): boolean {
    if (!this.currentUser) return false;
    
    const { role } = this.currentUser;
    
    // Definir permisos por rol
    const permissions = {
      admin: ['create', 'read', 'update', 'delete', 'approve', 'report'],
      lab: ['create', 'read', 'update', 'report'],
      client: ['create', 'read']
    };
    
    return permissions[role]?.includes(action) || false;
  }
}

// Hook para componentes React
export function useAuth() {
  const [user, setUser] = useState<User | null>(RoleGuard.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = TokenManager.getAccessToken();
        if (!token) {
          setLoading(false);
          return;
        }

        // Verificar token y obtener usuario
        const userData = await apiClient.request<User>({
          method: 'GET',
          url: '/auth/me'
        });

        RoleGuard.setCurrentUser(userData);
        setUser(userData);
      } catch (error) {
        TokenManager.clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.request({
      method: 'POST',
      url: '/auth/login',
      data: { email, password }
    });

    TokenManager.setTokens(
      response.accessToken, 
      response.refreshToken, 
      response.expiresIn
    );

    RoleGuard.setCurrentUser(response.user);
    setUser(response.user);
    
    return response.user;
  };

  const logout = () => {
    TokenManager.clearTokens();
    RoleGuard.setCurrentUser(null);
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    hasRole: RoleGuard.hasRole,
    canAccess: RoleGuard.canAccessModule,
    canPerform: RoleGuard.canPerformAction
  };
}
```

---

## 📊 Códigos de Estado y Errores

### Códigos de Estado HTTP

| Código | Estado | Descripción | Cuándo Ocurre |
|--------|--------|-------------|---------------|
| **200** | `OK` | Solicitud exitosa | GET, PATCH exitosos |
| **201** | `Created` | Recurso creado exitosamente | POST exitoso |
| **204** | `No Content` | Operación exitosa sin contenido | DELETE exitoso |
| **400** | `Bad Request` | Datos de entrada inválidos | Validación de DTOs fallida |
| **401** | `Unauthorized` | Token ausente o inválido | Sin autenticación |
| **403** | `Forbidden` | Sin permisos para la acción | Role/permissions insuficientes |
| **404** | `Not Found` | Recurso no encontrado | ID inexistente |
| **409** | `Conflict` | Conflicto con estado actual | Email duplicado, etc. |
| **422** | `Unprocessable Entity` | Datos válidos pero lógicamente incorrectos | Business logic errors |
| **429** | `Too Many Requests` | Rate limit excedido | Throttling activado |
| **500** | `Internal Server Error` | Error interno del servidor | Error no manejado |

### Estructura de Respuestas de Error

Todos los errores siguen el formato estándar de NestJS:

```typescript
interface ErrorResponse {
  statusCode: number;           // Código HTTP
  message: string | string[];   // Mensaje(s) de error
  error: string;               // Tipo de error
  timestamp: string;           // ISO timestamp
  path: string;               // Endpoint que causó el error
  details?: any;              // Detalles adicionales (opcional)
}
```

### Ejemplos de Respuestas de Error

#### 400 - Validación de Datos
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "telefono must be a string",
    "tipoServicio should not be empty"
  ],
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/service-requests"
}
```

#### 401 - No Autenticado
```json
{
  "statusCode": 401,
  "message": "Token de acceso requerido",
  "error": "Unauthorized",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/projects"
}
```

#### 403 - Sin Permisos
```json
{
  "statusCode": 403,
  "message": "Acceso denegado. Se requiere rol de administrador",
  "error": "Forbidden",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/projects/123"
}
```

#### 404 - Recurso No Encontrado
```json
{
  "statusCode": 404,
  "message": "Proyecto con ID 999 no encontrado",
  "error": "Not Found",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/projects/999"
}
```

#### 422 - Error de Lógica de Negocio
```json
{
  "statusCode": 422,
  "message": "No se puede eliminar un proyecto con solicitudes activas",
  "error": "Unprocessable Entity",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/projects/123",
  "details": {
    "activeRequestsCount": 3,
    "requiredAction": "Complete or cancel active requests first"
  }
}
```

#### 429 - Rate Limit Excedido
```json
{
  "statusCode": 429,
  "message": "Demasiadas solicitudes. Intente nuevamente en 60 segundos",
  "error": "Too Many Requests",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/service-requests",
  "details": {
    "retryAfter": 60,
    "limit": 100,
    "windowMs": 900000
  }
}
```

### Manejo de Errores en Frontend

```typescript
// utils/error-utils.ts
export function getErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    const { message } = error.response.data;
    
    // Si es un array de mensajes de validación
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    
    return message;
  }
  
  // Errores de red
  if (error.code === 'NETWORK_ERROR') {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }
  
  return 'Ha ocurrido un error inesperado. Intenta de nuevo.';
}

export function isRetryableError(error: any): boolean {
  const status = error.response?.status;
  
  // Reintentar en errores de servidor y rate limiting
  return status >= 500 || status === 429 || error.code === 'NETWORK_ERROR';
}

export function getRetryDelay(error: any): number {
  // Si el servidor especifica retryAfter
  const retryAfter = error.response?.data?.details?.retryAfter;
  if (retryAfter) {
    return retryAfter * 1000; // Convertir a millisegundos
  }
  
  // Delay por defecto basado en el tipo de error
  const status = error.response?.status;
  switch (status) {
    case 429: return 60000; // 1 minuto para rate limiting
    case 502:
    case 503:
    case 504: return 5000;  // 5 segundos para errores de servidor
    default: return 1000;   // 1 segundo por defecto
  }
}
```

---

## 🔧 Configuración y Variables de Entorno

### Variables de Entorno Requeridas

#### Servidor (Backend)
```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=ingeocimyc_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Servidor
PORT=5051
NODE_ENV=production

# CORS
CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.com

# Rate Limiting
THROTTLE_TTL=900000    # 15 minutos
THROTTLE_LIMIT=100     # 100 requests por ventana

# PDF Generation
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Logging
LOG_LEVEL=info
```

#### Frontend (Cliente)
```env
# API Configuration
REACT_APP_API_URL=https://api-cuentas-zlut.onrender.com/api
REACT_APP_API_TIMEOUT=15000

# Environment
REACT_APP_ENV=production

# Features flags
REACT_APP_ENABLE_DEVTOOLS=false
REACT_APP_ENABLE_LOGGING=true

# Rate limiting awareness
REACT_APP_RETRY_ATTEMPTS=3
REACT_APP_RETRY_DELAY=1000
```

### Configuración de CORS

La API está configurada para aceptar requests desde:
- `http://localhost:3000` (desarrollo)
- Dominios de producción especificados en `CORS_ORIGIN`

### Rate Limiting

- **Límite**: 100 requests por 15 minutos por IP
- **Scope**: Global (todos los endpoints)
- **Headers de respuesta**:
  - `X-RateLimit-Limit`: Límite total
  - `X-RateLimit-Remaining`: Requests restantes
  - `X-RateLimit-Reset`: Timestamp de reset

---

## 🚀 Endpoints por Módulos

### 📝 Service Requests

**Base URL**: `/api/service-requests`

| Método | Endpoint | Descripción | Roles | Parámetros |
|--------|----------|-------------|-------|------------|
| `GET` | `/` | Listar solicitudes | `all` | [Filtros disponibles](#service-requests---filtros-disponibles) |
| `GET` | `/:id` | Obtener solicitud específica | `all` | `id`: number |
| `POST` | `/` | Crear nueva solicitud | `all` | [CreateServiceRequestDto](#crear-solicitud) |
| `PATCH` | `/:id` | Actualizar solicitud | `admin`, `lab` | `id`: number + datos parciales |
| `PATCH` | `/:id/status` | Cambiar estado | `admin`, `lab` | `id`: number + `{status}` |
| `DELETE` | `/:id` | Eliminar solicitud | `admin` | `id`: number |

#### Crear Solicitud
```typescript
interface CreateServiceRequestDto {
  nombre: string;              // Nombre del solicitante
  email: string;              // Email de contacto
  telefono: string;           // Teléfono de contacto  
  empresa: string;            // Empresa solicitante
  tipoServicio: string;       // Tipo de servicio requerido
  descripcion: string;        // Descripción detallada
  ubicacionProyecto: string;  // Ubicación del proyecto
}
```

**Ejemplo de uso:**
```typescript
// Crear nueva solicitud
const newRequest = await serviceRequestsService.create({
  nombre: "Juan Pérez",
  email: "juan@constructora.com",
  telefono: "+57 300 123 4567",
  empresa: "CONSTRUCTORA ABC",
  tipoServicio: "Análisis granulométrico",
  descripcion: "Análisis de suelo para cimentación de edificio",
  ubicacionProyecto: "Calle 123 #45-67, Bogotá"
});

// Buscar solicitudes pendientes
const pendingRequests = await serviceRequestsService.getAll({
  status: 'pendiente',
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'DESC'
});

// Actualizar estado
await serviceRequestsService.updateStatus(123, 'en_progreso');
```

### 🏗️ Projects

**Base URL**: `/api/projects`  
**Roles requeridos**: `admin`, `lab`

| Método | Endpoint | Descripción | Roles | Parámetros |
|--------|----------|-------------|-------|------------|
| `GET` | `/` | Listar proyectos | `admin`, `lab` | [Filtros disponibles](#projects---filtros-disponibles) |
| `GET` | `/:id` | Obtener proyecto específico | `admin`, `lab` | `id`: number |
| `POST` | `/` | Crear nuevo proyecto | `admin` | [CreateProjectDto](#crear-proyecto) |
| `PATCH` | `/:id` | Actualizar proyecto | `admin` | `id`: number + datos parciales |
| `DELETE` | `/:id` | Eliminar proyecto | `admin` | `id`: number |

#### Crear Proyecto
```typescript
interface CreateProjectDto {
  nombreProyecto: string;      // Nombre del proyecto
  descripcion: string;         // Descripción detallada
  solicitante: string;         // Cliente que solicita
  fechaInicio: string;         // ISO date
  fechaFinalizacion?: string;  // ISO date (opcional)
  ubicacion: string;           // Ubicación del proyecto
  obrero: string;             // Responsable asignado
  metodoDePago: 'efectivo' | 'transferencia' | 'cheque' | 'credito';
}
```

### 💰 Financial

**Base URL**: `/api/projects/financial`  
**Roles requeridos**: `admin`

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| `GET` | `/` | Consultar gastos/ingresos | `admin` |
| `GET` | `/summary` | Resumen financiero | `admin` |
| `POST` | `/` | Registrar movimiento | `admin` |

### 🔬 Lab - Apiques

**Base URL**: `/api/lab/apiques`  
**Roles requeridos**: `admin`, `lab`

| Método | Endpoint | Descripción | Roles | Parámetros Requeridos |
|--------|----------|-------------|-------|--------------------|
| `GET` | `/` | Listar apiques | `admin`, `lab` | `projectId`: number |
| `GET` | `/:id` | Obtener apique específico | `admin`, `lab` | `id`: number |
| `POST` | `/` | Crear nuevo apique | `admin`, `lab` | [CreateApiqueDto](#crear-apique) |
| `PATCH` | `/:id` | Actualizar apique | `admin`, `lab` | `id`: number |
| `DELETE` | `/:id` | Eliminar apique | `admin` | `id`: number |

### 🏔️ Lab - Profiles

**Base URL**: `/api/lab/profiles`  
**Roles requeridos**: `admin`, `lab`

| Método | Endpoint | Descripción | Roles | Parámetros Requeridos |
|--------|----------|-------------|-------|--------------------|
| `GET` | `/` | Listar perfiles | `admin`, `lab` | `projectId`: number |
| `GET` | `/:id` | Obtener perfil específico | `admin`, `lab` | `id`: number |
| `POST` | `/` | Crear nuevo perfil | `admin`, `lab` | [CreateProfileDto](#crear-perfil) |
| `PATCH` | `/:id` | Actualizar perfil | `admin`, `lab` | `id`: number |
| `DELETE` | `/:id` | Eliminar perfil | `admin` | `id`: number |

### 🔐 Authentication

**Base URL**: `/api/auth`

| Método | Endpoint | Descripción | Roles | Parámetros |
|--------|----------|-------------|-------|------------|
| `POST` | `/register` | Registrar usuario | `admin` | [RegisterDto](#registro) |
| `POST` | `/login` | Iniciar sesión | `public` | [LoginDto](#login) |
| `POST` | `/refresh` | Renovar token | `authenticated` | `{refreshToken}` |
| `GET` | `/me` | Perfil actual | `authenticated` | - |
| `POST` | `/logout` | Cerrar sesión | `authenticated` | - |

#### Registro
```typescript
interface RegisterDto {
  email: string;
  password: string;
  nombre: string;
  role: 'admin' | 'lab' | 'client';
}
```

#### Login
```typescript
interface LoginDto {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    email: string;
    nombre: string;
    role: string;
  };
}
```

**Ejemplo de flujo de autenticación:**
```typescript
// Login
const loginResponse = await authService.login({
  email: "admin@ingeocimyc.com",
  password: "securePassword123"
});

// Guardar tokens
TokenManager.setTokens(
  loginResponse.accessToken,
  loginResponse.refreshToken,
  loginResponse.expiresIn
);

// Usar API autenticada
const projects = await projectsService.getAll();

// Refresh automático cuando sea necesario
const refreshedToken = await TokenManager.refreshAccessToken();
```

---

## 📞 Soporte y Documentación

### 📚 Documentación Adicional

- **Swagger UI**: Disponible en `/api-docs` en el servidor
- **Configuración de Permisos**: Ver `docs/CONFIGURACION_PERMISOS.md`
- **Migraciones de DB**: Ver `src/database/migrations/`
- **Tests**: Ver `src/**/*.spec.ts`

### 🆘 Resolución de Problemas Comunes

#### 1. **Error 401 - Token Inválido**
```typescript
// Verificar expiración del token
if (TokenManager.isTokenExpired()) {
  const newToken = await TokenManager.refreshAccessToken();
  if (!newToken) {
    // Redirect a login
    window.location.href = '/login';
  }
}
```

#### 2. **Error 429 - Rate Limit**
```typescript
// Implementar retry con backoff
const response = await RetryLogic.withRetry(
  () => apiClient.request(config),
  3,  // 3 intentos
  1000 // 1 segundo inicial
);
```

#### 3. **Error 403 - Sin Permisos**
```typescript
// Verificar roles antes de hacer requests
if (!RoleGuard.canAccessModule('admin')) {
  throw new Error('Acceso denegado');
}
```

#### 4. **Performance con Filtros**
```typescript
// Usar debounce para búsquedas
const debouncedSearch = useCallback(
  debounce((term: string) => {
    updateFilters({ name: term, page: 1 });
  }, 300),
  []
);
```

### 📧 Contacto de Soporte

- **Email**: soporte@ingeocimyc.com
- **Documentación**: Este archivo (API.md)
- **Issues**: Reportar en el repositorio del proyecto
- **Slack**: Canal #api-support (interno)

### 🔄 Actualizaciones de la API

Esta documentación corresponde a la **versión NestJS v1.0** de la API. 

**Changelog importantes:**
- **v1.0**: Migración completa de Express.js a NestJS
- **v0.9**: Últimas funcionalidades en Express.js
- **v0.8**: Sistema de roles implementado

Para notificaciones de cambios en la API, suscríbete a las actualizaciones del repositorio.

---

**📝 Última actualización**: Enero 2024  
**🧑‍💻 Mantenido por**: Equipo de Desarrollo INGEOCIMYC  
**📖 Versión de documentación**: 2.0.0
