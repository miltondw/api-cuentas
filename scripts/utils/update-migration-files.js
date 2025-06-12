const fs = require('fs');
const path = require('path');

// Archivos de migración a actualizar y sus correspondientes cambios
const migrations = [
  {
    filePath: path.join(
      __dirname,
      '..',
      'src',
      'migrations',
      '1700000001-CreateAuthLogTable.ts',
    ),
    oldTableName: 'auth_log',
    newTableName: 'auth_logs',
    oldIndexPrefix: 'IDX_AUTH_LOG',
    newIndexPrefix: 'IDX_AUTH_LOGS',
  },
  {
    filePath: path.join(
      __dirname,
      '..',
      'src',
      'migrations',
      '1700000002-CreateUserSessionTable.ts',
    ),
    oldTableName: 'user_session',
    newTableName: 'user_sessions',
    oldIndexPrefix: 'IDX_USER_SESSION',
    newIndexPrefix: 'IDX_USER_SESSIONS',
  },
  {
    filePath: path.join(
      __dirname,
      '..',
      'src',
      'migrations',
      '1700000003-CreateFailedLoginAttemptTable.ts',
    ),
    oldTableName: 'failed_login_attempt',
    newTableName: 'failed_login_attempts',
    oldIndexPrefix: 'IDX_FAILED_LOGIN_ATTEMPT',
    newIndexPrefix: 'IDX_FAILED_LOGIN_ATTEMPTS',
  },
];

async function updateMigrationFiles() {
  console.log(
    '🔄 Actualizando archivos de migración para usar nombres de tablas en plural...',
  );

  for (const migration of migrations) {
    try {
      console.log(`📝 Procesando archivo: ${migration.filePath}`);

      // Verificar si el archivo existe
      if (!fs.existsSync(migration.filePath)) {
        console.log(
          `⚠️ El archivo ${migration.filePath} no existe, omitiendo.`,
        );
        continue;
      }

      // Leer el archivo
      let content = fs.readFileSync(migration.filePath, 'utf8');

      // Reemplazar el nombre de la tabla
      const tableNameRegex = new RegExp(
        `name: ['"]${migration.oldTableName}['"]`,
        'g',
      );
      content = content.replace(
        tableNameRegex,
        `name: '${migration.newTableName}'`,
      ); // Reemplazar referencias al nombre de la tabla en comentarios o strings
      // Usamos un enfoque más preciso para evitar reemplazos incorrectos
      const tableNameLiteralRegex = new RegExp(
        `\\b${migration.oldTableName}\\b`,
        'g',
      );
      content = content.replace(tableNameLiteralRegex, migration.newTableName);

      // Reemplazar prefijos de índices
      const indexPrefixRegex = new RegExp(migration.oldIndexPrefix, 'g');
      content = content.replace(indexPrefixRegex, migration.newIndexPrefix);

      // Guardar el archivo actualizado
      fs.writeFileSync(migration.filePath, content);
      console.log(
        `✅ Archivo ${migration.filePath} actualizado correctamente.`,
      );
    } catch (error) {
      console.error(
        `❌ Error al procesar el archivo ${migration.filePath}:`,
        error.message,
      );
    }
  }

  console.log('✅ Actualización de archivos de migración completada');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  updateMigrationFiles()
    .then(() => {
      console.log('👍 Los archivos de migración han sido actualizados');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = updateMigrationFiles;
