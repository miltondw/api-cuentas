# 🎨 Sistema de Vista Previa y Edición de PDFs - INGEOCIMYC

## 🚀 ¡Nueva Funcionalidad Implementada!

He analizado completamente tu proyecto y he implementado un sistema revolucionario que te permitirá **editar los estilos del PDF en tiempo real** sin tener que descargar el archivo cada vez.

## 📋 ¿Qué Archivos Están Involucrados en la Generación de PDFs?

### 🏗️ Arquitectura del Sistema PDF

**Archivos Principales:**

```
src/modules/pdf/
├── pdf.service.ts          # 🔧 Lógica principal de generación
├── pdf.controller.ts       # 🌐 Endpoints HTTP
├── utils/format-utils.ts   # 🛠️ Utilidades de formato
└── pdf.module.ts          # 📦 Módulo NestJS

src/templates/
└── service-request.html    # 📄 Plantilla HTML del PDF

assets/                     # 🎨 Recursos estáticos
├── logo.svg
├── phone.svg
├── internet.svg
└── location.svg
```

### 🔄 Flujo de Generación Actual

1. **Obtención de datos** → Base de datos (ServiceRequest + servicios)
2. **Carga de plantilla** → `service-request.html`
3. **Procesamiento** → Reemplazo de variables y generación de contenido
4. **Renderizado** → Puppeteer convierte HTML a PDF
5. **Entrega** → Buffer o archivo según el entorno

## 🆕 Nuevas Funcionalidades Implementadas

### ✨ 1. Vista Previa HTML

- **URL:** `/api/pdf/service-request/:id/preview`
- **Funcionalidad:** Ver el contenido del PDF en HTML sin descargarlo
- **Incluye:** Controles de zoom, botones de descarga y actualización

### ✨ 2. Editor Visual en Tiempo Real

- **URL:** `/api/pdf/service-request/:id/editor`
- **Funcionalidad:** Editor completo con dos paneles
  - **Panel izquierdo:** Editor de CSS con syntax highlighting
  - **Panel derecho:** Vista previa en tiempo real
- **Características:**
  - Auto-actualización mientras escribes
  - Keyboard shortcuts (Ctrl+S, Ctrl+D)
  - Tema oscuro para el editor
  - Feedback de estado en tiempo real

### ✨ 3. Vista Previa con Estilos Personalizados

- **URL:** `/api/pdf/service-request/:id/preview-with-styles?styles=...`
- **Funcionalidad:** Aplicar estilos CSS personalizados a la vista previa

## 🎯 Cómo Usar el Nuevo Sistema

### Paso 1: Iniciar el Servidor

```bash
npm run start:dev
```

### Paso 2: Abrir el Editor

Navega a: `http://localhost:3000/api/pdf/service-request/1/editor`
(Cambia el `1` por un ID válido de tu base de datos)

### Paso 3: Editar en Tiempo Real

1. **Modifica los estilos CSS** en el panel izquierdo
2. **Ve los cambios inmediatamente** en el panel derecho
3. **Usa atajos de teclado:**
   - `Ctrl+S` → Actualizar vista previa
   - `Ctrl+D` → Descargar PDF

### Paso 4: Descargar PDF Final

Cuando estés satisfecho con los cambios, haz clic en "📥 Descargar PDF"

## 🎨 Variables CSS Principales que Puedes Modificar

```css
:root {
  --teal-principal: #008d97; /* Color principal de la empresa */
  --texto-oscuro: #010101; /* Color del texto principal */
  --texto-claro: #ffffff; /* Texto en fondos oscuros */
  --borde-suave: #bdc3c7; /* Color de bordes de tablas */
  --fondo-fila: #f8f9f9; /* Color de filas alternadas */
  --fondo-seccion: #d9d9d9; /* Color de headers de sección */
}
```

### 🎨 Ejemplos de Personalización

**Cambiar colores de empresa:**

```css
:root {
  --teal-principal: #ff6b35; /* Naranja */
  --fondo-seccion: #ffe5d9; /* Naranja claro */
}
```

**Ajustar tamaños de fuente:**

```css
body {
  font-size: 10pt;
}
.section-title {
  font-size: 16pt;
}
.horizontal-info-table {
  font-size: 8pt;
}
```

**Personalizar tablas:**

```css
.horizontal-info-table th {
  background-color: #2c3e50;
  color: white;
  padding: 10px;
}
```

## 🧪 Probar el Sistema

### Prueba Automática

```bash
npm run test:pdf-preview
```

### Prueba Manual

```bash
# Verificar endpoints
curl http://localhost:3000/api/pdf/service-request/1/preview
curl http://localhost:3000/api/pdf/service-request/1/editor
```

## 🔧 Estructura del Sistema de Estilos

### CSS Variables (Personalizable)

El sistema usa variables CSS que puedes modificar fácilmente:

```css
/* Colores principales */
--teal-principal: #008d97;
--texto-oscuro: #010101;
--texto-claro: #ffffff;

/* Fondos y bordes */
--borde-suave: #bdc3c7;
--fondo-fila: #f8f9f9;
--fondo-seccion: #d9d9d9;
```

### Clases CSS Importantes

- `.section-title` → Títulos de secciones
- `.info-table` → Tablas de información general
- `.horizontal-info-table` → Tablas horizontales de servicios
- `.service-header` → Headers de servicios
- `.preview-controls` → Controles de vista previa

## 🎁 Beneficios del Nuevo Sistema

1. **⚡ Desarrollo Rápido:** No más descargas para ver cambios
2. **🎨 Flexibilidad Total:** Modifica cualquier aspecto visual
3. **💾 Eficiencia:** Previsualiza antes de generar el PDF final
4. **🔄 Iteración Rápida:** Cambios instantáneos
5. **👥 Fácil Colaboración:** Comparte links de vista previa

## 📚 Documentación Adicional

- **Guía Completa:** `docs/development/PDF_LIVE_EDITOR_GUIDE.md`
- **Plan de Pruebas:** `docs/development/PDF_TEST_PLAN.md`
- **Guía de Mantenimiento:** `docs/development/PDF_MAINTENANCE_GUIDE.md`

## 🆘 Troubleshooting

### Problema: "Cannot find service request"

**Solución:** Verifica que el ID existe en tu base de datos

```sql
SELECT id FROM service_requests LIMIT 10;
```

### Problema: "Vista previa en blanco"

**Solución:** Revisa que tienes datos de servicios asociados

```sql
SELECT * FROM selected_services WHERE service_request_id = 1;
```

### Problema: "Estilos no se aplican"

**Solución:** Verifica la sintaxis CSS en el editor

## 🚀 ¡Empieza Ahora!

1. **Ejecuta:** `npm run start:dev`
2. **Abre:** `http://localhost:3000/api/pdf/service-request/1/editor`
3. **Edita:** Modifica los estilos CSS
4. **Disfruta:** Ve los cambios en tiempo real

## 🎉 ¡Listo para Revolucionar tu Flujo de Trabajo!

El sistema está completamente implementado y listo para usar. Ahora puedes:

- ✅ **Ver PDFs sin descargarlos**
- ✅ **Editar estilos en tiempo real**
- ✅ **Personalizar completamente el diseño**
- ✅ **Iterar rápidamente en el diseño**
- ✅ **Mantener la calidad profesional**

¡Disfruta de tu nuevo sistema de edición de PDFs! 🎨✨
