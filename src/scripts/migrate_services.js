/**
 * Script para migrar la estructura de datos de servicios al nuevo formato que soporta múltiples instancias
 * Este script debe ejecutarse una sola vez después de actualizar el código del API
 */

import db from "../config/db.js";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  try {
    // Leer el archivo SQL de migración
    const sqlPath = path.join(__dirname, '..', 'scripts', 'update_service_tables.sql');
    const sqlScript = await fs.readFile(sqlPath, 'utf8');
    
    // Dividir el script en declaraciones individuales
    const statements = sqlScript
      .replace(/\r\n/g, '\n')
      .split(';')
      .filter(stmt => stmt.trim() !== '');
    
    console.log(`Ejecutando ${statements.length} instrucciones SQL`);
    
    // Ejecutar cada sentencia SQL
    for (const statement of statements) {
      console.log(`Ejecutando: ${statement.substring(0, 50)}...`);
      await db.query(statement);
    }
    
    console.log('Migración completada exitosamente!');
    console.log('La API ahora soporta múltiples instancias de servicios');
    
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  } finally {
    // Cerrar la conexión a la base de datos
    await db.end();
  }
};

// Ejecutar la migración
runMigration();
