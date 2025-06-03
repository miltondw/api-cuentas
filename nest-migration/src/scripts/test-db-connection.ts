import { DataSource } from 'typeorm';
import { ServiceRequest } from '../modules/service-requests/entities/service-request.entity';
import { SelectedService } from '../modules/service-requests/entities/selected-service.entity';
import { ServiceInstance } from '../modules/service-requests/entities/service-instance.entity';
import { ServiceInstanceValue } from '../modules/service-requests/entities/service-instance-value.entity';
import { Service } from '../modules/services/entities/service.entity';

async function testDatabaseConnection() {
  console.log('🔍 Verificando conexión a la base de datos...');

  // Configuración de la base de datos (debe coincidir con el .env)
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'api_cuentas_db',
    entities: [
      ServiceRequest,
      SelectedService,
      ServiceInstance,
      ServiceInstanceValue,
      Service,
    ],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión exitosa a la base de datos');

    // Verificar si existen solicitudes de servicio
    const serviceRequestRepository = dataSource.getRepository(ServiceRequest);
    const count = await serviceRequestRepository.count();
    console.log(`📊 Total de solicitudes encontradas: ${count}`);

    if (count > 0) {
      // Obtener una solicitud con sus relaciones
      const firstRequest = await serviceRequestRepository.findOne({
        where: {},
        relations: ['selectedServices', 'selectedServices.service'],
        order: { id: 'DESC' },
      });

      if (firstRequest) {
        console.log(
          `🔍 Solicitud encontrada: ID ${firstRequest.id}, Solicitante: ${firstRequest.name}`,
        );
        console.log(
          `📋 Servicios seleccionados: ${firstRequest.selectedServices?.length || 0}`,
        );

        // Verificar instancias de servicios
        if (
          firstRequest.selectedServices &&
          firstRequest.selectedServices.length > 0
        ) {
          const selectedServiceRepository =
            dataSource.getRepository(SelectedService);
          const serviceWithInstances = await selectedServiceRepository.findOne({
            where: { id: firstRequest.selectedServices[0].id },
            relations: [
              'serviceInstances',
              'serviceInstances.serviceInstanceValues',
            ],
          });

          if (serviceWithInstances) {
            console.log(
              `🏷️  Instancias del primer servicio: ${serviceWithInstances.serviceInstances?.length || 0}`,
            );

            if (
              serviceWithInstances.serviceInstances &&
              serviceWithInstances.serviceInstances.length > 0
            ) {
              const firstInstance = serviceWithInstances.serviceInstances[0];
              console.log(
                `📝 Valores adicionales en primera instancia: ${firstInstance.serviceInstanceValues?.length || 0}`,
              );

              if (
                firstInstance.serviceInstanceValues &&
                firstInstance.serviceInstanceValues.length > 0
              ) {
                console.log(
                  '🎯 Datos encontrados - la estructura está lista para generar PDFs con formato horizontal',
                );
                firstInstance.serviceInstanceValues.forEach(value => {
                  console.log(`   - ${value.fieldName}: ${value.fieldValue}`);
                });
              }
            }
          }
        }
      }
    } else {
      console.log(
        '⚠️  No se encontraron solicitudes de servicio en la base de datos',
      );
    }

    await dataSource.destroy();
    console.log('✅ Prueba completada exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

testDatabaseConnection();
