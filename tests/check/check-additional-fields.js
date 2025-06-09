const mysql = require('mysql2/promise');

async function checkAdditionalFields() {
  let connection;

  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ingeocimyc_db',
    });

    console.log('✅ Conectado a la base de datos');

    // Verificar campos adicionales de servicios
    console.log('\n--- CAMPOS ADICIONALES DE SERVICIOS ---');
    const [additionalFields] = await connection.execute(
      'SELECT saf.*, s.name as service_name FROM service_additional_fields saf JOIN services s ON saf.service_id = s.id LIMIT 5',
    );
    console.log('Campos adicionales encontrados:', additionalFields.length);
    additionalFields.forEach(field => {
      console.log(
        `- ${field.service_name}: ${field.field_name} (${field.type})`,
      );
    });

    // Verificar valores adicionales de servicios seleccionados
    console.log('\n--- VALORES ADICIONALES DE SERVICIOS SELECCIONADOS ---');
    const [additionalValues] = await connection.execute(
      'SELECT sav.*, ss.id as selected_service_id FROM service_additional_values sav JOIN selected_services ss ON sav.selected_service_id = ss.id LIMIT 5',
    );
    console.log('Valores adicionales encontrados:', additionalValues.length);
    additionalValues.forEach(value => {
      console.log(
        `- Selected Service ${value.selected_service_id}: ${value.field_name} = ${value.field_value}`,
      );
    });

    // Verificar instancias de servicios
    console.log('\n--- INSTANCIAS DE SERVICIOS ---');
    const [serviceInstances] = await connection.execute(
      'SELECT si.*, ss.id as selected_service_id FROM service_instances si JOIN selected_services ss ON si.selected_service_id = ss.id LIMIT 5',
    );
    console.log('Instancias encontradas:', serviceInstances.length);
    serviceInstances.forEach(instance => {
      console.log(
        `- Selected Service ${instance.selected_service_id}: Instance ${instance.instance_number}`,
      );
    });

    // Verificar valores de instancias
    console.log('\n--- VALORES DE INSTANCIAS ---');
    const [instanceValues] = await connection.execute(
      'SELECT siv.*, si.instance_number FROM service_instance_values siv JOIN service_instances si ON siv.service_instance_id = si.id LIMIT 5',
    );
    console.log('Valores de instancias encontrados:', instanceValues.length);
    instanceValues.forEach(value => {
      console.log(
        `- Instance ${value.instance_number}: ${value.field_name} = ${value.field_value}`,
      );
    });

    // Verificar un servicio específico con campos adicionales
    console.log('\n--- SERVICIO ESPECÍFICO CON CAMPOS ADICIONALES ---');
    const [serviceWithFields] = await connection.execute(
      'SELECT s.name, saf.field_name, saf.type, saf.required FROM services s JOIN service_additional_fields saf ON s.id = saf.service_id WHERE s.id = 40 LIMIT 10',
    );
    console.log(
      'Servicio DMC-1 (Diseño de mezclas) - campos:',
      serviceWithFields.length,
    );
    serviceWithFields.forEach(field => {
      console.log(
        `- ${field.field_name} (${field.type}) - Required: ${field.required}`,
      );
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAdditionalFields();
