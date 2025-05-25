# Implementación para entorno de producción en Render

## Resumen de cambios

Se ha implementado un sistema que permite generar PDFs bajo demanda para resolver el problema del almacenamiento efímero en Render. La solución consiste en:

1. **Generación dinámica de PDFs**: Los PDFs se generan al momento de la solicitud HTTP y se envían directamente al cliente sin almacenamiento persistente.

2. **Comportamiento dual**: El sistema funciona de manera diferente según el entorno:
   - **Desarrollo**: Guarda los PDFs en disco para facilitar la depuración.
   - **Producción**: Genera los PDFs como buffers de memoria y los envía directamente como respuesta HTTP.

## Cambios realizados

1. **En `pdfGenerator.js`**:
   - Ahora la función `generateServiceRequestPDF` acepta un parámetro `returnBuffer` que determina si debe devolver un buffer o una ruta a un archivo.
   - Si `returnBuffer` es `true`, no se guarda ningún archivo en disco, solo se genera el buffer.

2. **En `serviceRequests.controller.js`**:
   - La función `generateServiceRequestPdf` ahora comprueba el entorno y decide si generar un archivo o un buffer.
   - El comportamiento se controla mediante `process.env.NODE_ENV`.

3. **En `test_pdf.js`**:
   - Ahora prueba ambos modos de funcionamiento: generar archivo y generar buffer.

## Uso

### Para generar y descargar un PDF

```
GET /api/service-requests/:id/pdf
```

- En desarrollo, genera el archivo en disco y lo envía para descargar.
- En producción, genera el PDF en memoria y lo envía directamente como respuesta.

### Para forzar un modo específico

```
GET /api/service-requests/:id/pdf?buffer=true
```

- El parámetro `buffer=true` fuerza el modo buffer (útil para pruebas en desarrollo).

## Ventajas de esta implementación

1. **Compatibilidad con Render**: Funciona perfectamente en entornos con sistema de archivos efímero.
2. **No requiere almacenamiento externo**: No necesita servicios adicionales como S3 o similares.
3. **Experiencia de usuario intacta**: Los usuarios pueden seguir descargando PDFs normalmente.
4. **Menor uso de recursos**: Se evita escribir en disco en el entorno de producción.

## Consideraciones

- En Render, asegúrese de configurar la variable de entorno `NODE_ENV=production`.
- Si el tamaño de los PDFs crece significativamente, puede ser necesario ajustar los tiempos de espera de las solicitudes HTTP.
- Esta solución es ideal para PDFs que se generan ocasionalmente. Si el volumen aumenta considerablemente, se podría explorar almacenamiento en la nube.
