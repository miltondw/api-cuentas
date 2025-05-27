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
    request_number: "SLAB-2025-067"
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

async function testBufferPDF() {
  console.log('🧪 Probando generación de PDF como buffer...');
  
  try {
    // Generar PDF como buffer
    const pdfBuffer = await generateServiceRequestPDF(
      testData.formData,
      testData.selectedServices,
      true // returnBuffer = true
    );
    
    console.log(`✅ PDF generado como buffer exitosamente`);
    console.log(`📊 Tamaño del buffer: ${pdfBuffer.length} bytes`);
    console.log(`🔍 Tipo: ${typeof pdfBuffer}`);
    console.log(`📦 Es Buffer: ${Buffer.isBuffer(pdfBuffer)}`);
    
    // Verificar que el buffer no esté vacío
    if (pdfBuffer.length === 0) {
      throw new Error('❌ El buffer está vacío');
    }
    
    // Verificar que empiece con el header de PDF (%PDF)
    const pdfHeader = pdfBuffer.slice(0, 4).toString();
    if (!pdfHeader.startsWith('%PDF')) {
      console.warn(`⚠️  Advertencia: El buffer no comienza con header PDF válido. Inicio: "${pdfHeader}"`);
    } else {
      console.log(`✅ Header PDF válido detectado: ${pdfHeader}`);
    }
    
    // Guardar el buffer como archivo para verificación manual
    const testOutputPath = path.join(__dirname, '..', '..', 'uploads', 'pdfs', 'test-buffer-output.pdf');
    await fs.writeFile(testOutputPath, pdfBuffer);
    console.log(`💾 Buffer guardado como archivo de prueba en: ${testOutputPath}`);
    console.log(`📖 Puedes abrir este archivo para verificar que no esté corrupto`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en la prueba de buffer:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando pruebas de PDF...\n');
  
  const bufferTest = await testBufferPDF();
  
  console.log('\n📋 Resumen de pruebas:');
  console.log(`  Buffer PDF: ${bufferTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (bufferTest) {
    console.log('\n🎉 Todas las pruebas pasaron. El sistema debería funcionar correctamente en producción.');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores antes de desplegar.');
  }
}

runAllTests().catch(console.error);
