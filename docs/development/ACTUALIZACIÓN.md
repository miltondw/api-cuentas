# Actualización del Sistema de Solicitudes de Servicio

Esta actualización implementa el soporte para múltiples instancias de un mismo servicio en las solicitudes. Ahora cada servicio puede tener varias "instancias", cada una con su propia información adicional individualizada.

## Estructura del Nuevo Formato

El nuevo formato de solicitud ahora acepta la siguiente estructura:

```json
{
  "formData": {
    "name": "test2",
    "name_project": "name project",
    "location": "ocaña norte de santander",
    "identification": "28398836",
    "phone": "3002321421",
    "email": "milton@ingeocimyc.com",
    "description": "asdadadad adadada",
    "status": "pendiente"
  },
  "selectedServices": [
    {
      "item": {
        "code": "EDS-3",
        "name": "Estudio para movimientos de tierra"
      },
      "quantity": 3,
      "instances": [
        {
          "additionalInfo": {
            "areaPredio": 1
          }
        },
        {
          "additionalInfo": {
            "areaPredio": 2
          }
        },
        {
          "additionalInfo": {
            "areaPredio": 3
          }
        }
      ]
    }
  ]
}
```

En este nuevo formato:
- Cada servicio ahora puede tener un arreglo `instances`
- La cantidad de instancias debe coincidir con el valor `quantity` del servicio
- Cada instancia tiene su propio objeto `additionalInfo` con información específica

## Compatibilidad con el Formato Anterior

Se mantiene la compatibilidad con el formato anterior. Si una solicitud incluye `additionalInfo` directamente en el servicio (sin usar `instances`), el sistema lo tratará como si fuera una única instancia repetida para todas las cantidades.

## Cambios en la Base de Datos

Esta actualización incluye cambios en la estructura de la base de datos:

1. Creación de dos nuevas tablas:
   - `service_instances`: Almacena las instancias de cada servicio seleccionado
   - `service_instance_values`: Almacena los valores adicionales para cada instancia

2. Migración de datos existentes al nuevo formato (manteniendo compatibilidad)

## Instrucciones de Actualización

1. Actualizar el código fuente con los nuevos archivos

2. Ejecutar el script de migración para actualizar la estructura de la base de datos:
   ```bash
   node src/scripts/migrate_services.js
   ```

3. Reiniciar el servidor API:
   ```bash
   npm run start
   ```

## Nuevas Características

- **Múltiples Instancias**: Ahora se pueden crear varias instancias para un mismo servicio.
- **Valores Independientes**: Cada instancia tiene sus propios valores adicionales.
- **Mejor Visualización en PDF**: Los reportes PDF ahora muestran claramente las distintas instancias de cada servicio.
- **Validación Mejorada**: El sistema verifica que la cantidad de instancias coincida con la cantidad especificada.
