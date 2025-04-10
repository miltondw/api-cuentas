# API-Cuentas - Sistema de Gestión de Proyectos

API para la gestión financiera y administrativa de proyectos de Ingeocimyc.

## Descripción

Este proyecto es una API RESTful desarrollada con Node.js y Express para la gestión de proyectos, perfiles, gastos y resúmenes financieros. Implementa un sistema completo de autenticación mediante JWT (JSON Web Tokens) con tokens de acceso y refresco.

## Características Principales

- **Gestión de Proyectos**: Creación, consulta, actualización y eliminación de proyectos.
- **Gestión de Gastos**: Control de gastos asociados a proyectos y gastos mensuales de la empresa.
- **Perfiles de Usuario**: Administración de perfiles de usuario con diferentes roles.
- **Autenticación Segura**: Sistema completo con JWT, incluyendo tokens de acceso y refresco.
- **Documentación API**: Interfaz Swagger UI para pruebas y documentación.
- **Seguridad**: Implementación de mejores prácticas de seguridad (Helmet, rate limiting, CORS).

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: MySQL
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: bcryptjs, helmet, express-rate-limit, cors
- **Documentación**: Swagger UI, swagger-jsdoc
- **Otros**: morgan, compression, dotenv, express-validator

## Estructura del Proyecto

```
src/
├── config/         # Configuración de base de datos y servicios
├── controllers/    # Controladores de la aplicación
├── middleware/     # Middlewares personalizados
├── models/         # Modelos de datos
├── routes/         # Definición de rutas de la API
└── index.js        # Punto de entrada de la aplicación
```

## Instalación

1. Clona el repositorio:
   ```
   git clone https://github.com/tu-usuario/api-cuentas.git
   cd api-cuentas
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura las variables de entorno:
   - Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:
   ```
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=tu_clave_secreta_jwt
   JWT_REFRESH_SECRET=tu_clave_secreta_refresh
   JWT_SECRET_2=tu_clave_secreta_registro
   DB_HOST=localhost
   DB_USER=usuario_db
   DB_PASSWORD=contraseña_db
   DB_NAME=nombre_db
   CORS_ORIGINS=https://tu-frontend.com,https://otro-dominio.com
   ```

4. Inicia el servidor:
   ```
   npm start
   ```

## Endpoints principales

### Autenticación

- **POST /api/auth/registro**: Registrar un nuevo usuario
- **POST /api/auth/login**: Iniciar sesión
- **POST /api/auth/refresh**: Refrescar token de acceso
- **GET /api/auth/verify**: Verificar autenticación
- **POST /api/auth/logout**: Cerrar sesión

### Proyectos

- **GET /api/projects**: Obtener lista de proyectos
- **GET /api/projects/:id**: Obtener un proyecto específico
- **POST /api/projects**: Crear un nuevo proyecto
- **PUT /api/projects/:id**: Actualizar un proyecto
- **DELETE /api/projects/:id**: Eliminar un proyecto
- **POST /api/projects/:id/abono**: Registrar abono a un proyecto

### Perfiles

- **GET /api/projects/profiles**: Obtener perfiles
- **POST /api/projects/profiles**: Crear nuevo perfil
- **GET /api/projects/profiles/:id**: Obtener un perfil específico
- **PUT /api/projects/profiles/:id**: Actualizar un perfil
- **DELETE /api/projects/profiles/:id**: Eliminar un perfil

### Gastos de la Empresa

- **GET /api/gastos-mes**: Obtener gastos mensuales
- **POST /api/gastos-mes**: Registrar nuevo gasto mensual
- **PUT /api/gastos-mes/:id**: Actualizar un gasto mensual
- **DELETE /api/gastos-mes/:id**: Eliminar un gasto mensual

### Resumen Financiero

- **GET /api/resumen/anual**: Obtener resumen financiero anual
- **GET /api/resumen/mensual**: Obtener resumen financiero mensual

## Documentación

La documentación completa de la API está disponible en `/api-docs` cuando el servidor está en ejecución. Esta documentación está generada automáticamente utilizando Swagger UI.

## Seguridad

Esta API implementa varias capas de seguridad:

- **Autenticación JWT**: Tokens de acceso y refresco con tiempos de expiración configurables.
- **Helmet**: Protección mediante cabeceras HTTP seguras.
- **Rate Limiting**: Limitación de peticiones para prevenir ataques de fuerza bruta.
- **CORS**: Control de acceso desde dominios específicos.
- **Validación de Entradas**: Validación de datos mediante express-validator.
- **Encriptación de Contraseñas**: Uso de bcrypt para almacenar contraseñas de forma segura.

## Entorno de Desarrollo

Para ejecutar el servidor en modo desarrollo con recarga automática:

```
npm start
```

## Licencia

Este proyecto está bajo la Licencia ISC. 