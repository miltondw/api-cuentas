# 🚨 Corrección para el Frontend - Gestión de Servicios

## **Problema Reportado:**

```
PUT /api/admin/services/38/complete → 404 Error
```

## **❌ Errores en la Solicitud del Frontend:**

1. **Método HTTP incorrecto**: Usa `PUT` en lugar de `POST`
2. **Ruta incorrecta**: Incluye ID en `/complete`
3. **Uso inapropiado del endpoint**: `/complete` es para crear, no actualizar

---

## **✅ Soluciones Correctas:**

### **Caso 1: CREAR un nuevo servicio con campos adicionales**

```javascript
// ✅ CORRECTO
fetch('/api/admin/services/complete', {
  method: 'POST', // ← Cambiar de PUT a POST
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_TOKEN',
  },
  body: JSON.stringify({
    categoryId: 5,
    code: 'EC-4-NEW', // ← Debe ser único, no puede repetir "EC-4"
    name: 'Toma de núcleo de concreto',
    additionalFields: [
      {
        fieldName: 'tipo_elemento',
        type: 'text',
        required: true,
        label: 'Tipo de elemento',
        displayOrder: 0,
      },
    ],
  }),
});
```

### **Caso 2: ACTUALIZAR servicio existente (ID: 38)**

#### Opción A: Solo actualizar información del servicio

```javascript
// ✅ CORRECTO - Actualizar servicio
fetch('/api/admin/services/38', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_TOKEN',
  },
  body: JSON.stringify({
    name: 'Toma de núcleo de concreto (actualizado)',
  }),
});
```

#### Opción B: Agregar campo adicional al servicio existente

```javascript
// ✅ CORRECTO - Agregar campo al servicio
fetch('/api/admin/services/38/fields', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_TOKEN',
  },
  body: JSON.stringify({
    fieldName: 'tipo_elemento',
    type: 'text',
    required: true,
    label: 'Tipo de elemento',
    displayOrder: 0,
  }),
});
```

---

## **📋 Referencia Rápida de Endpoints:**

### **Servicios:**

```
POST   /api/admin/services          → Crear servicio básico
POST   /api/admin/services/complete → Crear servicio + campos
GET    /api/admin/services          → Listar servicios
GET    /api/admin/services/{id}     → Obtener servicio
PATCH  /api/admin/services/{id}     → Actualizar servicio
DELETE /api/admin/services/{id}     → Eliminar servicio
```

### **Campos Adicionales:**

```
POST   /api/admin/services/{serviceId}/fields    → Agregar campo
GET    /api/admin/services/{serviceId}/fields    → Listar campos
GET    /api/admin/services/fields/{fieldId}      → Obtener campo
PATCH  /api/admin/services/fields/{fieldId}      → Actualizar campo
DELETE /api/admin/services/fields/{fieldId}      → Eliminar campo
```

---

## **🎯 Recomendación Específica:**

Basándome en la estructura que envió, parece que quiere **agregar un campo adicional al servicio existente**. Use este código:

```javascript
// ✅ SOLUCIÓN RECOMENDADA
const response = await fetch('/api/admin/services/38/fields', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_TOKEN',
  },
  body: JSON.stringify({
    fieldName: 'tipo_elemento',
    type: 'text',
    required: true,
    label: 'Tipo de elemento',
    displayOrder: 0,
  }),
});

const result = await response.json();
console.log(result);
```

---

## **⚠️ Validaciones Importantes:**

1. **fieldName debe ser único** por servicio
2. **code debe ser único** por categoría (para servicios nuevos)
3. **Token JWT válido** requerido
4. **Rol admin** requerido
5. **displayOrder** se auto-asigna si no se especifica

---

## **🧪 Verificar con cURL:**

```bash
# Agregar campo al servicio 38
curl -X POST "http://localhost:5051/api/admin/services/38/fields" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldName": "tipo_elemento",
    "type": "text",
    "required": true,
    "label": "Tipo de elemento",
    "displayOrder": 0
  }'
```
