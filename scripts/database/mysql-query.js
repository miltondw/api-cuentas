const mysql = require('mysql2/promise');
require('dotenv').config();

async function runQuery(query) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    console.log(`🔍 Ejecutando: ${query}`);
    console.log('');

    const [results] = await connection.execute(query);

    if (Array.isArray(results)) {
      console.table(results);
    } else {
      console.log('✅ Consulta ejecutada exitosamente');
      console.log(results);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

// Si pasas una consulta como argumento
const query = process.argv[2] || 'SELECT * FROM usuarios WHERE role = "admin"';
runQuery(query).catch(console.error);
