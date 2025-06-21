# Testing Scripts

Scripts for testing API endpoints, functionality, and validation.

## 🧪 Pruebas de Eliminación en Cascada - Solicitudes de Servicio

Este conjunto de scripts verifica que el flujo de eliminación de solicitudes de servicio elimine correctamente todos los datos relacionados, evitando dejar datos huérfanos en la base de datos.

### 📋 Descripción del Problema

Cuando se elimina una solicitud de servicio (`ServiceRequest`), debe eliminarse en cascada toda la información relacionada:

- **SelectedService**: Servicios seleccionados en la solicitud
- **ServiceInstance**: Instancias de cada servicio seleccionado
- **ServiceInstanceValue**: Valores específicos de cada instancia
- **ServiceAdditionalValue**: Valores adicionales de los servicios

### 🎯 Objetivo de las Pruebas

Verificar que:

1. ✅ La configuración de cascada en las entidades funciona correctamente
2. ✅ El endpoint de eliminación (`DELETE /api/service-requests/:id`) funciona correctamente
3. ✅ No quedan datos huérfanos después de eliminar una solicitud
4. ✅ Todas las relaciones se limpian apropiadamente

### 🧪 Scripts de Prueba Disponibles

#### 1. Prueba Completa (Recomendado)

```bash
npm run test:cascade-deletion
```

O usando el archivo batch:

```bash
scripts\test-cascade-deletion.bat
```

Ejecuta todas las pruebas y genera un reporte completo.

#### 2. Prueba Directa de Base de Datos

```bash
npm run test:cascade-db
```

Prueba la eliminación directamente en la base de datos usando SQL, verificando que las restricciones de clave foránea y la configuración de cascada funcionen.

#### 3. Prueba del Endpoint de la API

```bash
npm run test:cascade-api
```

Prueba la eliminación a través del endpoint REST de la API, verificando que el servicio y controlador funcionen correctamente.

### 🛠️ Configuración

#### Prerrequisitos

- Node.js instalado
- Base de datos MySQL configurada y ejecutándose
- Variables de entorno configuradas (ver `.env`)

#### Variables de Entorno Requeridas

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=api_cuentas
API_BASE_URL=http://localhost:3000/api  # Solo para pruebas de API
```

#### Dependencias

Los scripts instalarán automáticamente las dependencias necesarias:

- `mysql2`: Para conexión directa a la base de datos
- `axios`: Para pruebas de la API REST

### 📊 Entidades y Relaciones Verificadas

```
ServiceRequest (service_requests)
    ↓ cascade: true
SelectedService (selected_services)
    ↓ cascade: true                    ↓ cascade: true
ServiceInstance (service_instances)   ServiceAdditionalValue (service_additional_values)
    ↓ cascade: true
ServiceInstanceValue (service_instance_values)
```

### 📈 Interpretación de Resultados

#### ✅ Éxito Total

```
✅ Prueba de Base de Datos: PASÓ
✅ Prueba de API: PASÓ
```

La eliminación en cascada funciona perfectamente en todos los niveles.

#### ⚠️ Éxito Parcial

```
✅ Prueba de Base de Datos: PASÓ
⏸️ Prueba de API: NO EJECUTADA
```

La configuración de cascada es correcta, pero la API no está ejecutándose. Inicia la API y vuelve a ejecutar las pruebas.

#### ❌ Error Crítico

```
❌ Prueba de Base de Datos: FALLÓ
```

Hay problemas con la configuración de cascada en las entidades. Revisa las relaciones y la configuración de TypeORM.

### 🔧 Solución de Problemas

#### Error: "API no disponible"

1. Asegúrate de que la API esté ejecutándose:
   ```bash
   npm run start:dev
   ```
2. Verifica que el puerto esté disponible (por defecto 3000)
3. Confirma las variables de entorno

#### Error: "Cannot connect to database"

1. Verifica que MySQL esté ejecutándose
2. Confirma las credenciales en `.env`
3. Asegúrate de que la base de datos exista

#### Error: "Datos huérfanos detectados"

1. Revisa la configuración de cascada en las entidades
2. Verifica que se use `serviceRequestRepository.remove()` en lugar de `delete()`
3. Confirma que las relaciones estén correctamente definidas

### 📁 Archivos de Prueba

- `scripts/testing/test-cascade-deletion.js` - Prueba directa de BD
- `scripts/testing/test-api-cascade-deletion.js` - Prueba del endpoint API
- `scripts/testing/run-cascade-deletion-tests.js` - Suite completa
- `scripts/test-cascade-deletion.bat` - Script batch para Windows

---

**Nota**: Estas pruebas son seguras y no afectan datos de producción, ya que crean y eliminan únicamente datos de prueba con identificadores específicos.
