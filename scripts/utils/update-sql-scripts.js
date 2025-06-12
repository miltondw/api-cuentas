const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Función para buscar archivos de forma recursiva
function findFilesRecursively(dir, pattern) {
  let results = [];

  // Lista de archivos y directorios en el directorio actual
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    // Si es un directorio, buscamos recursivamente
    if (stat.isDirectory()) {
      results = results.concat(findFilesRecursively(itemPath, pattern));
    }
    // Si es un archivo y coincide con el patrón, lo añadimos a los resultados
    else if (stat.isFile() && pattern.test(item)) {
      results.push(itemPath);
    }
  }

  return results;
}

// Reemplazar en archivos
function updateTableNamesInFile(filePath) {
  console.log(`📄 Procesando archivo: ${filePath}`);

  try {
    // Leer el contenido del archivo    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let updated = false;

    // Tablas a buscar y reemplazar
    const replacements = [
      { old: 'auth_log', new: 'auth_logs' },
      { old: 'user_session', new: 'user_sessions' },
      { old: 'failed_login_attempt', new: 'failed_login_attempts' },
      { old: 'IDX_AUTH_LOG', new: 'IDX_AUTH_LOGS' },
      { old: 'IDX_USER_SESSION', new: 'IDX_USER_SESSIONS' },
      { old: 'IDX_FAILED_LOGIN_ATTEMPT', new: 'IDX_FAILED_LOGIN_ATTEMPTS' },
      { old: 'idx_auth_log', new: 'idx_auth_logs' },
      { old: 'idx_user_session', new: 'idx_user_sessions' },
      { old: 'idx_failed_login_attempt', new: 'idx_failed_login_attempts' },
    ];

    // Reemplazar todos los patrones usando expresiones regulares con límites de palabra
    for (const replacement of replacements) {
      const regex = new RegExp(`\\b${replacement.old}\\b`, 'g');
      const updatedContent = content.replace(regex, replacement.new);

      if (content !== updatedContent) {
        content = updatedContent;
        updated = true;
      }
    }

    // Solo escribir en el archivo si hubo cambios
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Actualizados nombres de tablas en: ${filePath}`);
      // Contar sustituciones
      const counts = {};
      for (const replacement of replacements) {
        const regex = new RegExp(`\\b${replacement.old}\\b`, 'g');
        const matches = originalContent.match(regex);
        if (matches) {
          counts[replacement.old] = matches.length;
        }
      }

      if (Object.keys(counts).length > 0) {
        console.log(`   Reemplazos: ${JSON.stringify(counts)}`);
      }
    } else {
      console.log(
        `⏭️ No se encontraron tablas para actualizar en: ${filePath}`,
      );
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}: ${error.message}`);
  }
}

async function updateSqlScripts() {
  console.log('🔄 Actualizando nombres de tablas en scripts SQL y JS...');

  // Directorios a escanear
  const directories = [
    path.join(__dirname), // scripts
    path.join(__dirname, '..', 'src', 'migrations'), // migrations
    path.join(__dirname, '..', 'src', 'modules'), // modules
  ];

  // Patrones de archivos a buscar
  const patterns = [
    /\.(sql|js)$/i, // Archivos SQL y JS
    /\.ts$/i, // Archivos TypeScript
  ];

  let allFiles = [];

  // Encontrar todos los archivos relevantes
  for (const dir of directories) {
    for (const pattern of patterns) {
      allFiles = allFiles.concat(findFilesRecursively(dir, pattern));
    }
  }

  console.log(`🔍 Encontrados ${allFiles.length} archivos para revisar.`);

  // Procesar cada archivo
  for (const file of allFiles) {
    updateTableNamesInFile(file);
  }

  console.log('\n✅ Proceso de actualización completado');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  updateSqlScripts()
    .then(() => {
      console.log('👍 Los scripts SQL y archivos JS han sido actualizados');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = updateSqlScripts;
