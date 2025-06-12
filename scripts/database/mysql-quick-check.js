const mysql = require('mysql2/promise');
require('dotenv').config();

async function connectAndQuery() {
  console.log('🔐 Conectando a MySQL...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    console.log('✅ Conectado exitosamente a MySQL');
    console.log(
      `📋 Conectado a: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
    );
    console.log('');

    // Mostrar todas las tablas
    console.log('📂 TABLAS EN LA BASE DE DATOS:');
    const [tables] = await connection.execute('SHOW TABLES');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   ✅ ${tableName}`);
    });
    console.log('');

    // Verificar usuarios
    console.log('👥 USUARIOS EN EL SISTEMA:');
    try {
      const [users] = await connection.execute(`
        SELECT usuario_id, email, name, role, is_active, login_count, failed_attempts 
        FROM usuarios 
        ORDER BY usuario_id
      `);

      users.forEach(user => {
        console.log(
          `   👤 ID ${user.usuario_id}: ${user.email} (${user.name}) - Rol: ${user.role}`,
        );
        console.log(
          `      Estado: ${user.is_active ? 'Activo' : 'Inactivo'} | Logins: ${user.login_count || 0} | Fallos: ${user.failed_attempts || 0}`,
        );
      });
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');

    // Verificar estructura de user_sessions
    console.log('🔍 ESTRUCTURA DE user_sessions:');
    try {
      const [columns] = await connection.execute('DESCRIBE user_sessions');
      columns.forEach(col => {
        console.log(
          `   📋 ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`,
        );
      });
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  connectAndQuery().catch(console.error);
}
