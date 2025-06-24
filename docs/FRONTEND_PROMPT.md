# 🚀 PROMPT PARA AGENTE FRONTEND (Claude Sonnet)

## CONTEXTO CRÍTICO

Soy el desarrollador backend de "API Cuentas" y necesitas actualizar nuestro frontend React+Vite+TypeScript para integrar las mejoras implementadas en el backend.

## ✅ ESTADO ACTUAL BACKEND

- **Sistema de autenticación COMPLETAMENTE refactorizado**
- **Todos los endpoints funcionando y validados**
- **DTOs estandarizados con ResponseDto<T>**
- **Refresh tokens implementados y funcionales**
- **Revocación de tokens funcionando correctamente**
- **Rate limiting y seguridad avanzada**

## 📋 TU MISIÓN

Actualizar el frontend para que:

1. **Use las nuevas estructuras de respuesta del backend**
2. **Implemente refresh automático de tokens**
3. **Maneje correctamente la revocación de tokens**
4. **Siga las mejores prácticas de seguridad**
5. **Tenga una UX fluida y responsive**

## 📚 DOCUMENTACIÓN COMPLETA

**Lee completamente el archivo:** `docs/FRONTEND_INTEGRATION_GUIDE.md`

Este archivo contiene:

- ✅ Estructura exacta de todos los endpoints
- ✅ Tipos TypeScript necesarios
- ✅ Ejemplos de implementación
- ✅ Mejores prácticas de seguridad
- ✅ Estructura de archivos sugerida
- ✅ Manejo de errores requerido

## 🔧 ENDPOINTS PRINCIPALES (Base: `http://localhost:5051/api`)

### Autenticación:

- `POST /auth/login` → `ResponseDto<AuthResponseDto>`
- `POST /auth/register` → `ResponseDto<AuthResponseDto>`
- `POST /auth/refresh` → `ResponseDto<AuthResponseDto>`
- `POST /auth/logout` → `ResponseDto<{message, sessionsRevoked}>`
- `GET /auth/profile` → `ResponseDto<UserProfile>`
- `GET /auth/sessions` → `ResponseDto<UserSession[]>`
- `PATCH /auth/change-password` → `ResponseDto<{message, sessionsRevoked}>`

### Estructura de Respuesta (CRÍTICO):

```typescript
interface ResponseDto<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp?: string;
  path?: string;
}
```

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### 1️⃣ **PRIMERA FASE** (Funcionalidad Core):

- Actualizar tipos TypeScript
- Refactorizar servicio de API
- Actualizar contexto de autenticación
- Componentes básicos de login/register

### 2️⃣ **SEGUNDA FASE** (Características Avanzadas):

- Auto-refresh de tokens
- Gestión de sesiones múltiples
- Cambio de contraseña
- Manejo de errores mejorado

### 3️⃣ **TERCERA FASE** (UX/UI Avanzada):

- Dashboard de seguridad
- Notificaciones en tiempo real
- Optimizaciones de performance
- Testing completo

## 🔒 SEGURIDAD CRÍTICA

- **NO** almacenar access tokens en localStorage
- **SÍ** usar refresh tokens con rotación
- **SÍ** limpiar tokens en logout
- **SÍ** manejar tokens revocados
- **SÍ** validar responses del servidor

## 🧪 TESTING DISPONIBLE

Tengo scripts de testing del backend que puedes usar como referencia:

- `test-auth-system.js` - Muestra todos los flujos de autenticación
- `test-validations.js` - Muestra validaciones y manejo de errores

## ⚡ EMPEZAR AHORA

1. **Lee la documentación completa** en `docs/FRONTEND_INTEGRATION_GUIDE.md`
2. **Analiza tu código frontend actual**
3. **Comienza por los tipos TypeScript y API service**
4. **Pregúntame si tienes dudas sobre algún endpoint**

## 🤝 COLABORACIÓN

- Puedo ejecutar tests del backend cuando necesites verificar comportamiento
- Puedo mostrarte ejemplos específicos de requests/responses
- Puedo ajustar el backend si encuentras algún problema

**¿Estás listo para comenzar? ¡Empecemos por revisar tu código actual y planificar la migración!**
