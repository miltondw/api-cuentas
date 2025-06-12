# Actualización de API de Seguridad - Junio 2025

## Resumen de Cambios

Hemos realizado una importante actualización en la estructura de tablas de seguridad y autenticación del sistema. A continuación se detallan los cambios realizados y sus implicaciones.

## 1. Cambios en la Nomenclatura de Tablas

### Tablas Antiguas (Singular) → Nuevas (Plural)

| Tabla Antigua          | Tabla Nueva             | Descripción                           |
| ---------------------- | ----------------------- | ------------------------------------- |
| `auth_log`             | `auth_logs`             | Registros de eventos de autenticación |
| `user_session`         | `user_sessions`         | Sesiones activas de usuarios          |
| `failed_login_attempt` | `failed_login_attempts` | Intentos fallidos de autenticación    |

### Motivación del Cambio

Este cambio se realizó para seguir las mejores prácticas de diseño de bases de datos, donde las tablas se nombran en plural ya que representan colecciones de entidades. Esto mejora la consistencia y facilita la comprensión del modelo de datos.

## 2. Estructura de Tablas Actualizada

### Tabla `auth_logs`

```sql
CREATE TABLE IF NOT EXISTS `auth_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `eventType` enum('login','logout','token_expired','session_extended','failed_login','password_changed','account_locked','suspicious_activity') NOT NULL,
  `userEmail` varchar(100) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` text DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT 1,
  `errorMessage` text DEFAULT NULL,
  `sessionDuration` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_auth_logs_userId_createdAt` (`userId`,`createdAt`),
  KEY `idx_auth_logs_eventType_createdAt` (`eventType`,`createdAt`),
  KEY `idx_auth_logs_ipAddress_createdAt` (`ipAddress`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Tabla `user_sessions`

```sql
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(500) NOT NULL,
  `userId` int(11) NOT NULL,
  `ipAddress` varchar(45) NOT NULL,
  `userAgent` text NOT NULL,
  `deviceInfo` json DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `isRememberMe` tinyint(1) DEFAULT 0,
  `expiresAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `lastActivity` timestamp NOT NULL DEFAULT current_timestamp(),
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `loggedOutAt` timestamp NULL DEFAULT NULL,
  `logoutReason` varchar(100) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_user_sessions_userId_isActive` (`userId`,`isActive`),
  KEY `idx_user_sessions_token` (`token`),
  KEY `idx_user_sessions_expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Tabla `failed_login_attempts`

```sql
CREATE TABLE IF NOT EXISTS `failed_login_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `ipAddress` varchar(45) NOT NULL,
  `userAgent` text DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `attemptCount` int(11) DEFAULT 1,
  `blocked` tinyint(1) DEFAULT 0,
  `blockedUntil` timestamp NULL DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_failed_login_attempts_email_createdAt` (`email`,`createdAt`),
  KEY `idx_failed_login_attempts_ipAddress_createdAt` (`ipAddress`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 3. Cambios en el Código

### Actualización de Entidades

Se actualizaron las entidades en el código para reflejar los nuevos nombres:

```typescript
@Entity('auth_logs')
export class AuthLog {
  // ...
}

@Entity('user_sessions')
export class UserSession {
  // ...
}

@Entity('failed_login_attempts')
export class FailedLoginAttempt {
  // ...
}
```

### Actualización de Servicios

Los servicios fueron actualizados para trabajar con las nuevas tablas:

- `AuthLogService`: Para registrar eventos de autenticación
- `SessionService`: Para administrar sesiones activas
- `SecurityService`: Para gestionar intentos fallidos y bloqueos

## 4. Impacto en el Frontend

### No hay cambios para los consumidores de la API

La API mantiene exactamente los mismos endpoints y formatos de respuesta, por lo que no debería ser necesario realizar ningún cambio en las aplicaciones cliente.

### Nuevas Funcionalidades Disponibles

- Endpoint para ver sesiones activas: `GET /api/auth/sessions`
- Endpoint para cerrar sesiones específicas: `DELETE /api/auth/sessions/:sessionId`
- Endpoint para obtener registros de autenticación: `GET /api/auth/logs`
- Endpoint para obtener informes de seguridad: `GET /api/auth/security/report`

## 5. Pruebas Realizadas

Se han realizado pruebas exhaustivas de integración y validación para asegurar que:

1. Las tablas están correctamente estructuradas
2. Los endpoints de autenticación funcionan según lo esperado
3. Los datos se almacenan correctamente en las nuevas tablas
4. No hay tablas antiguas con nombres en singular
5. La integridad referencial se mantiene

## 6. Siguientes Pasos

- Monitorear el rendimiento de las consultas en las nuevas tablas
- Implementar limpieza periódica de registros antiguos
- Expandir las capacidades de análisis de seguridad

## 7. Documentación Actualizada

Se ha actualizado la documentación de frontend para reflejar estos cambios:

- [`FRONTEND_AUTH_GUIDE_2025.md`](../development/FRONTEND_AUTH_GUIDE_2025.md): Nueva guía actualizada
- [`API_COMPLETE.md`](../api/API_COMPLETE.md): Documentación completa de la API

---

Documento preparado por: Equipo de Desarrollo Ingeocimyc  
Fecha: Junio 12, 2025
