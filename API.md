# 📖 API de Gestión de Proyectos y Servicios INGEOCIMYC

## 📑 Tabla de Contenidos

1. [🌟 Descripción General](#-descripción-general)
2. [🔐 Autenticación](#-autenticación)
   - [🔑 Registro de Usuario](#-registro-de-usuario)
   - [🚪 Inicio de Sesión](#-inicio-de-sesión)
   - [🔄 Renovación de Token](#-renovación-de-token)
   - [🛡️ Protección CSRF](#️-protección-csrf)
3. [📋 Gestión de Proyectos](#-gestión-de-proyectos)
4. [🧪 Solicitudes de Servicio](#-solicitudes-de-servicio)
5. [💼 Gestión Financiera](#-gestión-financiera)
6. [🏗️ Gestión de Perfiles y Apiques](#️-gestión-de-perfiles-y-apiques)
7. [🚀 Mejores Prácticas para Frontend](#-mejores-prácticas-para-frontend)
8. [⚡ Optimizaciones de Rendimiento](#-optimizaciones-de-rendimiento)
9. [🔒 Consideraciones de Seguridad](#-consideraciones-de-seguridad)
10. [📊 Códigos de Estado HTTP](#-códigos-de-estado-http)
11. [🎯 Rate Limiting](#-rate-limiting)
12. [🔧 Variables de Entorno](#-variables-de-entorno)
13. [🆘 Manejo de Errores](#-manejo-de-errores)
14. [📞 Soporte y Contacto](#-soporte-y-contacto)

---

## 🌟 Descripción General

Esta API está diseñada para la gestión integral de proyectos geotécnicos, solicitudes de servicios de laboratorio, autenticación de usuarios y generación de reportes. La API está construida con **Express.js** y utiliza **MySQL** como base de datos, implementando las mejores prácticas de seguridad y escalabilidad.

### 🚀 Características Principales

- **Autenticación JWT** con tokens de acceso y refresco
- **Sistema de roles** (admin, usuario)
- **Protección CSRF** para operaciones sensibles
- **Rate Limiting** para prevenir abuso
- **Generación de PDFs** para solicitudes de servicio
- **Gestión completa de proyectos** y perfiles geotécnicos
- **Sistema de apiques** y muestras de laboratorio
- **Reportes financieros** y gastos empresariales

### 🔗 URLs Base

- **Producción**: `https://api-cuentas-zlut.onrender.com`
- **Desarrollo**: `http://localhost:5050`
- **Documentación Swagger**: `/api-docs`

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
