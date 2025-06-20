# 🎨 Sistema de Vista Previa y Edición de PDF en Tiempo Real

## 📋 Resumen

He implementado un sistema completo que te permite:

- ✅ Ver una vista previa del PDF sin descargarlo
- ✅ Editar los estilos CSS en tiempo real
- ✅ Ver los cambios inmediatamente
- ✅ Descargar el PDF con los estilos actualizados

## 🚀 Nuevas Funcionalidades Implementadas

### 1. Vista Previa HTML

**Endpoint:** `GET /api/pdf/service-request/:id/preview`

- Genera el mismo contenido que el PDF pero en formato HTML
- Incluye controles de zoom y botones de acción
- No requiere descarga para ver el contenido

### 2. Editor de PDF en Tiempo Real

**Endpoint:** `GET /api/pdf/service-request/:id/editor`

- Interface de editor con dos paneles
- Panel izquierdo: Editor de CSS con syntax highlighting
- Panel derecho: Vista previa en tiempo real
- Auto-actualización mientras escribes (debounced)

### 3. Vista Previa con Estilos Personalizados

**Endpoint:** `GET /api/pdf/service-request/:id/preview-with-styles?styles=...`

- Aplica estilos CSS personalizados a la vista previa
- Permite ver cambios antes de generar el PDF final

## 🛠️ Archivos Modificados/Creados

### Archivos Modificados:

1. **`src/modules/pdf/pdf.service.ts`**

   - ➕ `generateServiceRequestPreview()` - Vista previa HTML
   - ➕ `generatePDFEditor()` - Interface del editor
   - ➕ `generateServiceRequestPreviewWithStyles()` - Vista con estilos custom
   - ➕ `addPreviewControls()` - Controles de vista previa

2. **`src/modules/pdf/pdf.controller.ts`**
   - 🔄 Actualizado `previewServiceRequestPDF()` - Ahora funcional
   - ➕ `openPDFEditor()` - Endpoint del editor
   - ➕ `previewWithStyles()` - Vista previa con estilos

### Archivos de Prueba:

3. **`scripts/testing/test-pdf-preview.sh`** - Script de pruebas

## 🎯 Cómo Usar el Sistema

### Paso 1: Vista Previa Básica

```bash
# Abre en tu navegador
http://localhost:3000/api/pdf/service-request/1/preview
```

### Paso 2: Editor en Tiempo Real

```bash
# Abre el editor completo
http://localhost:3000/api/pdf/service-request/1/editor
```

### Paso 3: Editar Estilos

1. En el editor, modifica el CSS en el panel izquierdo
2. La vista previa se actualiza automáticamente (1 segundo después de parar de escribir)
3. Usa `Ctrl+S` para actualizar manualmente
4. Usa `Ctrl+D` para descargar el PDF

## 🎨 Características del Editor

### Interface Visual

- **Panel Izquierdo (40%):** Editor de CSS con tema oscuro
- **Panel Derecho (60%):** Vista previa en iframe
- **Controles:** Actualizar, Descargar, Restaurar, Guardar
- **Barra de Estado:** Indica el estado actual

### Funcionalidades

- ✅ **Auto-actualización:** Cambios en tiempo real
- ✅ **Syntax highlighting:** Editor con colores
- ✅ **Keyboard shortcuts:** Ctrl+S, Ctrl+D
- ✅ **Status feedback:** Indica lo que está pasando
- ✅ **Responsive:** Se adapta al tamaño de pantalla

### Controles de Vista Previa

- 🔄 **Actualizar:** Refresca la vista previa
- 📥 **Descargar PDF:** Genera y descarga el PDF final
- 🔍 **Zoom:** 50%, 75%, 100%, 125%, 150%

## 🔧 Variables CSS Principales

```css
:root {
  --teal-principal: #008d97; /* Color principal */
  --texto-oscuro: #010101; /* Texto principal */
  --texto-claro: #ffffff; /* Texto en fondos oscuros */
  --borde-suave: #bdc3c7; /* Bordes de tabla */
  --fondo-fila: #f8f9f9; /* Filas alternadas */
  --fondo-seccion: #d9d9d9; /* Headers de sección */
}
```

## 📱 Casos de Uso

### Modificar Colores de Empresa

```css
:root {
  --teal-principal: #ff6b35; /* Cambiar a naranja */
  --fondo-seccion: #ffe5d9; /* Fondo más claro */
}
```

### Ajustar Tamaños de Fuente

```css
body {
  font-size: 10pt;
} /* Texto más pequeño */
.section-title {
  font-size: 14pt;
} /* Títulos más grandes */
```

### Personalizar Tablas

```css
.horizontal-info-table th {
  background-color: #2c3e50; /* Header azul oscuro */
  color: white;
}
```

## 🚀 Ventajas del Nuevo Sistema

1. **⚡ Desarrollo Rápido:** No necesitas descargar PDFs para ver cambios
2. **🎨 Flexibilidad:** Modifica cualquier aspecto visual del PDF
3. **💾 Eficiencia:** Previsualiza antes de generar el PDF final
4. **🔄 Iteración Rápida:** Cambios en tiempo real
5. **👥 Colaboración:** Fácil compartir previsualizaciones

## 🧪 Pruebas

### Ejecutar Pruebas

```bash
# Dar permisos al script
chmod +x scripts/testing/test-pdf-preview.sh

# Ejecutar pruebas
./scripts/testing/test-pdf-preview.sh
```

### Verificar Endpoints

```bash
# Vista previa
curl http://localhost:3000/api/pdf/service-request/1/preview

# Editor
curl http://localhost:3000/api/pdf/service-request/1/editor

# PDF final
curl -o solicitud.pdf http://localhost:3000/api/pdf/service-request/1
```

## 🔮 Próximas Mejoras Sugeridas

1. **💾 Guardar Templates:** Persistir estilos personalizados
2. **📋 Presets:** Templates predefinidos para diferentes tipos
3. **🎨 Palette de Colores:** Selector visual de colores
4. **📏 Ruler/Grid:** Guías visuales para alineación
5. **📱 Responsive Editor:** Editor que funciona en móviles
6. **🔍 Search & Replace:** Buscar y reemplazar en CSS
7. **📈 Historia:** Deshacer/rehacer cambios
8. **👥 Sharing:** Compartir previsualizaciones con enlaces

## 🆘 Troubleshooting

### Problema: Vista previa no carga

**Solución:** Verifica que el ID de solicitud existe en la base de datos

### Problema: Estilos no se aplican

**Solución:** Revisa la sintaxis CSS en el editor

### Problema: PDF se ve diferente a la vista previa

**Solución:** Algunos estilos CSS pueden no ser compatibles con Puppeteer

## 🎉 ¡Listo para Usar!

El sistema está completamente funcional. Puedes:

1. **Iniciar tu servidor:** `npm run start:dev`
2. **Abrir el editor:** `http://localhost:3000/api/pdf/service-request/1/editor`
3. **Comenzar a editar:** Modifica los estilos y ve los cambios en tiempo real

¡Disfruta de tu nuevo sistema de edición de PDFs en tiempo real! 🚀
