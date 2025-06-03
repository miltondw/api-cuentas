# Recomendaciones para la Generación de PDFs en NestJS

## Mantenimiento del Sistema de PDFs

Este documento proporciona recomendaciones para mantener la consistencia y calidad del sistema de generación de PDFs en la migración a NestJS.

## 1. Buenas Prácticas de Diseño

### Separación de Responsabilidades

El sistema actual separa correctamente:
- **PDFService**: Lógica de negocio para generar PDFs
- **Controller**: Endpoints para acceder a la funcionalidad
- **Utils**: Funciones auxiliares para formateo y presentación
- **Templates**: HTML para la estructura visual

Mantén esta separación para facilitar el mantenimiento.

### Manejo de Recursos

Los recursos estáticos (imágenes, plantillas) están organizados en directorios específicos:
- `./src/templates/` para plantillas HTML
- `./assets/` para imágenes y recursos estáticos
- `./uploads/pdfs/` para PDFs generados

Asegúrate de mantener esta estructura y verificar los permisos adecuados en producción.

## 2. Optimizaciones

### Rendimiento

- **Reutiliza la instancia de Puppeteer** cuando sea posible
- **Elimina propiedades innecesarias** de los objetos antes de pasarlos a las plantillas
- **Comprime imágenes SVG** para reducir el tamaño de los PDFs
- **Utiliza lazy-loading** para relaciones de entidades no siempre necesarias

### Memoria

- **Cierra siempre el navegador** después de generar un PDF
- **Limpia los PDFs temporales** periódicamente
- **Monitorea el uso de memoria** en producción

## 3. Seguridad

- **Sanitiza los datos** antes de incluirlos en las plantillas HTML
- **Limita el acceso a los endpoints** según roles de usuario
- **Verifica los IDs de solicitud** para evitar acceso no autorizado
- **Implementa límites de tasa** para evitar sobrecarga del sistema

## 4. Extensibilidad

### Agregar Nuevos Formatos

Para agregar un nuevo formato de PDF:
1. Crea una nueva plantilla HTML en `./src/templates/`
2. Agrega un nuevo método en `PDFService`
3. Implementa un endpoint en el controlador
4. Actualiza los utils de formato según sea necesario

### Modificar Diseño Existente

Para modificar el diseño del PDF actual:
1. Edita la plantilla HTML en `./src/templates/service-request.html`
2. Actualiza los métodos `generateHeaderHTML` y `generateFooterHTML` si es necesario
3. Ajusta los estilos CSS manteniendo la compatibilidad con Puppeteer

## 5. Compatibilidad con Datos Existentes

### Migración de Datos

Al migrar datos del sistema antiguo al nuevo, verifica:
- Las relaciones entre `ServiceRequest`, `SelectedService`, `ServiceInstance` y `ServiceInstanceValue`
- La consistencia de los nombres de campos en `ServiceInstanceValue`
- La integridad de los datos adjuntos (número de instancia, cantidad, etc.)

### Cambios en la Estructura

Si necesitas cambiar la estructura de datos:
1. Crea migraciones de TypeORM apropiadas
2. Actualiza las entidades y servicios correspondientes
3. Modifica la lógica de generación de PDF para adaptarse a los cambios

## 6. Pruebas Recomendadas

Al realizar cambios en el sistema de PDFs:
1. Genera PDFs de prueba con datos reales
2. Compara visualmente con PDFs generados anteriormente
3. Verifica el manejo de casos extremos (datos vacíos, muchas instancias, etc.)
4. Prueba tanto el modo buffer como el modo archivo
5. Valida la agrupación por categorías y los saltos de página

## 7. Mejoras Futuras

### Funcionalidades Potenciales

- **Personalización de plantillas** por tipo de solicitud
- **Firma digital** de los PDFs generados
- **Versionado de plantillas** para mantener compatibilidad histórica
- **Gestión de caché** para PDFs frecuentemente accedidos
- **Generación asíncrona** para solicitudes con muchos datos

### Optimización Frontend

- Implementar vista previa en tiempo real usando el mismo motor de renderizado
- Agregar opciones de personalización para el usuario final
- Desarrollar un editor visual para plantillas
- Incluir opciones para descarga en otros formatos (XLS, CSV)

## 8. Troubleshooting

### Problemas Comunes

| Problema | Posible Causa | Solución |
|----------|---------------|----------|
| PDF vacío | Buffer corrompido | Verifica el manejo del buffer y cabeceras HTTP |
| Estilos no aplicados | CSS incompatible con Puppeteer | Simplifica los selectores CSS o usa inline styles |
| Memoria insuficiente | Demasiadas solicitudes concurrentes | Implementa un sistema de cola para generación |
| Caracteres especiales incorrectos | Problema de codificación | Verifica la codificación UTF-8 en toda la cadena |
| Problemas de alineación | Unidades CSS incompatibles | Usa unidades absolutas (px, pt) en lugar de relativas |

### Logs Recomendados

Activa logs específicos para diagnóstico:
```typescript
PDFService.generateServiceRequestPDF(id, {
  logLevel: 'debug',  // normal, debug, verbose
  includeTemplate: true,  // guarda la plantilla HTML para depuración
  validateOutput: true   // verifica que el PDF generado sea válido
});
```

## 9. Documentación

- Mantén actualizada la documentación técnica del sistema de PDFs
- Documenta los cambios realizados en el archivo `PDF_MIGRATION_SUMMARY.md`
- Agrega pruebas para nuevas funcionalidades
- Utiliza comentarios JSDoc para describir los métodos y parámetros
