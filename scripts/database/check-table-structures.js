const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructures() {
  console.log('🔍 Verificando estructura de las tablas de seguridad...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    // Verificar qué tablas existen
    console.log('\n📋 TABLAS RELACIONADAS CON SEGURIDAD:');
    const [tables] = await connection.execute(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND (TABLE_NAME LIKE '%auth%' OR TABLE_NAME LIKE '%session%' OR TABLE_NAME LIKE '%failed%' OR TABLE_NAME = 'usuarios')
      ORDER BY TABLE_NAME
    `,
      [process.env.DB_DATABASE],
    );

    const tableNames = tables.map(table => table.TABLE_NAME);
    console.log('Tablas encontradas:', tableNames.join(', '));

    // Detectar tablas duplicadas con nombres similares
    const duplicateTables = findDuplicateTablesPattern(tableNames);

    if (duplicateTables.length > 0) {
      console.log('\n⚠️ TABLAS POSIBLEMENTE DUPLICADAS:');
      duplicateTables.forEach(group => {
        console.log(`  - Grupo: ${group.join(', ')}`);
      });
    }

    // Verificar estructura de usuarios
    console.log('\n📋 ESTRUCTURA DE TABLA usuarios:');
    const [usuariosStructure] = await connection.execute(`DESCRIBE usuarios`);
    usuariosStructure.forEach(column => {
      console.log(
        `  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`,
      );
    });

    // Detectar campos duplicados en la tabla usuarios
    const duplicateFields = findDuplicateFields(usuariosStructure);

    if (duplicateFields.length > 0) {
      console.log('\n⚠️ CAMPOS POSIBLEMENTE DUPLICADOS EN USUARIOS:');
      duplicateFields.forEach(group => {
        console.log(`  - Grupo: ${group.map(f => f.Field).join(', ')}`);
      });
    }

    // Verificar estructura de auth_logs
    console.log('\n📋 ESTRUCTURA DE TABLA auth_logs:');
    const [authLogsStructure] = await connection.execute(`DESCRIBE auth_logs`);
    authLogsStructure.forEach(column => {
      console.log(
        `  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`,
      );
    });

    // Verificar estructura de user_sessions
    console.log('\n📋 ESTRUCTURA DE TABLA user_sessions:');
    const [userSessionsStructure] = await connection.execute(
      `DESCRIBE user_sessions`,
    );
    userSessionsStructure.forEach(column => {
      console.log(
        `  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`,
      );
    });

    // Verificar estructura de failed_login_attempts
    console.log('\n📋 ESTRUCTURA DE TABLA failed_login_attempts:');
    const [failedLoginStructure] = await connection.execute(
      `DESCRIBE failed_login_attempts`,
    );
    failedLoginStructure.forEach(column => {
      console.log(
        `  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`,
      );
    });

    // Generar recomendaciones
    console.log('\n🔧 RECOMENDACIONES:');

    if (duplicateTables.length > 0) {
      console.log('1. Resolver tablas duplicadas:');
      duplicateTables.forEach(group => {
        console.log(
          `   - Verificar cuál de estas tablas está en uso actualmente en el código: ${group.join(', ')}`,
        );
        console.log(
          '     Migrar datos si es necesario y eliminar las tablas no utilizadas.',
        );
      });
    }

    if (duplicateFields.length > 0) {
      console.log('2. Resolver campos duplicados en la tabla usuarios:');
      duplicateFields.forEach(group => {
        const names = group.map(f => f.Field);
        console.log(`   - Decidir entre: ${names.join(' o ')}`);
        console.log(
          '     Actualizar el código para usar un único campo y eliminar los duplicados.',
        );
      });
    }

    tables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME}`);
    });
  } catch (error) {
    console.error('❌ Error verificando estructura:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Función para encontrar tablas duplicadas basadas en patrones comunes
function findDuplicateTablesPattern(tableNames) {
  const singularToPlural = {};

  tableNames.forEach(name => {
    // Comprobar si la tabla tiene versión singular o plural
    let baseName = name;
    let isPlural = false;

    if (name.endsWith('s')) {
      baseName = name.slice(0, -1);
      isPlural = true;
    }

    if (!singularToPlural[baseName]) {
      singularToPlural[baseName] = [];
    }

    singularToPlural[baseName].push(name);
  });

  // Filtrar solo los grupos con más de una tabla
  return Object.values(singularToPlural).filter(group => group.length > 1);
}

// Función para encontrar campos duplicados basados en convención de nomenclatura
function findDuplicateFields(fields) {
  const snakeToCamel = {};

  fields.forEach(field => {
    const fieldName = field.Field;
    // Convertir camelCase a snake_case para comparación
    const snakeCaseName = fieldName.replace(
      /[A-Z]/g,
      letter => `_${letter.toLowerCase()}`,
    );

    // Convertir snake_case a camelCase para comparación
    const camelCaseName = fieldName.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );

    // Usar la versión más corta como clave
    const key =
      fieldName.length <= snakeCaseName.length ? fieldName : snakeCaseName;

    if (!snakeToCamel[key]) {
      snakeToCamel[key] = [];
    }

    snakeToCamel[key].push(field);
  });

  // Filtrar solo los grupos con más de un campo
  return Object.values(snakeToCamel).filter(group => group.length > 1);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  checkTableStructures()
    .then(() => {
      console.log('\n✅ Verificación de estructura completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en la verificación:', error);
      process.exit(1);
    });
}

module.exports = checkTableStructures;
