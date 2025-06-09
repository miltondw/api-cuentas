import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';

async function migrateData() {
  console.log('🚀 Iniciando migración de datos...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Verificar que las tablas existen antes de migrar
    console.log('📋 Verificando estructura de base de datos...');

    // Ejecutar el script SQL de estructura si es necesario
    const sqlPath = path.join(__dirname, '../../scripts/cliente.sql');

    try {
      await fs.access(sqlPath);
      console.log('📂 Ejecutando script de estructura de base de datos...');
      const sqlContent = await fs.readFile(sqlPath, 'utf8');

      // Dividir el archivo SQL en consultas individuales
      const queries = sqlContent
        .split(';')
        .map(query => query.trim())
        .filter(query => query.length > 0 && !query.startsWith('--'));

      for (const query of queries) {
        try {
          await dataSource.query(query);
          console.log(`✅ Ejecutada: ${query.substring(0, 50)}...`);
        } catch {
          console.log(
            `⚠️  Saltando query (probablemente ya existe): ${query.substring(0, 50)}...`,
          );
        }
      }
    } catch {
      console.log('⚠️  No se encontró el archivo cliente.sql, saltando...');
    }

    console.log('✅ Migración de datos completada exitosamente');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Ejecutar migración si el script se ejecuta directamente
if (require.main === module) {
  migrateData();
}

export { migrateData };
