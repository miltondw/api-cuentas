# Plan de Pruebas para la Generación de PDF en NestJS

Este documento describe un plan completo para probar la implementación del sistema de generación de PDF migrado a NestJS.

## 1. Pruebas Unitarias

### PDFService - Métodos Internos

- **formatValue()**
  - Prueba con diferentes tipos de valores (null, undefined, string, date)
  - Verifica que los valores vacíos se formatean como `&nbsp;`
  - Comprueba el formateo correcto de fechas

- **formatFieldName()**
  - Prueba campos de mapeo predefinidos
  - Prueba formateo automático para campos no mapeados
  - Verifica que camelCase se convierte correctamente a palabras separadas

- **generateServicesContent()**
  - Prueba con lista de servicios vacía
  - Prueba con servicios sin instancias
  - Prueba con servicios con instancias y datos adicionales
  - Verifica la agrupación correcta por categorías
  - Comprueba que se generan los saltos de página correctamente

### FormatUtils

- **generateHorizontalInstancesContent()**
  - Prueba con array de instancias vacío
  - Prueba con instancias que tienen datos adicionales
  - Verifica la estructura HTML generada para las tablas

## 2. Pruebas de Integración

### PDFService - Método Principal

- **generateServiceRequestPDF()**
  - Prueba con solicitudes existentes en la base de datos
  - Verifica la correcta obtención de datos relacionados
  - Comprueba la generación del PDF en modo buffer
  - Comprueba la generación del PDF en modo archivo
  - Verifica el manejo de errores cuando la solicitud no existe

### PDFController

- **generateServiceRequestPDF()**
  - Prueba el endpoint con ID válido
  - Prueba con los parámetros de consulta `buffer` y `format`
  - Verifica las cabeceras HTTP correctas en la respuesta
  - Comprueba que el PDF devuelto es válido
  
- **previewServiceRequestPDF()**
  - Prueba la vista previa HTML
  - Verifica que el contenido HTML es consistente con el PDF

- **regenerateServiceRequestPDF()**
  - Prueba la regeneración de un PDF existente
  - Verifica la respuesta con información de tamaño del PDF

## 3. Pruebas de Aceptación

### Proceso Completo

1. Crear una solicitud de servicio con múltiples servicios
2. Agregar instancias con información adicional a los servicios
3. Generar un PDF para la solicitud
4. Verificar que el PDF contiene:
   - Encabezado y pie de página correctos
   - Datos de contacto y proyecto completos
   - Servicios agrupados por categorías
   - Tablas horizontales para servicios con instancias
   - Formateo correcto de valores y fechas

### Casos Especiales

- **Solicitudes sin servicios**
  - Verificar mensaje adecuado
  
- **Servicios sin información adicional**
  - Verificar que se muestra solo la información básica
  
- **Datos inusuales o extremos**
  - Prueba con textos muy largos
  - Prueba con caracteres especiales o no latinos
  - Prueba con muchas instancias para un mismo servicio
  - Prueba con muchas categorías de servicios en una solicitud

## 4. Pruebas de Rendimiento

- **Carga**
  - Generar múltiples PDFs en secuencia
  - Medir tiempo de generación por solicitud
  
- **Memoria**
  - Monitorizar uso de memoria durante generación masiva
  - Verificar que no hay memory leaks al generar múltiples PDFs

## 5. Pruebas de Regresión

- Comparar PDFs generados por el sistema original vs. NestJS para las mismas solicitudes
- Verificar tamaños de archivo similares
- Comprobar que el contenido y la estructura visual son idénticos

## 6. Herramientas para Pruebas

- Jest para pruebas unitarias y de integración
- Postman o CLI para probar endpoints REST
- Herramienta comparativa de PDFs (como DiffPDF)
- Generador de datos de prueba para crear solicitudes con diversos escenarios

## 7. Documentación de Pruebas

Para cada prueba realizada, documentar:
1. Escenario probado
2. Datos de entrada utilizados
3. Resultado esperado
4. Resultado obtenido
5. Capturas de pantalla comparativas (cuando aplique)

## 8. Matriz de Pruebas

| Tipo de Prueba | Prioridad | Automatizada | Estimación |
|----------------|-----------|--------------|------------|
| Unitarias      | Alta      | Sí           | 2h         |
| Integración    | Alta      | Sí           | 3h         |
| Aceptación     | Media     | No           | 4h         |
| Rendimiento    | Baja      | Parcial      | 2h         |
| Regresión      | Alta      | Parcial      | 3h         |

## 9. Criterios de Éxito

- Todas las pruebas unitarias pasan
- Los PDFs generados son visualmente idénticos a los originales
- El rendimiento es igual o mejor que la implementación original
- No hay errores en la generación para ningún caso de prueba
- La memoria se libera correctamente después de cada generación
