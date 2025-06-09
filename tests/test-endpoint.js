const http = require('http');

function makeRequest() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/service-requests?limit=1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('=== RESPUESTA DEL ENDPOINT ===');
        console.log('Status:', res.statusCode);
        
        if (response.data && response.data.length > 0) {
          const firstRequest = response.data[0];
          console.log(`\nSolicitud ID: ${firstRequest.id}`);
          console.log(`Servicios seleccionados: ${firstRequest.selectedServices.length}`);
          
          firstRequest.selectedServices.forEach((selectedService, index) => {
            console.log(`\n--- Servicio ${index + 1}: ${selectedService.service.name} ---`);
            
            // Verificar campos adicionales del servicio
            if (selectedService.service.additionalFields) {
              console.log(`Campos adicionales del servicio: ${selectedService.service.additionalFields.length}`);
              selectedService.service.additionalFields.forEach(field => {
                console.log(`  - ${field.fieldName} (${field.type})`);
              });
            } else {
              console.log('❌ additionalFields no presente');
            }
            
            // Verificar valores adicionales
            if (selectedService.additionalValues) {
              console.log(`Valores adicionales: ${selectedService.additionalValues.length}`);
              selectedService.additionalValues.forEach(value => {
                console.log(`  - ${value.fieldName}: ${value.fieldValue}`);
              });
            } else {
              console.log('❌ additionalValues no presente');
            }
            
            // Verificar instancias
            if (selectedService.serviceInstances) {
              console.log(`Instancias: ${selectedService.serviceInstances.length}`);
              selectedService.serviceInstances.forEach(instance => {
                console.log(`  - Instancia ${instance.instanceNumber}`);
                if (instance.serviceInstanceValues) {
                  instance.serviceInstanceValues.forEach(value => {
                    console.log(`    - ${value.fieldName}: ${value.fieldValue}`);
                  });
                }
              });
            } else {
              console.log('❌ serviceInstances no presente');
            }
          });
        } else {
          console.log('No se encontraron datos');
        }
        
      } catch (error) {
        console.error('Error parsing response:', error);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error making request:', error);
  });

  req.end();
}

makeRequest();
