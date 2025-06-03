# ESTRUCTURA COMPLETA DE LA BASE DE DATOS

Database: ingeocim_form
Generated: 2025-05-30T01:26:06.835Z

## LISTA DE TABLAS

- apiques
- blows
- gastos_empresa
- gastos_proyectos
- layers
- perfiles
- profiles
- proyectos
- resumen_financiero
- selected_services
- service_additional_fields
- service_additional_values
- service_categories
- service_instance_values
- service_instances
- service_requests
- services
- usuarios

## TABLA: apiques

### CREATE TABLE Statement:

```sql
CREATE TABLE `apiques` (
  `apique_id` int(11) NOT NULL AUTO_INCREMENT,
  `apique` int(11) DEFAULT NULL COMMENT 'Número identificador del apique',
  `proyecto_id` int(11) NOT NULL,
  `location` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `depth` decimal(5,2) DEFAULT NULL COMMENT 'Profundidad total en metros',
  `date` date DEFAULT NULL,
  `cbr_unaltered` tinyint(1) DEFAULT '0' COMMENT 'Indica si tiene CBR inalterado',
  `depth_tomo` decimal(5,2) DEFAULT NULL COMMENT 'Profundidad de toma de muestra',
  `molde` int(11) DEFAULT NULL,
  PRIMARY KEY (`apique_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field         | Type         | Null | Key | Default | Extra          |
| ------------- | ------------ | ---- | --- | ------- | -------------- |
| apique_id     | int(11)      | NO   | PRI |         | auto_increment |
| apique        | int(11)      | YES  |     |         |                |
| proyecto_id   | int(11)      | NO   |     |         |                |
| location      | varchar(255) | YES  |     |         |                |
| depth         | decimal(5,2) | YES  |     |         |                |
| date          | date         | YES  |     |         |                |
| cbr_unaltered | tinyint(1)   | YES  |     | 0       |                |
| depth_tomo    | decimal(5,2) | YES  |     |         |                |
| molde         | int(11)      | YES  |     |         |                |

### Índices:

| Key_name | Column_name | Unique | Seq_in_index |
| -------- | ----------- | ------ | ------------ |
| PRIMARY  | apique_id   | YES    | 1            |

---

## TABLA: blows

### CREATE TABLE Statement:

```sql
CREATE TABLE `blows` (
  `blow_id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(11) NOT NULL,
  `depth` decimal(4,2) NOT NULL,
  `blows6` int(11) DEFAULT '0',
  `blows12` int(11) DEFAULT '0',
  `blows18` int(11) DEFAULT '0',
  `n` int(11) DEFAULT '0',
  `observation` text COLLATE utf8_unicode_ci,
  PRIMARY KEY (`blow_id`)
) ENGINE=InnoDB AUTO_INCREMENT=365 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field       | Type         | Null | Key | Default | Extra          |
| ----------- | ------------ | ---- | --- | ------- | -------------- |
| blow_id     | int(11)      | NO   | PRI |         | auto_increment |
| profile_id  | int(11)      | NO   |     |         |                |
| depth       | decimal(4,2) | NO   |     |         |                |
| blows6      | int(11)      | YES  |     | 0       |                |
| blows12     | int(11)      | YES  |     | 0       |                |
| blows18     | int(11)      | YES  |     | 0       |                |
| n           | int(11)      | YES  |     | 0       |                |
| observation | text         | YES  |     |         |                |

### Índices:

| Key_name | Column_name | Unique | Seq_in_index |
| -------- | ----------- | ------ | ------------ |
| PRIMARY  | blow_id     | YES    | 1            |

---

## TABLA: gastos_empresa

### CREATE TABLE Statement:

```sql
CREATE TABLE `gastos_empresa` (
  `gasto_empresa_id` int(11) NOT NULL AUTO_INCREMENT,
  `mes` date DEFAULT NULL,
  `salarios` decimal(15,2) DEFAULT '0.00',
  `luz` decimal(15,2) DEFAULT '0.00',
  `agua` decimal(15,2) DEFAULT '0.00',
  `arriendo` decimal(15,2) DEFAULT '0.00',
  `internet` decimal(15,2) DEFAULT '0.00',
  `salud` decimal(15,2) DEFAULT '0.00',
  `otros_campos` json DEFAULT NULL,
  PRIMARY KEY (`gasto_empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field            | Type          | Null | Key | Default | Extra          |
