const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  console.log('🔍 Iniciando verificación de la base de datos...');
  
  try {
    // Usar variables de entorno
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '162.241.61.244',
      user: process.env.DB_USERNAME || 'ingeocim_miltondw',
      password: process.env.DB_PASSWORD || '$Rdu1N01',
      database: process.env.DB_DATABASE || 'ingeocim_form'
    });

    console.log('✅ Conexión exitosa a la base de datos');

    // Verificar estructura de la tabla usuarios
    console.log('\n📋 Verificando estructura de la tabla usuarios...');
    const [columns] = await connection.execute('DESCRIBE usuarios');
    console.log('Columnas actuales:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''} ${col.Default ? `DEFAULT: ${col.Default}` : ''}`);
    });

    // Verificar si existe la columna role
    const roleColumn = columns.find(col => col.Field === 'role');
    if (roleColumn) {
      console.log('\n✅ La columna role existe');
      console.log(`Tipo: ${roleColumn.Type}, Default: ${roleColumn.Default}`);
    } else {
      console.log('\n❌ La columna role NO existe - agregándola...');
      
      try {
        // Ejecutar el script para agregar la columna role
        console.log('🔧 Agregando columna role...');
        await connection.execute("ALTER TABLE usuarios ADD COLUMN role ENUM('admin', 'lab', 'client') DEFAULT 'client'");
        console.log('✅ Columna role agregada exitosamente');
        
        // Actualizar roles de usuarios específicos
        console.log('🔧 Actualizando roles de usuarios específicos...');
        await connection.execute("UPDATE usuarios SET role = 'admin' WHERE email = 'eider@ingeocimyc.com'");
        await connection.execute("UPDATE usuarios SET role = 'lab' WHERE email = 'milton@ingeocimyc.com'");
        await connection.execute("UPDATE usuarios SET role = 'admin' WHERE email = 'daniel@ingeocimyc.com'");
        console.log('✅ Roles de usuarios actualizados');
      } catch (alterError) {
        console.error('❌ Error al modificar la tabla:', alterError.message);
        if (alterError.message.includes('Duplicate column name')) {
          console.log('ℹ️ La columna role ya existe (error de duplicado)');
        } else {
          throw alterError;
        }
      }
    }

    // Verificar usuarios existentes con sus roles
    console.log('\n👥 Usuarios en la base de datos:');
    const [users] = await connection.execute('SELECT email, name, COALESCE(role, "sin_rol") as role, created_at FROM usuarios ORDER BY email');
    users.forEach(user => {
      const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
      console.log(`- ${user.email}: ${user.name} (${user.role}) - Creado: ${createdDate}`);
    });

    // Verificar estructura final
    console.log('\n📋 Estructura final de la tabla usuarios:');
    const [finalColumns] = await connection.execute('DESCRIBE usuarios');
    finalColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });

    await connection.end();
    console.log('\n✅ Verificación y configuración completada');
    console.log('🚀 La base de datos está lista para la aplicación NestJS');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar la función principal
checkDatabase().catch(console.error);
