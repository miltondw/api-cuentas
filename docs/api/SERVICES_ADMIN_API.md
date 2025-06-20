# Documentación de Endpoints de Administración de Servicios

Esta documentación describe los nuevos endpoints de administración para servicios y categorías que solo pueden ser utilizados por usuarios con rol de `admin`.

## Base URL

```
/api/admin/services
```

## Autenticación

Todos los endpoints requieren:

- Header: `Authorization: Bearer <JWT_TOKEN>`
- Rol de usuario: `admin`

## Endpoints

### Categorías de Servicios

#### 1. Crear Categoría

**POST** `/api/admin/services/categories`

Crea una nueva categoría de servicios.

**Body:**

```json
{
  "code": "STRING (máx 10 caracteres, único)",
  "name": "STRING (máx 255 caracteres)"
}
```

**Ejemplo:**

```json
{
  "code": "TEST",
  "name": "CATEGORÍA DE PRUEBA"
}
```

#### 2. Obtener Todas las Categorías

**GET** `/api/admin/services/categories`

Retorna todas las categorías con sus servicios asociados.

#### 3. Obtener Categoría por ID

**GET** `/api/admin/services/categories/{id}`

#### 4. Actualizar Categoría

**PATCH** `/api/admin/services/categories/{id}`

**Body:** (todos los campos son opcionales)

```json
{
  "code": "STRING (máx 10 caracteres, único)",
  "name": "STRING (máx 255 caracteres)"
}
```

#### 5. Eliminar Categoría

**DELETE** `/api/admin/services/categories/{id}`

⚠️ **Nota:** No se puede eliminar una categoría que tenga servicios asociados.

### Servicios

#### 1. Crear Servicio

**POST** `/api/admin/services`

Crea un nuevo servicio básico sin campos adicionales.

**Body:**

```json
{
  "categoryId": "NUMBER",
  "code": "STRING (máx 10 caracteres, único)",
  "name": "STRING (máx 255 caracteres)"
}
```

#### 2. Crear Servicio Completo con Campos Adicionales

**POST** `/api/admin/services/complete`

Crea un servicio con campos adicionales en una sola transacción.

**Body:**

```json
{
  "categoryId": 1,
  "code": "TEST-1",
  "name": "Servicio de Prueba",
  "additionalFields": [
    {
      "fieldName": "tipoMuestra",
      "type": "select",
      "required": true,
      "options": ["Cilindro", "Viga"],
      "label": "Tipo de muestra",
      "displayOrder": 1
    },
    {
      "fieldName": "tamanoCilindro",
      "type": "select",
      "required": false,
      "options": ["4 pulgadas", "6 pulgadas"],
      "dependsOnField": "tipoMuestra",
      "dependsOnValue": "Cilindro",
      "label": "Tamaño del cilindro",
      "displayOrder": 2
    }
  ]
}
```

#### 3. Obtener Todos los Servicios

**GET** `/api/admin/services`

#### 4. Obtener Servicio por ID

**GET** `/api/admin/services/{id}`

#### 5. Actualizar Servicio

**PATCH** `/api/admin/services/{id}`

**Body:** (todos los campos son opcionales)

```json
{
  "categoryId": "NUMBER",
  "code": "STRING",
  "name": "STRING"
}
```

#### 6. Eliminar Servicio

**DELETE** `/api/admin/services/{id}`

### Campos Adicionales

#### 1. Añadir Campo Adicional

**POST** `/api/admin/services/{serviceId}/fields`

**Body:**

```json
{
  "fieldName": "STRING (único por servicio)",
  "type": "text|number|select|date|checkbox",
  "required": "BOOLEAN (opcional, default: false)",
  "options": ["ARRAY DE STRINGS (solo para type: select)"],
  "dependsOnField": "STRING (opcional)",
  "dependsOnValue": "STRING (opcional)",
  "label": "STRING (opcional)",
  "displayOrder": "NUMBER (opcional, auto-asignado)"
}
```

**Tipos de Campo:**

- `text`: Campo de texto libre
- `number`: Campo numérico
- `select`: Lista desplegable (requiere `options`)
- `date`: Selector de fecha
- `checkbox`: Casilla de verificación

#### 2. Obtener Campos de un Servicio

**GET** `/api/admin/services/{serviceId}/fields`

#### 3. Obtener Campo por ID

**GET** `/api/admin/services/fields/{fieldId}`

#### 4. Actualizar Campo

**PATCH** `/api/admin/services/fields/{fieldId}`

#### 5. Eliminar Campo

**DELETE** `/api/admin/services/fields/{fieldId}`

## Características Especiales

### Campo `displayOrder`

- Controla el orden en que aparecen los campos en el frontend
- Se asigna automáticamente si no se especifica
- Los campos se ordenan por `displayOrder` ASC, luego por `id` ASC

### Campos Dependientes

Los campos pueden depender de otros campos usando:

- `dependsOnField`: Nombre del campo padre
- `dependsOnValue`: Valor que debe tener el campo padre para mostrar este campo

**Ejemplo:**

```json
{
  "fieldName": "tamanoCilindro",
  "dependsOnField": "tipoMuestra",
  "dependsOnValue": "Cilindro"
}
```

Este campo solo se mostrará cuando `tipoMuestra` tenga el valor `"Cilindro"`.

## Base de Datos

### Nueva Columna

Se agregó la columna `display_order` a la tabla `service_additional_fields`:

```sql
ALTER TABLE `service_additional_fields`
ADD COLUMN `display_order` INT NOT NULL DEFAULT 0 AFTER `label`;
```

### Script de Migración

Ejecutar el script: `scripts/database/add-display-order-field.sql`

## Endpoints Públicos Existentes (Sin Cambios)

Los endpoints públicos siguen funcionando igual:

- **GET** `/api/services` - Obtener todos los servicios
- **GET** `/api/services/categories` - Obtener todas las categorías
- **GET** `/api/services/category/{categoryId}` - Servicios por categoría
- **GET** `/api/services/{id}` - Obtener servicio por ID

Ahora estos endpoints ordenan los `additionalFields` por `displayOrder`.

## Validaciones

### Códigos Únicos

- Los códigos de categorías deben ser únicos en toda la tabla
- Los códigos de servicios deben ser únicos en toda la tabla

### Nombres de Campos

- Los nombres de campos (`fieldName`) deben ser únicos por servicio
- No pueden tener espacios ni caracteres especiales (se recomienda camelCase)

### Dependencias

- Si se especifica `dependsOnField`, debe existir un campo con ese nombre en el mismo servicio
- `dependsOnValue` es requerido si se especifica `dependsOnField`

## Códigos de Error

- **400**: Error de validación o datos incorrectos
- **401**: No autenticado
- **403**: No autorizado (no es admin)
- **404**: Recurso no encontrado
- **409**: Conflicto (código/nombre ya existe)
