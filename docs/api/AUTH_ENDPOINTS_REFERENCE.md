# Tabla de Endpoints de Autenticación API INGEOCIMYC

| Endpoint                           | Método | Descripción                    | Cuerpo de la solicitud                              | Respuesta                              | Autenticación | Roles   |
| ---------------------------------- | ------ | ------------------------------ | --------------------------------------------------- | -------------------------------------- | ------------- | ------- |
| `/api/auth/login`                  | POST   | Inicio de sesión               | `{ email, password, rememberMe }`                   | `{ accessToken, user }`                | No            | Público |
| `/api/auth/register`               | POST   | Registro de usuario            | `{ email, password, name, role }`                   | `{ message, user }`                    | No            | Público |
| `/api/auth/logout`                 | POST   | Cierre de sesión               | `{}`                                                | `{ message, sessionsRevoked }`         | Sí            | Todos   |
| `/api/auth/profile`                | GET    | Obtener perfil de usuario      | -                                                   | `{ id, name, email, role, ... }`       | Sí            | Todos   |
| `/api/auth/sessions`               | GET    | Listar sesiones activas        | -                                                   | `[{ id, ipAddress, userAgent, ... }]`  | Sí            | Todos   |
| `/api/auth/sessions/:sessionId`    | DELETE | Revocar sesión específica      | -                                                   | `{ message }`                          | Sí            | Todos   |
| `/api/auth/change-password`        | PATCH  | Cambiar contraseña             | `{ currentPassword, newPassword, confirmPassword }` | `{ message }`                          | Sí            | Todos   |
| `/api/auth/logs`                   | GET    | Obtener registros de actividad | -                                                   | `{ logs: [], pagination: {} }`         | Sí            | Admin   |
| `/api/auth/security/report`        | GET    | Informe de seguridad           | -                                                   | `{ period, totalFailedAttempts, ... }` | Sí            | Admin   |
| `/api/auth/security/stats`         | GET    | Estadísticas de seguridad      | -                                                   | `{ activeUsers, activeSessions, ... }` | Sí            | Admin   |
| `/api/auth/security/cleanup`       | POST   | Limpiar datos antiguos         | `{ days }`                                          | `{ deletedRecords, message }`          | Sí            | Admin   |
| `/api/auth/security/cleanup-stats` | GET    | Estadísticas de limpieza       | -                                                   | `{ oldRecords, oldestRecord, ... }`    | Sí            | Admin   |

## Notas sobre autenticación

1. **Token JWT**: El token debe enviarse en el encabezado `Authorization` con el formato `Bearer <token>`
2. **Duración del token**: 24 horas por defecto, extendido si `rememberMe: true` en el login
3. **Revocación**: Los tokens se invalidan al usar `/api/auth/logout` o al revocar sesiones específicas
4. **Seguridad**: Se monitorean intentos fallidos de login y se bloquean cuentas temporalmente
5. **Sesiones**: Se permite tener múltiples sesiones activas simultáneamente
6. **Logs**: Todas las actividades de autenticación quedan registradas en la tabla `auth_logs`

## Ejemplos de uso

### Login

```javascript
// Ejemplo con fetch
const response = await fetch('https://api-url.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'contraseña123',
    rememberMe: true,
  }),
});

const data = await response.json();
localStorage.setItem('token', data.accessToken);
```

### Petición autenticada

```javascript
// Ejemplo con axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api-url.com/api',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

// Obtener perfil
const profile = await api.get('/auth/profile');
```

### Cerrar sesión

```javascript
// Ejemplo con axios
await api.post('/auth/logout');
localStorage.removeItem('token');
```

Para más detalles sobre cada endpoint y su uso, consulte:

- [AUTH_SYSTEM_UPDATE_2025.md](./AUTH_SYSTEM_UPDATE_2025.md) - Descripción detallada del sistema de autenticación
- [FRONTEND_AUTH_GUIDE_2025.md](../development/FRONTEND_AUTH_GUIDE_2025.md) - Guía completa para integración frontend
