const mysql = require('mysql2/promise');

async function checkAdditionalInfo() {
  let connection;
  
  try {
    // Configuración de la base de datos
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Ingeocimyc2024*',
      database: 'ingeocimyc_cuentas'
    });
    
    console.log('Conectado a la base de datos');
    
    // Verificar si existen las tablas de información adicional
    const tables = [
      'service_additional_fields',
      'service_additional_values', 
      'service_instances',
      'service_instance_values'
    ];
    
    for (const table of tables) {
      console.log(`\n=== Verificando tabla: ${table} ===`);
      
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`Registros en ${table}: ${rows[0].count}`);
        
        if (rows[0].count > 0) {
          const [sample] = await connection.execute(`SELECT * FROM ${table} LIMIT 3`);
          console.log('Muestra de datos:');
          console.table(sample);
        }
      } catch (error) {
        console.log(`Error al consultar ${table}:`, error.message);
      }
    }
    
    // Verificar si hay servicios con campos adicionales
    console.log('\n=== Servicios con campos adicionales ===');
    try {
      const [services] = await connection.execute(`
        SELECT s.code, s.name, COUNT(af.id) as additional_fields_count
        FROM services s
        LEFT JOIN service_additional_fields af ON s.id = af.service_id
        GROUP BY s.id
        HAVING additional_fields_count > 0
        LIMIT 10
      `);
      
      if (services.length > 0) {
        console.log('Servicios con campos adicionales:');
        console.table(services);
      } else {
        console.log('No hay servicios con campos adicionales definidos');
      }
    } catch (error) {
      console.log('Error al consultar servicios:', error.message);
    }
    
    // Verificar solicitudes con información adicional
    console.log('\n=== Solicitudes con información adicional ===');
    try {
      const [requests] = await connection.execute(`
        SELECT sr.id, sr.name, COUNT(sav.id) as additional_values_count
        FROM service_requests sr
        JOIN selected_services ss ON sr.id = ss.request_id
        LEFT JOIN service_additional_values sav ON ss.id = sav.selected_service_id
        GROUP BY sr.id
        HAVING additional_values_count > 0
        LIMIT 5
      `);
      
      if (requests.length > 0) {
        console.log('Solicitudes con valores adicionales:');
        console.table(requests);
      } else {
        console.log('No hay solicitudes con valores adicionales');
      }
    } catch (error) {
      console.log('Error al consultar solicitudes:', error.message);
    }
    
  } catch (error) {
    console.error('Error de conexión:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAdditionalInfo();
