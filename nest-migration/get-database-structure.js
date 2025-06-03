const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function getDatabaseStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    console.log('Conectado a la base de datos...');

    // Obtener lista de tablas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`Encontradas ${tables.length} tablas`);

    let structure = '# ESTRUCTURA COMPLETA DE LA BASE DE DATOS\n';
    structure += `Database: ${process.env.DB_DATABASE}\n`;
    structure += `Generated: ${new Date().toISOString()}\n\n`;

    structure += '## LISTA DE TABLAS\n';
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      structure += `- ${tableName}\n`;
    });
    structure += '\n';

    // Para cada tabla, obtener su estructura
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`Obteniendo estructura de: ${tableName}`);

      structure += `## TABLA: ${tableName}\n\n`;

      // Obtener CREATE TABLE statement
      const [createTable] = await connection.execute(
        `SHOW CREATE TABLE \`${tableName}\``,
      );
      structure += '### CREATE TABLE Statement:\n```sql\n';
      structure += createTable[0]['Create Table'];
      structure += '\n```\n\n';

      // Obtener descripción de columnas
      const [columns] = await connection.execute(`DESCRIBE \`${tableName}\``);
      structure += '### Columnas:\n';
      structure += '| Field | Type | Null | Key | Default | Extra |\n';
      structure += '|-------|------|------|-----|---------|-------|\n';

      columns.forEach(col => {
        structure += `| ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key || ''} | ${col.Default || ''} | ${col.Extra || ''} |\n`;
      });
      structure += '\n';

      // Obtener índices
      const [indexes] = await connection.execute(
        `SHOW INDEX FROM \`${tableName}\``,
      );
      if (indexes.length > 0) {
        structure += '### Índices:\n';
        structure += '| Key_name | Column_name | Unique | Seq_in_index |\n';
        structure += '|----------|-------------|--------|---------------|\n';

        indexes.forEach(idx => {
          structure += `| ${idx.Key_name} | ${idx.Column_name} | ${idx.Non_unique === 0 ? 'YES' : 'NO'} | ${idx.Seq_in_index} |\n`;
        });
        structure += '\n';
      }

      structure += '---\n\n';
    }

    // Guardar en archivo
    fs.writeFileSync('database_structure.md', structure);
    console.log('Estructura guardada en database_structure.md');

    // También crear un resumen JSON para fácil acceso programático
    const structureJson = {};
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [columns] = await connection.execute(`DESCRIBE \`${tableName}\``);
      structureJson[tableName] = columns;
    }

    fs.writeFileSync(
      'database_structure.json',
      JSON.stringify(structureJson, null, 2),
    );
    console.log('Estructura JSON guardada en database_structure.json');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

getDatabaseStructure();
