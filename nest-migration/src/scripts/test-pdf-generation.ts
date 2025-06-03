import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PDFService } from '../modules/pdf/pdf.service';
import { ServiceRequestsService } from '../modules/service-requests/service-requests.service';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function testPDFGeneration() {
  console.log('🚀 Iniciando prueba de generación de PDF...');

  try {
    // Crear la aplicación NestJS
    const app = await NestFactory.createApplicationContext(AppModule);
    const pdfService = app.get(PDFService);
    const serviceRequestsService = app.get(ServiceRequestsService);
    const dataSource = app.get(DataSource);

    console.log('✅ Aplicación NestJS inicializada');

    // Verificar conexión a la base de datos
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    console.log('✅ Conexión a base de datos establecida');

    // Obtener todas las solicitudes de servicio
    const requests = await serviceRequestsService.findAll();
    console.log(`📋 Found ${requests.length} service requests`);

    if (requests.length === 0) {
      console.log('⚠️  No hay solicitudes de servicio disponibles para probar');
      await app.close();
      return;
    }

    // Probar con la primera solicitud
    const firstRequest = requests[0];
    console.log(
      `🧪 Probando generación de PDF para solicitud ID: ${firstRequest.id}`,
    );

    // Generar PDF
    const pdfBuffer = await pdfService.generateServiceRequestPDF(
      firstRequest.id,
      {
        returnBuffer: true,
        format: 'A4',
        orientation: 'portrait',
        includeHeader: true,
        includeFooter: true,
      },
    );

    // Guardar el PDF para inspección manual
    const filename = `test-pdf-${firstRequest.id}-${Date.now()}.pdf`;
    const filepath = path.join(process.cwd(), 'uploads', 'pdfs', filename);

    // Asegurar que el directorio existe
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, pdfBuffer);
    console.log(`💾 PDF guardado en: ${filepath}`);

    await app.close();
    console.log('🎉 Prueba completada exitosamente!');
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Ejecutar la prueba
testPDFGeneration();
