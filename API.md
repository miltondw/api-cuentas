# 📖 API de Gestión de Proyectos y Servicios INGEOCIMYC - NestJS

## 📑 Tabla de Contenidos

1. [🌟 Descripción General](#-descripción-general)
2. [🏗️ Arquitectura NestJS](#️-arquitectura-nestjs)
3. [🔐 Autenticación y Autorización](#-autenticación-y-autorización)
4. [🚀 Endpoints por Módulos](#-endpoints-por-módulos)
5. [💻 Integración Frontend con TypeScript](#-integración-frontend-con-typescript)
6. [🛡️ Seguridad y Mejores Prácticas](#️-seguridad-y-mejores-prácticas)
7. [📊 Códigos de Estado y Errores](#-códigos-de-estado-y-errores)
8. [🔧 Configuración y Variables de Entorno](#-configuración-y-variables-de-entorno)
9. [📞 Soporte y Documentación](#-soporte-y-documentación)

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

## 🔬 Módulo de Laboratorio

### Gestión de Apiques

#### 📊 Listar Apiques por Proyecto

**Endpoint**: `GET /api/lab/apiques/project/:projectId`

**Roles requeridos**: `admin`, `lab`

##### Query Parameters

```typescript
interface ApiqueFilters {
  apiqueNumber?: number;
  startDepth?: number;
  endDepth?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: string;    // 'apiqueNumber' | 'depth' | 'date'
  sortOrder?: 'ASC' | 'DESC';
}
```

##### Response DTO

```typescript
interface ApiqueResponseDto {
  id: number;
  numero: number;
  profundidad: number;
  ubicacion: string;
  fecha: string;
  projectId: number;
  capas: Layer[];
  created_at: string;
  updated_at: string;
}

interface ApiqueListResponse {
  data: ApiqueResponseDto[];
  total: number;
  page: number;
  limit: number;
}
```

##### Ejemplo en React

```tsx
const ApiquesView = ({ projectId }: { projectId: number }) => {
  const [apiques, setApiques] = useState<ApiqueResponseDto[]>([]);
  const [filters, setFilters] = useState<ApiqueFilters>({
    page: 1,
    limit: 10,
    sortBy: 'apiqueNumber',
    sortOrder: 'ASC'
  });
  const [loading, setLoading] = useState(true);
  const authenticatedFetch = createAuthenticatedFetch();

  const fetchApiques = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await authenticatedFetch(
        `/api/lab/apiques/project/${projectId}?${queryParams}`
      );

      if (response.ok) {
        const data: ApiqueListResponse = await response.json();
        setApiques(data.data);
      }
    } catch (error) {
      console.error("Error cargando apiques:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiques();
  }, [projectId, filters]);

  const handleFilterChange = (key: keyof ApiqueFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  if (loading) return <div>Cargando apiques...</div>;

  return (
    <div className="apiques-container">
      <div className="filters-section">
        <div className="filter-group">
          <label>Número de Apique:</label>
          <input
            type="number"
            value={filters.apiqueNumber || ''}
            onChange={(e) => handleFilterChange('apiqueNumber', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Buscar por número"
          />
        </div>

        <div className="filter-group">
          <label>Profundidad (m):</label>
          <input
            type="number"
            step="0.1"
            value={filters.startDepth || ''}
            onChange={(e) => handleFilterChange('startDepth', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Mín"
          />
          <input
            type="number"
            step="0.1"
            value={filters.endDepth || ''}
            onChange={(e) => handleFilterChange('endDepth', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Máx"
          />
        </div>

        <div className="filter-group">
          <label>Fecha:</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
      </div>

      <div className="apiques-grid">
        {apiques.map((apique) => (
          <div key={apique.id} className="apique-card">
            <h3>Apique #{apique.numero}</h3>
            <p><strong>Profundidad:</strong> {apique.profundidad}m</p>
            <p><strong>Ubicación:</strong> {apique.ubicacion}</p>
            <p><strong>Fecha:</strong> {new Date(apique.fecha).toLocaleDateString()}</p>
            <p><strong>Capas:</strong> {apique.capas.length}</p>
            
            <div className="apique-actions">
              <button 
                onClick={() => router.push(`/lab/apiques/${apique.id}`)}
                className="btn-secondary"
              >
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      <Pagination 
        currentPage={filters.page || 1}
        onPageChange={(page) => handleFilterChange('page', page)}
        hasMore={apiques.length === (filters.limit || 10)}
      />
    </div>
  );
};
```

#### ➕ Crear Apique

**Endpoint**: `POST /api/lab/apiques`

**Roles requeridos**: `admin`, `lab`

##### Request DTO

```typescript
interface CreateApiqueDto {
  numero: number;
  profundidad: number;
  ubicacion: string;
  fecha: string; // ISO date string
  projectId: number;
  capas?: CreateLayerDto[];
}

interface CreateLayerDto {
  numero: number;
  profundidad_inicial: number;
  profundidad_final: number;
  descripcion: string;
  clasificacion_sucs?: string;
  humedad?: number;
  densidad?: number;
  observaciones?: string;
}
```

#### 📝 Obtener Apique Específico

**Endpoint**: `GET /api/lab/apiques/:projectId/:apiqueId`

**Roles requeridos**: `admin`, `lab`

#### ✏️ Actualizar Apique

**Endpoint**: `PUT /api/lab/apiques/:projectId/:apiqueId`

**Roles requeridos**: `admin`, `lab`

#### 🗑️ Eliminar Apique

**Endpoint**: `DELETE /api/lab/apiques/:projectId/:apiqueId`

**Roles requeridos**: `admin`, `lab`

#### 📈 Estadísticas de Apiques

**Endpoint**: `GET /api/lab/apiques/project/:projectId/statistics`

**Roles requeridos**: `admin`, `lab`

##### Response

```typescript
interface ApiqueStatistics {
  totalApiques: number;
  profundidadPromedio: number;
  profundidadMaxima: number;
  profundidadMinima: number;
  totalCapas: number;
  clasificacionesMasFrecuentes: {
    clasificacion: string;
    cantidad: number;
  }[];
}
```

### Gestión de Perfiles

#### 📊 Listar Perfiles por Proyecto

**Endpoint**: `GET /api/lab/profiles/project/:projectId`

**Roles requeridos**: `admin`, `lab`

##### Query Parameters

```typescript
interface ProfileFilters {
  soundingNumber?: number;
  startDepth?: number;
  endDepth?: number;
  startDate?: string;
  endDate?: string;
  hasSPT?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

##### Response DTO

```typescript
interface ProfileResponseDto {
  id: number;
  numero_sondeo: number;
  profundidad_perforada: number;
  nivel_freatico?: number;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string;
  projectId: number;
  golpes: BlowDto[];
  created_at: string;
  updated_at: string;
}

interface BlowDto {
  id: number;
  profundidad: number;
  golpes_30cm: number;
  n_spt: number;
  recuperacion: number;
  descripcion: string;
  clasificacion_sucs?: string;
}
```

#### ➕ Crear Perfil

**Endpoint**: `POST /api/lab/profiles`

**Roles requeridos**: `admin`, `lab`

##### Request DTO

```typescript
interface CreateProfileDto {
  numero_sondeo: number;
  profundidad_perforada: number;
  nivel_freatico?: number;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string;
  projectId: number;
  golpes?: CreateBlowDto[];
}

interface CreateBlowDto {
  profundidad: number;
  golpes_30cm: number;
  n_spt: number;
  recuperacion: number;
  descripcion: string;
  clasificacion_sucs?: string;
}
```

##### Ejemplo en React

```tsx
const CreateProfileForm = ({ projectId }: { projectId: number }) => {
  const [profile, setProfile] = useState<CreateProfileDto>({
    numero_sondeo: 1,
    profundidad_perforada: 0,
    fecha_inicio: '',
    fecha_fin: '',
    ubicacion: '',
    projectId,
    golpes: []
  });
  const { authenticatedPost } = useCSRF();

  const addBlow = () => {
    const newBlow: CreateBlowDto = {
      profundidad: profile.golpes.length + 1,
      golpes_30cm: 0,
      n_spt: 0,
      recuperacion: 0,
      descripcion: '',
    };
    
    setProfile(prev => ({
      ...prev,
      golpes: [...prev.golpes, newBlow]
    }));
  };

  const updateBlow = (index: number, blow: CreateBlowDto) => {
    setProfile(prev => ({
      ...prev,
      golpes: prev.golpes.map((g, i) => i === index ? blow : g)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await authenticatedPost("/api/lab/profiles", profile);
      
      if (response.ok) {
        const newProfile: ProfileResponseDto = await response.json();
        toast.success("Perfil creado exitosamente");
        router.push(`/lab/profiles/${newProfile.id}`);
      } else {
        toast.error("Error al crear el perfil");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <div className="form-section">
        <h3>Información General</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Número de Sondeo*</label>
            <input
              type="number"
              value={profile.numero_sondeo}
              onChange={(e) => setProfile({ ...profile, numero_sondeo: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Profundidad Perforada (m)*</label>
            <input
              type="number"
              step="0.1"
              value={profile.profundidad_perforada}
              onChange={(e) => setProfile({ ...profile, profundidad_perforada: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Nivel Freático (m)</label>
            <input
              type="number"
              step="0.1"
              value={profile.nivel_freatico || ''}
              onChange={(e) => setProfile({ 
                ...profile, 
                nivel_freatico: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fecha Inicio*</label>
            <input
              type="date"
              value={profile.fecha_inicio}
              onChange={(e) => setProfile({ ...profile, fecha_inicio: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Fecha Fin*</label>
            <input
              type="date"
              value={profile.fecha_fin}
              onChange={(e) => setProfile({ ...profile, fecha_fin: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Ubicación*</label>
          <input
            type="text"
            value={profile.ubicacion}
            onChange={(e) => setProfile({ ...profile, ubicacion: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <h3>Golpes SPT</h3>
          <button type="button" onClick={addBlow} className="btn-secondary">
            Agregar Golpe
          </button>
        </div>

        <div className="blows-table">
          <div className="table-header">
            <span>Prof. (m)</span>
            <span>Golpes 30cm</span>
            <span>N-SPT</span>
            <span>Recup. (%)</span>
            <span>Descripción</span>
            <span>SUCS</span>
            <span>Acciones</span>
          </div>

          {profile.golpes.map((blow, index) => (
            <div key={index} className="table-row">
              <input
                type="number"
                step="0.1"
                value={blow.profundidad}
                onChange={(e) => updateBlow(index, { 
                  ...blow, 
                  profundidad: parseFloat(e.target.value) 
                })}
              />
              <input
                type="number"
                value={blow.golpes_30cm}
                onChange={(e) => updateBlow(index, { 
                  ...blow, 
                  golpes_30cm: parseInt(e.target.value) 
                })}
              />
              <input
                type="number"
                value={blow.n_spt}
                onChange={(e) => updateBlow(index, { 
                  ...blow, 
                  n_spt: parseInt(e.target.value) 
                })}
              />
              <input
                type="number"
                step="0.1"
                value={blow.recuperacion}
                onChange={(e) => updateBlow(index, { 
                  ...blow, 
                  recuperacion: parseFloat(e.target.value) 
                })}
              />
              <input
                type="text"
                value={blow.descripcion}
                onChange={(e) => updateBlow(index, { 
                  ...blow, 
                  descripcion: e.target.value 
                })}
              />
              <input
                type="text"
                value={blow.clasificacion_sucs || ''}
                onChange={(e) => updateBlow(index, { 
                  ...blow, 
                  clasificacion_sucs: e.target.value 
                })}
              />
              <button
                type="button"
                onClick={() => setProfile(prev => ({
                  ...prev,
                  golpes: prev.golpes.filter((_, i) => i !== index)
                }))}
                className="btn-danger-small"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="btn-primary">
        Crear Perfil
      </button>
    </form>
  );
};
```

---

## 💰 Módulo Financiero

### Gestión de Gastos Empresariales

#### 📊 Listar Gastos Empresariales

**Endpoint**: `GET /api/gastos-mes/expenses`

**Roles requeridos**: `admin`

##### Query Parameters

```typescript
interface FinancialFilters {
  year?: string;    // YYYY
  month?: string;   // MM
  minAmount?: number;
  maxAmount?: number;
  hasCategory?: boolean;
  categoryName?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

##### Response DTO

```typescript
interface CompanyExpenseDto {
  id: number;
  mes: string;           // YYYY-MM
  alquiler: number;
  servicios: number;
  combustible: number;
  alimentacion: number;
  papeleria: number;
  comunicaciones: number;
  publicidad: number;
  transporte: number;
  hospedaje: number;
  otros_gastos: number;
  total: number;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}
```

#### ➕ Crear Gastos Empresariales

**Endpoint**: `POST /api/gastos-mes/expenses`

**Roles requeridos**: `admin`

##### Request DTO

```typescript
interface CreateCompanyExpenseDto {
  mes: string;           // YYYY-MM
  alquiler: number;
  servicios: number;
  combustible: number;
  alimentacion: number;
  papeleria: number;
  comunicaciones: number;
  publicidad: number;
  transporte: number;
  hospedaje: number;
  otros_gastos: number;
  observaciones?: string;
}
```

##### Ejemplo en React

```tsx
const CompanyExpenseForm = () => {
  const [expense, setExpense] = useState<CreateCompanyExpenseDto>({
    mes: new Date().toISOString().slice(0, 7), // YYYY-MM
    alquiler: 0,
    servicios: 0,
    combustible: 0,
    alimentacion: 0,
    papeleria: 0,
    comunicaciones: 0,
    publicidad: 0,
    transporte: 0,
    hospedaje: 0,
    otros_gastos: 0,
  });
  const { authenticatedPost } = useCSRF();

  const calculateTotal = () => {
    return Object.entries(expense)
      .filter(([key]) => key !== 'mes' && key !== 'observaciones')
      .reduce((total, [_, value]) => total + (typeof value === 'number' ? value : 0), 0);
  };

  const handleExpenseChange = (field: keyof CreateCompanyExpenseDto, value: number | string) => {
    setExpense(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await authenticatedPost("/api/gastos-mes/expenses", expense);
      
      if (response.ok) {
        const newExpense: CompanyExpenseDto = await response.json();
        toast.success("Gastos registrados exitosamente");
        router.push("/financial/expenses");
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al registrar gastos");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <div className="form-header">
        <h2>Registrar Gastos Empresariales</h2>
        <div className="total-display">
          <strong>Total: ${calculateTotal().toLocaleString()}</strong>
        </div>
      </div>

      <div className="form-group">
        <label>Mes*</label>
        <input
          type="month"
          value={expense.mes}
          onChange={(e) => handleExpenseChange('mes', e.target.value)}
          required
        />
      </div>

      <div className="expense-categories">
        <div className="category-group">
          <h3>Gastos Fijos</h3>
          
          <div className="form-group">
            <label>Alquiler</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expense.alquiler}
              onChange={(e) => handleExpenseChange('alquiler', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Servicios (Luz, Agua, Internet)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expense.servicios}
              onChange={(e) => handleExpenseChange('servicios', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Comunicaciones (Teléfono, Celular)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expense.comunicaciones}
              onChange={(e) => handleExpenseChange('comunicaciones', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="category-group">
          <h3>Gastos Operativos</h3>
          
          <div className="form-group">
            <label>Combustible</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expense.combustible}
              onChange={(e) => handleExpenseChange('combustible', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Transporte</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expense.transporte}
              onChange={(e) => handleExpenseChange('transporte', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Alimentación</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expense.alimentacion}
              onChange={(e) => handleExpenseChange('alimentacion', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Hospedaje</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expense.hospedaje}
              onChange={(e) => handleExpenseChange('hospedaje', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="category-group">
          <h3>Otros Gastos</h3>
          
          <div className="form-group">
            <label>Papelería</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expense.papeleria}
              onChange={(e) => handleExpenseChange('papeleria', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Publicidad</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expense.publicidad}
              onChange={(e) => handleExpenseChange('publicidad', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Otros Gastos</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expense.otros_gastos}
              onChange={(e) => handleExpenseChange('otros_gastos', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Observaciones</label>
        <textarea
          value={expense.observaciones || ''}
          onChange={(e) => handleExpenseChange('observaciones', e.target.value)}
          rows={3}
          placeholder="Observaciones adicionales sobre los gastos del mes..."
        />
      </div>

      <button type="submit" className="btn-primary">
        Registrar Gastos
      </button>
    </form>
  );
};
```

### Resúmenes Financieros

#### 📊 Listar Resúmenes Financieros

**Endpoint**: `GET /api/gastos-mes/summaries`

**Roles requeridos**: `admin`

##### Query Parameters

```typescript
interface FinancialSummaryFilters {
  year?: number;    // YYYY
}
```

##### Response DTO

```typescript
interface FinancialSummaryDto {
  id: number;
  mes: string;                    // YYYY-MM
  total_ingresos: number;
  total_gastos_empresa: number;
  total_gastos_proyectos: number;
  utilidad_bruta: number;
  utilidad_neta: number;
  margen_utilidad: number;        // Porcentaje
  observaciones?: string;
  created_at: string;
  updated_at: string;
}
```

#### ➕ Crear Resumen Financiero

**Endpoint**: `POST /api/gastos-mes/summaries`

**Roles requeridos**: `admin`

##### Request DTO

```typescript
interface CreateFinancialSummaryDto {
  mes: string;                    // YYYY-MM
  total_ingresos: number;
  total_gastos_empresa: number;
  total_gastos_proyectos: number;
  observaciones?: string;
}
```

#### 📝 Obtener Resumen por Mes

**Endpoint**: `GET /api/gastos-mes/summaries/:mes`

**Roles requeridos**: `admin`

---

## 📄 Módulo de Generación de PDFs

### Generar Reportes

#### 📄 Generar PDF General

**Endpoint**: `POST /api/pdf/generate`

**Roles requeridos**: `admin`

##### Request DTO

```typescript
interface PDFGenerateRequest {
  template: 'project-report' | 'financial-summary' | 'lab-report' | 'service-request';
  data: any;          // Datos específicos según el template
  options?: {
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    margin?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
  };
}
```

##### Ejemplo en React

```tsx
const PDFGenerator = ({ projectId }: { projectId: number }) => {
  const [loading, setLoading] = useState(false);
  const { authenticatedPost } = useCSRF();

  const generateProjectReport = async () => {
    setLoading(true);
    
    try {
      const response = await authenticatedPost("/api/pdf/generate", {
        template: "project-report",
        data: {
          projectId,
          includeApiques: true,
          includeProfiles: true,
          includeFinancial: true
        },
        options: {
          format: "A4",
          orientation: "portrait"
        }
      });

      if (response.ok) {
        // El servidor devuelve el PDF como blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `proyecto-${projectId}-reporte.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success("Reporte generado exitosamente");
      } else {
        toast.error("Error al generar el reporte");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdf-generator">
      <h3>Generar Reportes</h3>
      
      <div className="pdf-options">
        <button
          onClick={generateProjectReport}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Generando..." : "Generar Reporte de Proyecto"}
        </button>
      </div>
    </div>
  );
};
```

---

## 🔧 Servicios Públicos

### Catálogo de Servicios

#### 📊 Listar Servicios

**Endpoint**: `GET /api/services`

**Roles requeridos**: Todos los usuarios autenticados

##### Response DTO

```typescript
interface ServiceDto {
  id: number;
  name: string;
  description: string;
  category: ServiceCategoryDto;
  base_price: number;
  unit: string;              // 'm', 'unidad', 'muestra', etc.
  duration_days: number;
  is_active: boolean;
  additional_fields: ServiceAdditionalFieldDto[];
  created_at: string;
  updated_at: string;
}

interface ServiceCategoryDto {
  id: number;
  name: string;
  description: string;
  color: string;             // Color hex para UI
}

interface ServiceAdditionalFieldDto {
  id: number;
  field_name: string;
  field_type: 'text' | 'number' | 'select' | 'boolean';
  is_required: boolean;
  options?: string[];        // Para campos tipo 'select'
  placeholder?: string;
}
```

#### 📝 Obtener Servicio Específico

**Endpoint**: `GET /api/services/:id`

**Roles requeridos**: Todos los usuarios autenticados

#### 📊 Listar Categorías de Servicios

**Endpoint**: `GET /api/services/categories`

**Roles requeridos**: Todos los usuarios autenticados

---

## 🛡️ Seguridad y Autenticación en NestJS

### Guards y Decoradores

#### JwtAuthGuard

```typescript
// Usado automáticamente en controladores protegidos
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  // Todos los endpoints requieren autenticación JWT válida
}
```

#### RolesGuard

```typescript
// Control de acceso basado en roles
@Roles('admin', 'lab')  // Solo admin y lab pueden acceder
@Get('apiques')
async getApiques() {
  // Implementación
}
```

#### Decorador @Public()

```typescript
// Para endpoints que no requieren autenticación
@Public()
@Get('services')
async getPublicServices() {
  // Accessible sin autenticación
}
```

### Validación de DTOs

```typescript
// Todos los DTOs incluyen validación automática
class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  nombre: string;

  @IsNumber()
  @Min(0)
  presupuesto: number;

  @IsDateString()
  fechaInicio: string;

  @IsEnum(ProjectStatus)
  estado: ProjectStatus;
}
```

### Rate Limiting

El API incluye limitación de velocidad configurada:

- **Ventana**: 15 minutos
- **Límite**: 100 requests por IP
- **Detección inteligente de IP**: Soporte para proxies y CDNs

---

## 📈 Mejores Prácticas

### 1. **Manejo de Errores**

```typescript
// El API devuelve errores consistentes
interface APIError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### 2. **Paginación Estándar**

```typescript
// Respuesta paginada estándar
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

### 3. **Filtros y Búsqueda**

Todos los endpoints de listado incluyen:
- Filtros específicos por entidad
- Paginación (`page`, `limit`)
- Ordenamiento (`sortBy`, `sortOrder`)
- Búsqueda por texto cuando aplica

### 4. **Swagger Documentation**

- Documentación automática en `/api-docs`
- Todos los endpoints documentados con ejemplos
- DTOs y responses tipados
- Pruebas integradas en la interfaz

### 5. **TypeScript en Frontend**

```typescript
// Tipos consistentes entre frontend y backend
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const useAuth = (): AuthContextType => {
  // Implementación del contexto
};
```

### 6. **Gestión de Estado**

```typescript
// Hook personalizado para manejo de estado de API
const useApiState = <T>(initialData: T) => {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (apiCall: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute, setData };
};
```

---

## 🚀 Deployment y Configuración

### Variables de Entorno

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
DB_DATABASE=ingeocimyc_db

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=24h
JWT_SECRET_2=tu_segundo_secret_para_admin

# Servidor
PORT=5050
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
TRUST_PROXY=true

# CORS
CORS_ORIGIN=https://tu-frontend.com
```

### Scripts de Inicio

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Tests
npm run test
npm run test:e2e
```

### Estructura de Módulos NestJS

```
src/
├── modules/
│   ├── auth/              # Autenticación JWT
│   ├── admin/             # Módulos de administrador
│   ├── lab/               # Módulos de laboratorio
│   │   ├── apiques/       # Gestión de apiques
│   │   └── profiles/      # Gestión de perfiles
│   ├── projects/          # Gestión de proyectos
│   │   ├── financial/     # Gestión financiera
│   │   └── project-management/
│   ├── client/            # Módulos de cliente
│   │   └── service-requests/
│   ├── services/          # Catálogo de servicios
│   └── pdf/               # Generación de PDFs
├── common/                # Utilidades compartidas
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── pipes/
└── main.ts               # Punto de entrada
```

Esta API en NestJS proporciona una arquitectura moderna, escalable y mantenible con características como:

- ✅ **Autenticación JWT robusta**
- ✅ **Control de acceso basado en roles**
- ✅ **Validación automática de datos**
- ✅ **Documentación Swagger integrada**
- ✅ **Rate limiting inteligente**
- ✅ **Manejo global de errores**
- ✅ **Estructura modular por dominio**
- ✅ **TypeORM para gestión de base de datos**
- ✅ **Testing integrado**

La migración de Express.js a NestJS está **completa** y lista para producción. 🎉

    try {
      const response = await authenticatedPost("/api/projects", project);
      const data = await response.json();

      if (response.ok) {
        console.log("Proyecto creado:", data);
        // Limpiar formulario o redirigir
        setProject({
          nombre: "",
          cliente: "",
          presupuesto: 0,
          fechaInicio: "",
          estado: "activo",
        });
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Error creando proyecto:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <h2>Crear Nuevo Proyecto</h2>

      <div className="form-group">
        <label>Nombre del Proyecto *</label>
        <input
          type="text"
          value={project.nombre}
          onChange={(e) => setProject({ ...project, nombre: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Cliente *</label>
        <input
          type="text"
          value={project.cliente}
          onChange={(e) => setProject({ ...project, cliente: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Presupuesto *</label>
        <input
          type="number"
          step="0.01"
          value={project.presupuesto}
          onChange={(e) =>
            setProject({ ...project, presupuesto: parseFloat(e.target.value) })
          }
          required
        />
      </div>

      <div className="form-group">
        <label>Fecha de Inicio *</label>
        <input
          type="date"
          value={project.fechaInicio}
          onChange={(e) =>
            setProject({ ...project, fechaInicio: e.target.value })
          }
          required
        />
      </div>

      <div className="form-group">
        <label>Descripción</label>
        <textarea
          value={project.descripcion || ""}
          onChange={(e) =>
            setProject({ ...project, descripcion: e.target.value })
          }
          rows={4}
        />
      </div>

      <button type="submit" className="submit-btn">
        Crear Proyecto
      </button>
    </form>
  );
};
```

### 💰 Abonar a Proyecto

**Endpoint**: `PATCH /api/projects/{id}/abonar`

#### Ejemplo en React

```tsx
const ProjectPayment = ({ projectId }: { projectId: number }) => {
  const [amount, setAmount] = useState("");
  const { authenticatedPost } = useCSRF();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await authenticatedPost(
        `/api/projects/${projectId}/abonar`,
        {
          monto: parseFloat(amount),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Abono registrado:", data);
        setAmount("");
        // Actualizar el estado del proyecto
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Error registrando abono:", error);
    }
  };

  return (
    <form onSubmit={handlePayment} className="payment-form">
      <h3>Registrar Abono</h3>
      <div className="form-group">
        <label>Monto del Abono</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>
      <button type="submit">Registrar Abono</button>
    </form>
  );
};
```

---

## 🧪 Solicitudes de Servicio

### 📄 Crear Solicitud de Servicio

**Endpoint**: `POST /api/service-requests`

#### Payload

```typescript
interface ServiceRequestData {
  formData: {
    name: string;
    name_project: string;
    location: string;
    identification: string;
    phone: string;
    email: string;
    description: string;
    status?: "pending" | "approved" | "rejected" | "completed";
  };
  selectedServices: Array<{
    item: {
      code: string;
      name: string;
    };
    quantity: number;
    additionalInfo?: Record<string, any>;
  }>;
}
```

#### Ejemplo en React

```tsx
const ServiceRequestForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    name_project: "",
    location: "",
    identification: "",
    phone: "",
    email: "",
    description: "",
  });

  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);

  // Cargar servicios disponibles
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/service-requests/services");
        if (response.ok) {
          const data = await response.json();
          setAvailableServices(data);
        }
      } catch (error) {
        console.error("Error cargando servicios:", error);
      }
    };

    fetchServices();
  }, []);

  const addService = (service: any) => {
    setSelectedServices([
      ...selectedServices,
      {
        item: {
          code: service.code,
          name: service.name,
        },
        quantity: 1,
        additionalInfo: {},
      },
    ]);
  };

  const updateServiceQuantity = (index: number, quantity: number) => {
    const updated = [...selectedServices];
    updated[index].quantity = quantity;
    setSelectedServices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requestData: ServiceRequestData = {
      formData,
      selectedServices,
    };

    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Solicitud creada:", data);
        // La API automáticamente genera un PDF
        if (data.pdf?.generated) {
          console.log("PDF generado en:", data.pdf.path);
        }
      } else {
        console.error("Error:", data.message);
      }
    } catch (error) {
      console.error("Error creando solicitud:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="service-request-form">
      <h2>Nueva Solicitud de Servicio</h2>

      {/* Datos del solicitante */}
      <div className="form-section">
        <h3>Datos del Solicitante</h3>

        <input
          type="text"
          placeholder="Nombre completo"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Nombre del proyecto"
          value={formData.name_project}
          onChange={(e) =>
            setFormData({ ...formData, name_project: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Ubicación"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Identificación"
          value={formData.identification}
          onChange={(e) =>
            setFormData({ ...formData, identification: e.target.value })
          }
          required
        />

        <input
          type="tel"
          placeholder="Teléfono"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <textarea
          placeholder="Descripción del proyecto"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          required
        />
      </div>

      {/* Selección de servicios */}
      <div className="form-section">
        <h3>Servicios Solicitados</h3>

        <div className="service-selector">
          <select
            onChange={(e) => {
              const service = availableServices.find(
                (s) => s.code === e.target.value
              );
              if (service) addService(service);
            }}
          >
            <option value="">Seleccionar servicio...</option>
            {availableServices.map((service) => (
              <option key={service.code} value={service.code}>
                {service.code} - {service.name}
              </option>
            ))}
          </select>
        </div>

        <div className="selected-services">
          {selectedServices.map((service, index) => (
            <div key={index} className="service-item">
              <span>
                {service.item.code} - {service.item.name}
              </span>
              <input
                type="number"
                min="1"
                value={service.quantity}
                onChange={(e) =>
                  updateServiceQuantity(index, parseInt(e.target.value))
                }
              />
              <button
                type="button"
                onClick={() =>
                  setSelectedServices(
                    selectedServices.filter((_, i) => i !== index)
                  )
                }
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="submit-btn">
        Crear Solicitud
      </button>
    </form>
  );
};
```

### 📥 Descargar PDF de Solicitud

**Endpoint**: `GET /api/service-requests/{id}/pdf`

#### Ejemplo en React

```tsx
const DownloadPDFButton = ({ requestId }: { requestId: number }) => {
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    setDownloading(true);

    try {
      const response = await fetch(`/api/service-requests/${requestId}/pdf`, {
        method: "GET",
        // No se requiere autenticación para este endpoint
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `solicitud-${requestId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Error descargando PDF");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={downloadPDF}
      disabled={downloading}
      className="download-btn"
    >
      {downloading ? "Descargando..." : "Descargar PDF"}
    </button>
  );
};
```

---

## 💼 Gestión Financiera

### 💰 Gastos de Empresa

**Endpoint**: `GET /api/gastos-mes`

#### Ejemplo en React

```tsx
interface ExpenseData {
  id: number;
  concepto: string;
  monto: number;
  fecha: string;
  descripcion?: string;
  categoria?: string;
}

const ExpenseManager = () => {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [newExpense, setNewExpense] = useState<Partial<ExpenseData>>({
    concepto: "",
    monto: 0,
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    categoria: "",
  });
  const authenticatedFetch = createAuthenticatedFetch();
  const { authenticatedPost } = useCSRF();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await authenticatedFetch("/api/gastos-mes");
        if (response.ok) {
          const data = await response.json();
          setExpenses(data);
        }
      } catch (error) {
        console.error("Error cargando gastos:", error);
      }
    };

    fetchExpenses();
  }, []);

  const createExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await authenticatedPost("/api/gastos-mes", newExpense);
      const data = await response.json();

      if (response.ok) {
        setExpenses([...expenses, data]);
        setNewExpense({
          concepto: "",
          monto: 0,
          fecha: new Date().toISOString().split("T")[0],
          descripcion: "",
          categoria: "",
        });
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Error creando gasto:", error);
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.monto,
    0
  );

  return (
    <div className="expense-manager">
      <h2>Gestión de Gastos</h2>

      <div className="expense-summary">
        <h3>Total de Gastos: ${totalExpenses.toLocaleString()}</h3>
      </div>

      <form onSubmit={createExpense} className="expense-form">
        <h3>Registrar Nuevo Gasto</h3>

        <input
          type="text"
          placeholder="Concepto del gasto"
          value={newExpense.concepto}
          onChange={(e) =>
            setNewExpense({ ...newExpense, concepto: e.target.value })
          }
          required
        />

        <input
          type="number"
          step="0.01"
          placeholder="Monto"
          value={newExpense.monto}
          onChange={(e) =>
            setNewExpense({ ...newExpense, monto: parseFloat(e.target.value) })
          }
          required
        />

        <input
          type="date"
          value={newExpense.fecha}
          onChange={(e) =>
            setNewExpense({ ...newExpense, fecha: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Categoría"
          value={newExpense.categoria}
          onChange={(e) =>
            setNewExpense({ ...newExpense, categoria: e.target.value })
          }
        />

        <textarea
          placeholder="Descripción (opcional)"
          value={newExpense.descripcion}
          onChange={(e) =>
            setNewExpense({ ...newExpense, descripcion: e.target.value })
          }
          rows={3}
        />

        <button type="submit">Registrar Gasto</button>
      </form>

      <div className="expenses-list">
        <h3>Gastos Registrados</h3>
        {expenses.map((expense) => (
          <div key={expense.id} className="expense-item">
            <div className="expense-header">
              <h4>{expense.concepto}</h4>
              <span className="amount">${expense.monto.toLocaleString()}</span>
            </div>
            <div className="expense-details">
              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(expense.fecha).toLocaleDateString()}
              </p>
              {expense.categoria && (
                <p>
                  <strong>Categoría:</strong> {expense.categoria}
                </p>
              )}
              {expense.descripcion && <p>{expense.descripcion}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 📊 Resumen Financiero

**Endpoint**: `GET /api/resumen`

#### Ejemplo en React

```tsx
interface FinancialSummary {
  fecha: string;
  ingresos: number;
  gastos: number;
  balance: number;
  proyectosActivos: number;
  proyectosCompletados: number;
}

const FinancialDashboard = () => {
  const [summary, setSummary] = useState<FinancialSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const url = selectedDate
          ? `/api/resumen/fecha?fecha=${selectedDate}`
          : "/api/resumen";

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setSummary(Array.isArray(data) ? data : [data]);
        }
      } catch (error) {
        console.error("Error cargando resumen:", error);
      }
    };

    fetchSummary();
  }, [selectedDate]);

  return (
    <div className="financial-dashboard">
      <h2>Resumen Financiero</h2>

      <div className="date-filter">
        <label>Filtrar por fecha:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button onClick={() => setSelectedDate("")}>Ver Todo</button>
      </div>

      <div className="summary-cards">
        {summary.map((item, index) => (
          <div key={index} className="summary-card">
            <h3>{new Date(item.fecha).toLocaleDateString()}</h3>

            <div className="financial-metrics">
              <div className="metric income">
                <label>Ingresos</label>
                <span>${item.ingresos.toLocaleString()}</span>
              </div>

              <div className="metric expense">
                <label>Gastos</label>
                <span>${item.gastos.toLocaleString()}</span>
              </div>

              <div
                className={`metric balance ${
                  item.balance >= 0 ? "positive" : "negative"
                }`}
              >
                <label>Balance</label>
                <span>${item.balance.toLocaleString()}</span>
              </div>
            </div>

            <div className="project-metrics">
              <div className="metric">
                <label>Proyectos Activos</label>
                <span>{item.proyectosActivos}</span>
              </div>

              <div className="metric">
                <label>Proyectos Completados</label>
                <span>{item.proyectosCompletados}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🏗️ Gestión de Perfiles y Apiques

### 🗂️ Perfiles de Proyecto

**Endpoint**: `GET /api/profiles/{projectId}/profiles`

#### Ejemplo en React

```tsx
interface ProfileData {
  projectId: number;
  profileId: number;
  datosPerfil: {
    profundidad: number;
    resistencia: number;
    descripcion: string;
  };
}

const ProjectProfiles = ({ projectId }: { projectId: number }) => {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [newProfile, setNewProfile] = useState<Partial<ProfileData>>({
    projectId,
    datosPerfil: {
      profundidad: 0,
      resistencia: 0,
      descripcion: "",
    },
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch(`/api/profiles/${projectId}/profiles`);
        if (response.ok) {
          const data = await response.json();
          setProfiles(data);
        }
      } catch (error) {
        console.error("Error cargando perfiles:", error);
      }
    };

    fetchProfiles();
  }, [projectId]);

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/profiles/${projectId}/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProfile),
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles([...profiles, data]);
        setNewProfile({
          projectId,
          datosPerfil: {
            profundidad: 0,
            resistencia: 0,
            descripcion: "",
          },
        });
      }
    } catch (error) {
      console.error("Error creando perfil:", error);
    }
  };

  return (
    <div className="project-profiles">
      <h3>Perfiles del Proyecto</h3>

      <form onSubmit={createProfile} className="profile-form">
        <h4>Nuevo Perfil</h4>

        <input
          type="number"
          step="0.01"
          placeholder="Profundidad (m)"
          value={newProfile.datosPerfil?.profundidad || 0}
          onChange={(e) =>
            setNewProfile({
              ...newProfile,
              datosPerfil: {
                ...newProfile.datosPerfil!,
                profundidad: parseFloat(e.target.value),
              },
            })
          }
          required
        />

        <input
          type="number"
          step="0.01"
          placeholder="Resistencia"
          value={newProfile.datosPerfil?.resistencia || 0}
          onChange={(e) =>
            setNewProfile({
              ...newProfile,
              datosPerfil: {
                ...newProfile.datosPerfil!,
                resistencia: parseFloat(e.target.value),
              },
            })
          }
          required
        />

        <textarea
          placeholder="Descripción"
          value={newProfile.datosPerfil?.descripcion || ""}
          onChange={(e) =>
            setNewProfile({
              ...newProfile,
              datosPerfil: {
                ...newProfile.datosPerfil!,
                descripcion: e.target.value,
              },
            })
          }
          rows={3}
        />

        <button type="submit">Crear Perfil</button>
      </form>

      <div className="profiles-list">
        {profiles.map((profile) => (
          <div key={profile.profileId} className="profile-item">
            <h5>Perfil #{profile.profileId}</h5>
            <p>
              <strong>Profundidad:</strong> {profile.datosPerfil.profundidad} m
            </p>
            <p>
              <strong>Resistencia:</strong> {profile.datosPerfil.resistencia}
            </p>
            <p>
              <strong>Descripción:</strong> {profile.datosPerfil.descripcion}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🚀 Mejores Prácticas para Frontend

### 🎯 Manejo de Estados

```tsx
// Context global para autenticación
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (accessToken) {
        try {
          const response = await fetch("/api/auth/verify", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          } else {
            // Token inválido, limpiar
            localStorage.removeItem("accessToken");
            setAccessToken(null);
          }
        } catch (error) {
          console.error("Error verificando autenticación:", error);
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [accessToken]);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem("accessToken", token);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem("accessToken");
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 🛡️ Componente de Ruta Protegida

```tsx
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: "admin" | "usuario";
}> = ({ children, requiredRole }) => {
  const auth = useContext(AuthContext);

  if (auth?.loading) {
    return <div>Cargando...</div>;
  }

  if (!auth?.user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && auth.user.rol !== requiredRole) {
    return <div>No tienes permisos para acceder a esta página</div>;
  }

  return <>{children}</>;
};

// Uso en el enrutador
<Routes>
  <Route path="/login" element={<LoginForm />} />
  <Route path="/register" element={<RegisterForm />} />

  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin"
    element={
      <ProtectedRoute requiredRole="admin">
        <AdminPanel />
      </ProtectedRoute>
    }
  />
</Routes>;
```

### 🔄 Hook Personalizado para API

```tsx
const useAPI = () => {
  const auth = useContext(AuthContext);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (auth?.accessToken) {
      headers["Authorization"] = `Bearer ${auth.accessToken}`;
    }

    // Para operaciones que modifican datos, incluir CSRF token
    if (["POST", "PUT", "DELETE", "PATCH"].includes(options.method || "GET")) {
      if (!csrfToken) {
        const tokenResponse = await fetch("/api/auth/csrf", {
          credentials: "include",
        });
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          setCsrfToken(tokenData.csrfToken);
          headers["X-CSRF-Token"] = tokenData.csrfToken;
        }
      } else {
        headers["X-CSRF-Token"] = csrfToken;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // Manejar token expirado
    if (response.status === 401 && auth?.accessToken) {
      try {
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          auth.login(auth.user!, refreshData.accessToken);

          // Reintentar la petición original
          headers["Authorization"] = `Bearer ${refreshData.accessToken}`;
          return fetch(url, { ...options, headers, credentials: "include" });
        } else {
          auth.logout();
          throw new Error("Sesión expirada");
        }
      } catch (error) {
        auth.logout();
        throw error;
      }
    }

    return response;
  };

  const get = (url: string) => fetchWithAuth(url);
  const post = (url: string, data: any) =>
    fetchWithAuth(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  const put = (url: string, data: any) =>
    fetchWithAuth(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  const del = (url: string) => fetchWithAuth(url, { method: "DELETE" });

  return { get, post, put, delete: del, fetchWithAuth };
};
```

### 📝 Manejo de Formularios

```tsx
const useForm = <T,>(initialValues: T, validationSchema?: any) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (name: keyof T) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const value =
        e.target.type === "number"
          ? parseFloat(e.target.value)
          : e.target.value;
      setValues((prev) => ({ ...prev, [name]: value }));

      // Limpiar error cuando el usuario empiece a escribir
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    };

  const validate = () => {
    if (!validationSchema) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};

    // Implementar validación personalizada aquí
    // o usar una librería como Yup

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit =
    (onSubmit: (values: T) => Promise<void>) => async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
        setValues(initialValues); // Reset form
      } catch (error) {
        console.error("Error en envío:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setValues,
    setErrors,
  };
};
```

---

## ⚡ Optimizaciones de Rendimiento

### 🔄 Caché de Datos

```tsx
const useCache = <T,>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 5 * 60 * 1000
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Verificar caché local
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          setData(data);
          return;
        }
      }

      setLoading(true);
      try {
        const result = await fetcher();
        setData(result);

        // Guardar en caché
        localStorage.setItem(
          `cache_${key}`,
          JSON.stringify({
            data: result,
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, ttl]);

  const invalidateCache = () => {
    localStorage.removeItem(`cache_${key}`);
  };

  return { data, loading, error, invalidateCache };
};
```

### 🎨 Componentes Optimizados

```tsx
// Componente memoizado para listas grandes
const ProjectCard = React.memo(({ project, onUpdate }: {
  project: Project;
  onUpdate: (id: number) => void;
}) => {
  const handleClick = useCallback(() => {
    onUpdate(project.id);
  }, [project.id, onUpdate]);

  return (
    <div className="project-card" onClick={handleClick}>
      <h3>{project.nombre}</h3>
      <p>{project.cliente}</p>
      <p>${project.presupuesto.toLocaleString()}</p>
    </div>
  );
});

// Hook para paginación eficiente
const usePagination = <T>(data: T[], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    currentData,
    currentPage,
    totalPages,
    goToPage,
    nextPage: () => goToPage(currentPage + 1),
    prevPage: () => goToPage(currentPage - 1)
  };
};
```

---

## 🔒 Consideraciones de Seguridad

### 🛡️ Validación del Cliente

```tsx
// Validaciones en el frontend (complementarias, no sustitutos del backend)
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Debe contener al menos una letra mayúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Debe contener al menos una letra minúscula");
  }

  if (!/\d/.test(password)) {
    errors.push("Debe contener al menos un número");
  }

  return errors;
};

// Sanitización básica de inputs
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remover caracteres peligrosos básicos
    .substring(0, 1000); // Limitar longitud
};
```

### 🔐 Almacenamiento Seguro

```tsx
// Evitar almacenar datos sensibles en localStorage
const useSecureStorage = () => {
  const setSecureItem = (key: string, value: string) => {
    // Solo para datos no sensibles
    if (!["accessToken", "password", "email"].includes(key)) {
      localStorage.setItem(key, value);
    }
  };

  const getSecureItem = (key: string): string | null => {
    return localStorage.getItem(key);
  };

  const removeSecureItem = (key: string) => {
    localStorage.removeItem(key);
  };

  return { setSecureItem, getSecureItem, removeSecureItem };
};
```

---

## 📊 Códigos de Estado HTTP

| Código | Significado           | Cuándo se usa                   |
| ------ | --------------------- | ------------------------------- |
| 200    | OK                    | Operación exitosa               |
| 201    | Created               | Recurso creado exitosamente     |
| 204    | No Content            | Eliminación exitosa             |
| 400    | Bad Request           | Datos de entrada inválidos      |
| 401    | Unauthorized          | No autenticado o token inválido |
| 403    | Forbidden             | No autorizado para la operación |
| 404    | Not Found             | Recurso no encontrado           |
| 409    | Conflict              | Recurso ya existe               |
| 429    | Too Many Requests     | Rate limit excedido             |
| 500    | Internal Server Error | Error del servidor              |

---

## 🎯 Rate Limiting

La API implementa límites de velocidad:

- **General**: 1000 requests por 15 minutos
- **Login**: 5 intentos por 15 minutos por IP
- **Registro**: 3 intentos por 15 minutos por IP

```tsx
// Manejar rate limiting en el frontend
const handleRateLimitError = (response: Response) => {
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const waitTime = retryAfter ? parseInt(retryAfter) : 60;

    console.log(`Rate limit excedido. Espera ${waitTime} segundos`);

    // Mostrar mensaje al usuario
    return Promise.reject({
      message: `Demasiadas solicitudes. Espera ${waitTime} segundos`,
      retryAfter: waitTime,
    });
  }

  return response;
};
```

---

## 🔧 Variables de Entorno

Para configurar tu aplicación frontend, asegúrate de configurar estas variables:

```env
# .env
REACT_APP_API_URL=https://api-cuentas-zlut.onrender.com
REACT_APP_API_DOCS_URL=https://api-cuentas-zlut.onrender.com/api-docs
REACT_APP_ENVIRONMENT=production
```

---

## 🆘 Manejo de Errores

```tsx
// Hook para manejo global de errores
const useErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: any) => {
    console.error("Error capturado:", error);

    if (error.response) {
      // Error de respuesta HTTP
      const { status, data } = error.response;

      switch (status) {
        case 401:
          setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
          // Redirigir al login
          break;
        case 403:
          setError("No tienes permisos para realizar esta acción.");
          break;
        case 404:
          setError("El recurso solicitado no fue encontrado.");
          break;
        case 429:
          setError("Demasiadas solicitudes. Por favor, espera un momento.");
          break;
        case 500:
          setError("Error interno del servidor. Intenta nuevamente más tarde.");
          break;
        default:
          setError(data.error || "Error desconocido");
      }
    } else if (error.request) {
      // Error de red
      setError("Error de conexión. Verifica tu conexión a internet.");
    } else {
      // Error en la configuración
      setError(error.message || "Error inesperado");
    }
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
};
```

---

## 📞 Soporte y Contacto

- **Email de soporte**: mjestradas@ufpso.edu.co
- **Documentación Swagger**: `/api-docs`
- **GitHub Issues**: Para reportar problemas o solicitar características

---

_Este documento fue generado para facilitar la integración con la API de INGEOCIMYC. Para obtener más información detallada sobre endpoints específicos, consulta la documentación Swagger disponible en `/api-docs`._