| ---------------- | ------------- | ---- | --- | ------- | -------------- |
| gasto_empresa_id | int(11)       | NO   | PRI |         | auto_increment |
| mes              | date          | YES  |     |         |                |
| salarios         | decimal(15,2) | YES  |     | 0.00    |                |
| luz              | decimal(15,2) | YES  |     | 0.00    |                |
| agua             | decimal(15,2) | YES  |     | 0.00    |                |
| arriendo         | decimal(15,2) | YES  |     | 0.00    |                |
| internet         | decimal(15,2) | YES  |     | 0.00    |                |
| salud            | decimal(15,2) | YES  |     | 0.00    |                |
| otros_campos     | json          | YES  |     |         |                |

### Índices:

| Key_name | Column_name      | Unique | Seq_in_index |
| -------- | ---------------- | ------ | ------------ |
| PRIMARY  | gasto_empresa_id | YES    | 1            |

---

## TABLA: gastos_proyectos

### CREATE TABLE Statement:

```sql
CREATE TABLE `gastos_proyectos` (
  `gasto_proyecto_id` int(11) NOT NULL AUTO_INCREMENT,
  `proyecto_id` int(11) DEFAULT NULL,
  `camioneta` decimal(15,2) DEFAULT '0.00',
  `campo` decimal(15,2) DEFAULT '0.00',
  `obreros` decimal(15,2) DEFAULT '0.00',
  `comidas` decimal(15,2) DEFAULT '0.00',
  `otros` decimal(15,2) DEFAULT '0.00',
  `peajes` decimal(15,2) DEFAULT '0.00',
  `combustible` decimal(15,2) DEFAULT '0.00',
  `hospedaje` decimal(15,2) DEFAULT '0.00',
  `otros_campos` json DEFAULT NULL,
  PRIMARY KEY (`gasto_proyecto_id`),
  KEY `fk_proyecto` (`proyecto_id`),
  CONSTRAINT `fk_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`proyecto_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field             | Type          | Null | Key | Default | Extra          |
| ----------------- | ------------- | ---- | --- | ------- | -------------- |
| gasto_proyecto_id | int(11)       | NO   | PRI |         | auto_increment |
| proyecto_id       | int(11)       | YES  | MUL |         |                |
| camioneta         | decimal(15,2) | YES  |     | 0.00    |                |
| campo             | decimal(15,2) | YES  |     | 0.00    |                |
| obreros           | decimal(15,2) | YES  |     | 0.00    |                |
| comidas           | decimal(15,2) | YES  |     | 0.00    |                |
| otros             | decimal(15,2) | YES  |     | 0.00    |                |
| peajes            | decimal(15,2) | YES  |     | 0.00    |                |
| combustible       | decimal(15,2) | YES  |     | 0.00    |                |
| hospedaje         | decimal(15,2) | YES  |     | 0.00    |                |
| otros_campos      | json          | YES  |     |         |                |

### Índices:

| Key_name    | Column_name       | Unique | Seq_in_index |
| ----------- | ----------------- | ------ | ------------ |
| PRIMARY     | gasto_proyecto_id | YES    | 1            |
| fk_proyecto | proyecto_id       | NO     | 1            |

---

## TABLA: layers

### CREATE TABLE Statement:

```sql
CREATE TABLE `layers` (
  `layer_id` int(11) NOT NULL AUTO_INCREMENT,
  `apique_id` int(11) NOT NULL,
  `layer_number` int(11) NOT NULL,
  `thickness` decimal(5,2) NOT NULL COMMENT 'Espesor en metros',
  `sample_id` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `observation` text COLLATE utf8_unicode_ci,
  PRIMARY KEY (`layer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field        | Type         | Null | Key | Default | Extra          |
| ------------ | ------------ | ---- | --- | ------- | -------------- |
| layer_id     | int(11)      | NO   | PRI |         | auto_increment |
| apique_id    | int(11)      | NO   |     |         |                |
| layer_number | int(11)      | NO   |     |         |                |
| thickness    | decimal(5,2) | NO   |     |         |                |
| sample_id    | varchar(50)  | YES  |     |         |                |
| observation  | text         | YES  |     |         |                |

### Índices:

| Key_name | Column_name | Unique | Seq_in_index |
| -------- | ----------- | ------ | ------------ |
| PRIMARY  | layer_id    | YES    | 1            |

---

## TABLA: perfiles

### CREATE TABLE Statement:

```sql
CREATE TABLE `perfiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `profile_date` date DEFAULT NULL,
  `samples_number` int(11) DEFAULT NULL,
  `sounding_number` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `location` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `latitude` decimal(8,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `depth` decimal(8,2) DEFAULT NULL,
  `water_level` decimal(8,2) DEFAULT NULL,
  `observations` text COLLATE utf8_unicode_ci,
  `profile_data` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field           | Type         | Null | Key | Default              | Extra                          |
| --------------- | ------------ | ---- | --- | -------------------- | ------------------------------ |
| id              | int(11)      | NO   | PRI |                      | auto_increment                 |
| project_id      | int(11)      | NO   |     |                      |                                |
| profile_date    | date         | YES  |     |                      |                                |
| samples_number  | int(11)      | YES  |     |                      |                                |
| sounding_number | varchar(100) | NO   |     |                      |                                |
| description     | text         | YES  |     |                      |                                |
| location        | varchar(255) | YES  |     |                      |                                |
| latitude        | decimal(8,6) | YES  |     |                      |                                |
| longitude       | decimal(9,6) | YES  |     |                      |                                |
| depth           | decimal(8,2) | YES  |     |                      |                                |
| water_level     | decimal(8,2) | YES  |     |                      |                                |
| observations    | text         | YES  |     |                      |                                |
| profile_data    | json         | YES  |     |                      |                                |
| created_at      | datetime(6)  | NO   |     | CURRENT_TIMESTAMP(6) |                                |
| updated_at      | datetime(6)  | NO   |     | CURRENT_TIMESTAMP(6) | on update CURRENT_TIMESTAMP(6) |

### Índices:

| Key_name | Column_name | Unique | Seq_in_index |
| -------- | ----------- | ------ | ------------ |
| PRIMARY  | id          | YES    | 1            |

---

## TABLA: profiles

### CREATE TABLE Statement:

```sql
CREATE TABLE `profiles` (
  `profile_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `sounding_number` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `water_level` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `profile_date` date DEFAULT NULL,
  `samples_number` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `location` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `unique_sounding` (`project_id`,`sounding_number`),
  CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `proyectos` (`proyecto_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field           | Type         | Null | Key | Default           | Extra                       |
| --------------- | ------------ | ---- | --- | ----------------- | --------------------------- |
| profile_id      | int(11)      | NO   | PRI |                   | auto_increment              |
| project_id      | int(11)      | NO   | MUL |                   |                             |
| sounding_number | varchar(10)  | NO   |     |                   |                             |
| water_level     | varchar(50)  | YES  |     |                   |                             |
| profile_date    | date         | YES  |     |                   |                             |
| samples_number  | int(11)      | YES  |     |                   |                             |
| created_at      | timestamp    | NO   |     | CURRENT_TIMESTAMP |                             |
| updated_at      | timestamp    | NO   |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |
| location        | varchar(255) | YES  |     |                   |                             |

### Índices:

| Key_name        | Column_name     | Unique | Seq_in_index |
| --------------- | --------------- | ------ | ------------ |
| PRIMARY         | profile_id      | YES    | 1            |
| unique_sounding | project_id      | YES    | 1            |
| unique_sounding | sounding_number | YES    | 2            |

---

## TABLA: proyectos

### CREATE TABLE Statement:

```sql
CREATE TABLE `proyectos` (
  `proyecto_id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `solicitante` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `nombre_proyecto` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `obrero` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `costo_servicio` decimal(15,2) NOT NULL,
  `abono` decimal(15,2) DEFAULT '0.00',
  `factura` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `valor_retencion` decimal(10,2) DEFAULT '0.00',
  `metodo_de_pago` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`proyecto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field           | Type          | Null | Key | Default | Extra          |
| --------------- | ------------- | ---- | --- | ------- | -------------- |
| proyecto_id     | int(11)       | NO   | PRI |         | auto_increment |
| fecha           | date          | NO   |     |         |                |
| solicitante     | varchar(255)  | NO   |     |         |                |
| nombre_proyecto | varchar(255)  | NO   |     |         |                |
| obrero          | varchar(255)  | NO   |     |         |                |
| costo_servicio  | decimal(15,2) | NO   |     |         |                |
| abono           | decimal(15,2) | YES  |     | 0.00    |                |
| factura         | varchar(255)  | YES  |     |         |                |
| valor_retencion | decimal(10,2) | YES  |     | 0.00    |                |
| metodo_de_pago  | varchar(100)  | YES  |     |         |                |

### Índices:

| Key_name | Column_name | Unique | Seq_in_index |
| -------- | ----------- | ------ | ------------ |
| PRIMARY  | proyecto_id | YES    | 1            |

---

## TABLA: resumen_financiero

### CREATE TABLE Statement:

```sql
CREATE TABLE `resumen_financiero` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mes` varchar(7) COLLATE utf8_unicode_ci NOT NULL,
  `ingresos_totales` decimal(10,2) NOT NULL DEFAULT '0.00',
  `gastos_totales` decimal(10,2) NOT NULL DEFAULT '0.00',
  `utilidad_bruta` decimal(10,2) NOT NULL DEFAULT '0.00',
  `utilidad_neta` decimal(10,2) NOT NULL DEFAULT '0.00',
  `margen_utilidad` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field            | Type          | Null | Key | Default              | Extra                          |
| ---------------- | ------------- | ---- | --- | -------------------- | ------------------------------ |
| id               | int(11)       | NO   | PRI |                      | auto_increment                 |
| mes              | varchar(7)    | NO   |     |                      |                                |
| ingresos_totales | decimal(10,2) | NO   |     | 0.00                 |                                |
| gastos_totales   | decimal(10,2) | NO   |     | 0.00                 |                                |
| utilidad_bruta   | decimal(10,2) | NO   |     | 0.00                 |                                |
| utilidad_neta    | decimal(10,2) | NO   |     | 0.00                 |                                |
| margen_utilidad  | decimal(10,2) | NO   |     | 0.00                 |                                |
| created_at       | datetime(6)   | NO   |     | CURRENT_TIMESTAMP(6) |                                |
| updatedAt        | datetime(6)   | NO   |     | CURRENT_TIMESTAMP(6) | on update CURRENT_TIMESTAMP(6) |

### Índices:

| Key_name | Column_name | Unique | Seq_in_index |
| -------- | ----------- | ------ | ------------ |
| PRIMARY  | id          | YES    | 1            |

---

## TABLA: selected_services

### CREATE TABLE Statement:

```sql
CREATE TABLE `selected_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=336 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field      | Type      | Null | Key | Default           | Extra          |
| ---------- | --------- | ---- | --- | ----------------- | -------------- |
| id         | int(11)   | NO   | PRI |                   | auto_increment |
| request_id | int(11)   | NO   |     |                   |                |
| service_id | int(11)   | NO   |     |                   |                |
| quantity   | int(11)   | NO   |     |                   |                |
| created_at | timestamp | NO   |     | CURRENT_TIMESTAMP |                |

### Índices:

| Key_name | Column_name | Unique | Seq_in_index |
| -------- | ----------- | ------ | ------------ |
| PRIMARY  | id          | YES    | 1            |

---

## TABLA: service_additional_fields

### CREATE TABLE Statement:

```sql
CREATE TABLE `service_additional_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `field_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `required` tinyint(1) DEFAULT '0',
  `options` json DEFAULT NULL,
  `depends_on_field` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `depends_on_value` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_id` (`service_id`,`field_name`),
  KEY `idx_service_additional_fields_service_id` (`service_id`),
  CONSTRAINT `service_additional_fields_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field            | Type         | Null | Key | Default           | Extra                       |
| ---------------- | ------------ | ---- | --- | ----------------- | --------------------------- |
| id               | int(11)      | NO   | PRI |                   | auto_increment              |
| service_id       | int(11)      | NO   | MUL |                   |                             |
| field_name       | varchar(100) | NO   |     |                   |                             |
| created_at       | timestamp    | NO   |     | CURRENT_TIMESTAMP |                             |
| updated_at       | timestamp    | NO   |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |
| type             | varchar(50)  | NO   |     |                   |                             |
| required         | tinyint(1)   | YES  |     | 0                 |                             |
| options          | json         | YES  |     |                   |                             |
| depends_on_field | varchar(100) | YES  |     |                   |                             |
| depends_on_value | varchar(100) | YES  |     |                   |                             |
| label            | varchar(255) | YES  |     |                   |                             |

### Índices:

| Key_name                                 | Column_name | Unique | Seq_in_index |
| ---------------------------------------- | ----------- | ------ | ------------ |
| PRIMARY                                  | id          | YES    | 1            |
| service_id                               | service_id  | YES    | 1            |
| service_id                               | field_name  | YES    | 2            |
| idx_service_additional_fields_service_id | service_id  | NO     | 1            |

---

## TABLA: service_additional_values

### CREATE TABLE Statement:

```sql
CREATE TABLE `service_additional_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `selected_service_id` int(11) NOT NULL,
  `field_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `field_value` text COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_selected_service_id` (`selected_service_id`),
  CONSTRAINT `service_additional_values_ibfk_1` FOREIGN KEY (`selected_service_id`) REFERENCES `selected_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=516 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field               | Type         | Null | Key | Default           | Extra          |
| ------------------- | ------------ | ---- | --- | ----------------- | -------------- |
| id                  | int(11)      | NO   | PRI |                   | auto_increment |
| selected_service_id | int(11)      | NO   | MUL |                   |                |
| field_name          | varchar(100) | NO   |     |                   |                |
| field_value         | text         | NO   |     |                   |                |
| created_at          | timestamp    | NO   |     | CURRENT_TIMESTAMP |                |

### Índices:

| Key_name                | Column_name         | Unique | Seq_in_index |
| ----------------------- | ------------------- | ------ | ------------ |
| PRIMARY                 | id                  | YES    | 1            |
| idx_selected_service_id | selected_service_id | NO     | 1            |

---

## TABLA: service_categories

### CREATE TABLE Statement:

```sql
CREATE TABLE `service_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field      | Type         | Null | Key | Default           | Extra                       |
| ---------- | ------------ | ---- | --- | ----------------- | --------------------------- |
| id         | int(11)      | NO   | PRI |                   | auto_increment              |
| code       | varchar(10)  | NO   |     |                   |                             |
| name       | varchar(255) | NO   |     |                   |                             |
| created_at | timestamp    | NO   |     | CURRENT_TIMESTAMP |                             |
| updated_at | timestamp    | NO   |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |

### Índices:

| Key_name | Column_name | Unique | Seq_in_index |
| -------- | ----------- | ------ | ------------ |
| PRIMARY  | id          | YES    | 1            |

---

## TABLA: service_instance_values

### CREATE TABLE Statement:

```sql
CREATE TABLE `service_instance_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_instance_id` int(11) NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `field_value` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_service_instance_values_instance` (`service_instance_id`),
  CONSTRAINT `fk_service_instance_values_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `service_instances` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5152 DEFAULT CHARSET=utf8mb4
```

### Columnas:

| Field               | Type         | Null | Key | Default           | Extra                       |
| ------------------- | ------------ | ---- | --- | ----------------- | --------------------------- |
| id                  | int(11)      | NO   | PRI |                   | auto_increment              |
| service_instance_id | int(11)      | NO   | MUL |                   |                             |
| field_name          | varchar(255) | NO   |     |                   |                             |
| field_value         | text         | YES  |     |                   |                             |
| created_at          | timestamp    | YES  |     | CURRENT_TIMESTAMP |                             |
| updated_at          | timestamp    | YES  |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |

### Índices:

| Key_name                            | Column_name         | Unique | Seq_in_index |
| ----------------------------------- | ------------------- | ------ | ------------ |
| PRIMARY                             | id                  | YES    | 1            |
| fk_service_instance_values_instance | service_instance_id | NO     | 1            |

---

## TABLA: service_instances

### CREATE TABLE Statement:

```sql
CREATE TABLE `service_instances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `selected_service_id` int(11) NOT NULL,
  `instance_number` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_service_instance_selected_service` (`selected_service_id`),
  CONSTRAINT `fk_service_instance_selected_service` FOREIGN KEY (`selected_service_id`) REFERENCES `selected_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=657 DEFAULT CHARSET=utf8mb4
```

### Columnas:

| Field               | Type      | Null | Key | Default           | Extra                       |
| ------------------- | --------- | ---- | --- | ----------------- | --------------------------- |
| id                  | int(11)   | NO   | PRI |                   | auto_increment              |
| selected_service_id | int(11)   | NO   | MUL |                   |                             |
| instance_number     | int(11)   | NO   |     |                   |                             |
| created_at          | timestamp | YES  |     | CURRENT_TIMESTAMP |                             |
| updated_at          | timestamp | YES  |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |

### Índices:

| Key_name                             | Column_name         | Unique | Seq_in_index |
| ------------------------------------ | ------------------- | ------ | ------------ |
| PRIMARY                              | id                  | YES    | 1            |
| fk_service_instance_selected_service | selected_service_id | NO     | 1            |

---

## TABLA: service_requests

### CREATE TABLE Statement:

```sql
CREATE TABLE `service_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `name_project` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `identification` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci NOT NULL,
  `status` enum('pendiente','en proceso','completado','cancelado') COLLATE utf8_unicode_ci DEFAULT 'pendiente',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field          | Type                                                    | Null | Key | Default           | Extra                       |
| -------------- | ------------------------------------------------------- | ---- | --- | ----------------- | --------------------------- |
| id             | int(11)                                                 | NO   | PRI |                   | auto_increment              |
| name           | varchar(255)                                            | NO   |     |                   |                             |
| name_project   | varchar(255)                                            | NO   |     |                   |                             |
| location       | varchar(255)                                            | NO   |     |                   |                             |
| identification | varchar(50)                                             | NO   |     |                   |                             |
| phone          | varchar(20)                                             | NO   |     |                   |                             |
| email          | varchar(255)                                            | NO   |     |                   |                             |
| description    | text                                                    | NO   |     |                   |                             |
| status         | enum('pendiente','en proceso','completado','cancelado') | YES  |     | pendiente         |                             |
| created_at     | timestamp                                               | NO   |     | CURRENT_TIMESTAMP |                             |
| updated_at     | timestamp                                               | NO   |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |

### Índices:

| Key_name | Column_name | Unique | Seq_in_index |
| -------- | ----------- | ------ | ------------ |
| PRIMARY  | id          | YES    | 1            |

---

## TABLA: services

### CREATE TABLE Statement:

```sql
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `code` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field       | Type         | Null | Key | Default           | Extra                       |
| ----------- | ------------ | ---- | --- | ----------------- | --------------------------- |
| id          | int(11)      | NO   | PRI |                   | auto_increment              |
| category_id | int(11)      | NO   |     |                   |                             |
| code        | varchar(10)  | NO   |     |                   |                             |
| name        | varchar(255) | NO   |     |                   |                             |
| created_at  | timestamp    | NO   |     | CURRENT_TIMESTAMP |                             |
| updated_at  | timestamp    | NO   |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |

### Índices:

| Key_name | Column_name | Unique | Seq_in_index |
| -------- | ----------- | ------ | ------------ |
| PRIMARY  | id          | YES    | 1            |

---

## TABLA: usuarios

### CREATE TABLE Statement:

```sql
CREATE TABLE `usuarios` (
  `usuario_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `role` enum('admin','lab','client') COLLATE utf8_unicode_ci DEFAULT 'client',
  `failed_attempts` int(11) DEFAULT '0',
  `last_failed_attempt` datetime DEFAULT NULL,
  `account_locked_until` datetime DEFAULT NULL,
  `password_reset_token` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `last_password_change` datetime DEFAULT NULL,
  UNIQUE KEY `usuario_id` (`usuario_id`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
```

### Columnas:

| Field                  | Type                         | Null | Key | Default           | Extra          |
| ---------------------- | ---------------------------- | ---- | --- | ----------------- | -------------- |
| usuario_id             | int(11)                      | NO   | PRI |                   | auto_increment |
| name                   | varchar(100)                 | NO   |     |                   |                |
| email                  | varchar(100)                 | NO   | MUL |                   |                |
| password               | varchar(255)                 | NO   |     |                   |                |
| created_at             | timestamp                    | NO   |     | CURRENT_TIMESTAMP |                |
| role                   | enum('admin','lab','client') | YES  |     | client            |                |
| failed_attempts        | int(11)                      | YES  |     | 0                 |                |
| last_failed_attempt    | datetime                     | YES  |     |                   |                |
| account_locked_until   | datetime                     | YES  |     |                   |                |
| password_reset_token   | varchar(255)                 | YES  |     |                   |                |
| password_reset_expires | datetime                     | YES  |     |                   |                |
| last_password_change   | datetime                     | YES  |     |                   |                |

### Índices:

| Key_name   | Column_name | Unique | Seq_in_index |
| ---------- | ----------- | ------ | ------------ |
| usuario_id | usuario_id  | YES    | 1            |
| idx_email  | email       | NO     | 1            |

---
