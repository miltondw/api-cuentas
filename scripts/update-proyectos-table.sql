-- Añadir campo estado a la tabla proyectos
ALTER TABLE proyectos 
ADD COLUMN estado ENUM('activo', 'completado', 'cancelado') NOT NULL DEFAULT 'activo' AFTER metodo_de_pago;

-- Añadir campo createdAt a la tabla proyectos
ALTER TABLE proyectos
ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER estado;

-- Actualizar datos existentes para establecer estado basado en pagos
-- Si abono = costo_servicio entonces estado = 'completado'
UPDATE proyectos 
SET estado = 'completado' 
WHERE abono = costo_servicio OR abono >= costo_servicio;
