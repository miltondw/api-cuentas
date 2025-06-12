-- Script para actualizar la tabla usuarios con roles y usuario_id
USE ingeocim_form;

-- Agregar usuario_id como primary key autoincremental si no existe
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS usuario_id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Agregar columna role si no existe
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS role ENUM('admin', 'lab', 'client') DEFAULT 'client';

-- Actualizar los roles de los usuarios existentes
UPDATE usuarios
SET role = 'admin'
WHERE
    email = 'eider@ingeocimyc.com';

UPDATE usuarios
SET role = 'lab'
WHERE
    email = 'milton@ingeocimyc.com';

UPDATE usuarios
SET role = 'admin'
WHERE
    email = 'daniel@ingeocimyc.com';

-- Verificar los cambios
SELECT email, name, role, created_at FROM usuarios;