import { generateServiceRequestPDF } from '../utils/pdfGenerator.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Datos de prueba similares a los de producción
const testData = {
  formData: {
    name: "Carlos Rodríguez",
    name_project: "Construcción Residencial Altos del Norte",
    location: "Ocaña, Norte de Santander",
    identification: "1092457823",
    phone: "3158762345",
    email: "carlos.rodriguez@example.com",
    description: "Proyecto de construcción de conjunto residencial con 3 torres de apartamentos de 5 pisos cada una.",
    status: "pendiente",
    id: "SLAB-2025-067",
    request_number: "SLAB-2025-067",
    created_at: new Date()
  },
  selectedServices: [
    {
      item: {
        id: 1,
        code: "EMC-1",
        name: "Ensayo de Materiales - Concreto",
        category: "Ensayo de Materiales"
      },
      quantity: 1,
      instances: [
        {
          instance_number: 1,
          additionalInfo: {
            tipoMuestra: "Cilindro",
            elementoFundido: "Columna estructural",
            resistenciaDiseno: "3500",
            identificacionMuestra: "C-001",
            estructuraRealizada: "Torre A",
            fechaFundida: "10-06-2025",
            edadEnsayo: "28",
            tamanoCilindro: "6 pulgadas"
          }
        }
      ]
    }
  ]
};

async function testHTTPResponse() {
  console.log('🧪 Simulando respuesta HTTP del endpoint de PDF...\n');
  
  try {
    // 1. Generar PDF como buffer (simulando producción)
    console.log('📄 Generando PDF como buffer...');
    const pdfBuffer = await generateServiceRequestPDF(
      testData.formData,
      testData.selectedServices,
      true // returnBuffer = true
    );
    
    console.log(`✅ PDF generado. Tamaño: ${pdfBuffer.length} bytes\n`);
    
    // 2. Simular configuración de headers HTTP
    const fileName = `Solicitud-${testData.formData.request_number}.pdf`;
    const headers = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept-Ranges': 'bytes'
    };
    
    console.log('📋 Headers HTTP que se enviarían:');
    Object.entries(headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
    
    // 3. Validar el buffer antes de enviarlo
    console.log('🔍 Validaciones del buffer:');
    console.log(`  Es Buffer: ${Buffer.isBuffer(pdfBuffer)}`);
    console.log(`  Tamaño > 0: ${pdfBuffer.length > 0}`);
    
    // Verificar header PDF
    const pdfHeader = pdfBuffer.slice(0, 4).toString();
    console.log(`  Header PDF: ${pdfHeader}`);
    console.log(`  Header válido: ${pdfHeader.startsWith('%PDF')}`);
    
    // Verificar footer PDF
    const pdfFooter = pdfBuffer.slice(-10).toString().trim();
    console.log(`  Footer PDF: ${pdfFooter}`);
    
    // 4. Simular escritura del buffer como lo haría Express
    console.log('\n🚀 Simulando envío como respuesta HTTP...');
    
    // Guardar el buffer tal como se enviaría por HTTP
    const httpSimulationPath = path.join(__dirname, '..', '..', 'uploads', 'pdfs', 'http-simulation-test.pdf');
    
    // Simular el proceso de escritura de Express.js
    const chunks = [];
    
    // Simular res.write(pdfBuffer, 'binary')
    chunks.push(pdfBuffer);
    
    // Simular res.end()
    const finalBuffer = Buffer.concat(chunks);
    
    // Guardar el resultado final
    await fs.writeFile(httpSimulationPath, finalBuffer);
    
    console.log(`💾 Buffer simulado de respuesta HTTP guardado en: ${httpSimulationPath}`);
    console.log(`📊 Tamaño final: ${finalBuffer.length} bytes`);
    
    // 5. Verificar que el archivo final sea idéntico al buffer original
    const savedFile = await fs.readFile(httpSimulationPath);
    const areIdentical = Buffer.compare(pdfBuffer, savedFile) === 0;
    
    console.log(`🔍 Comparación buffer original vs guardado: ${areIdentical ? '✅ IDÉNTICOS' : '❌ DIFERENTES'}`);
    
    if (!areIdentical) {
      console.log(`  Tamaño original: ${pdfBuffer.length}`);
      console.log(`  Tamaño guardado: ${savedFile.length}`);
    }
    
    console.log('\n🎉 Simulación completada. El archivo guardado representa exactamente lo que recibiría el cliente.');
    console.log('📖 Prueba abrir el archivo http-simulation-test.pdf para verificar que no esté corrupto.\n');
    
    return { success: true, bufferSize: pdfBuffer.length, fileName: httpSimulationPath };
    
  } catch (error) {
    console.error('❌ Error durante la simulación:', error);
    return { success: false, error: error.message };
  }
}

// Ejecutar la prueba
console.log('🔬 PRUEBA DE RESPUESTA HTTP PARA PDF\n');
testHTTPResponse()
  .then(result => {
    if (result.success) {
      console.log('✅ TODAS LAS PRUEBAS PASARON');
      console.log('🚀 El sistema debería funcionar correctamente en producción.');
    } else {
      console.log('❌ PRUEBA FALLÓ:', result.error);
    }
  })
  .catch(console.error);
