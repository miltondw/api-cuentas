const mysql = require('mysql2/promise');

async function checkDatabaseStructure() {
  try {
    const connection = await mysql.createConnection({
      host: '162.241.61.244',
      user: 'ingeocim_miltondw',
      password: '$Rdu1N01',
      database: 'ingeocim_form',
    });

    console.log('📊 TABLAS EN LA BASE DE DATOS:');
    const [tables] = await connection.execute('SHOW TABLES');

    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`\n🔍 ESTRUCTURA DE: ${tableName}`);

      const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(
          `  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `KEY:${col.Key}` : ''}`,
        );
      });
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabaseStructure();
