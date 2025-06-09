const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    console.log('Verificando usuarios en la base de datos...');

    const [users] = await connection.execute(
      'SELECT usuario_id, name, email, role, created_at FROM usuarios',
    );

    console.log('Usuarios encontrados:');
    console.table(users);    // Verificar si existe el usuario específico
    const [specificUser] = await connection.execute(
      'SELECT usuario_id, name, email, role, created_at FROM usuarios WHERE email = ?',
      ['milton@ingeocimyc.com'],
    );

    if (specificUser.length > 0) {
      console.log('\nUsuario milton@ingeocimyc.com encontrado:');
      console.table(specificUser);
    } else {
      console.log('\nUsuario milton@ingeocimyc.com NO encontrado');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkUsers();
