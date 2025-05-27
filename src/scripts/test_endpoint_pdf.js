import express from 'express';
import { generateServiceRequestPdf } from '../controllers/serviceRequests.controller.js';
import { getServiceRequestModel } from '../models/serviceRequests.model.js';

// Crear una aplicación Express de prueba
const app = express();
app.use(express.json());

// Mock de la función getServiceRequestModel para evitar base de datos
const mockServiceRequest = {
  success: true,
  request: {
    id: "SLAB-2025-067",
    request_number: "SLAB-2025-067",
    name: "Carlos Rodríguez",
    name_project: "Construcción Residencial Altos del Norte",
    location: "Ocaña, Norte de Santander",
    identification: "1092457823",
    phone: "3158762345",
    email: "carlos.rodriguez@example.com",
    description: "Proyecto de construcción de conjunto residencial con 3 torres de apartamentos de 5 pisos cada una.",
    status: "pendiente",
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

// Mock del modelo
const originalGetServiceRequestModel = getServiceRequestModel;

async function testEndpoint() {
  console.log('🧪 Probando endpoint de PDF directamente...\n');
  
  try {
    // Simular una solicitud HTTP
    const req = {
      params: { id: 'SLAB-2025-067' },
      query: { buffer: 'true' } // Forzar uso de buffer para simular producción
    };
    
    // Mock response object
    const responseData = [];
    let responseHeaders = {};
    let statusCode = 200;
    
    const res = {
      setHeader: (name, value) => {
        responseHeaders[name] = value;
        console.log(`📋 Header: ${name} = ${value}`);
      },
      write: (data, encoding) => {
        console.log(`✍️  Escribiendo ${data.length} bytes con encoding: ${encoding || 'default'}`);
        responseData.push(data);
      },
      end: () => {
        console.log('✅ Respuesta finalizada');
        const totalBytes = responseData.reduce((sum, chunk) => sum + chunk.length, 0);
        console.log(`📊 Total de bytes enviados: ${totalBytes}`);
        
        // Verificar que los headers sean correctos
        console.log('\n📋 Headers de respuesta:');
        Object.entries(responseHeaders).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        
        // Combinar todos los chunks en un solo buffer
        const completeBuffer = Buffer.concat(responseData);
        console.log(`\n🔍 Verificación del PDF buffer:`);
        console.log(`  Tamaño total: ${completeBuffer.length} bytes`);
        console.log(`  Es Buffer: ${Buffer.isBuffer(completeBuffer)}`);
        
        // Verificar header PDF
        const pdfHeader = completeBuffer.slice(0, 4).toString();
        if (pdfHeader.startsWith('%PDF')) {
          console.log(`  ✅ Header PDF válido: ${pdfHeader}`);
        } else {
          console.log(`  ❌ Header PDF inválido: ${pdfHeader}`);
        }
        
        return completeBuffer;
      },
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        console.log('📄 Respuesta JSON:', data);
        return res;
      }
    };
    
    // Mockear la función del modelo para evitar conectar a la base de datos
    const { getServiceRequestModel: originalModel } = await import('../models/serviceRequests.model.js');
    
    // Reemplazar temporalmente la función del modelo
    global.mockGetServiceRequestModel = () => Promise.resolve(mockServiceRequest);
    
    // Sobreescribir la función del modelo temporalmente
    const moduleUrl = '../models/serviceRequests.model.js';
    const originalModule = await import(moduleUrl);
    originalModule.getServiceRequestModel = global.mockGetServiceRequestModel;
    
    console.log('🔧 Ejecutando endpoint con datos mock...\n');
    
    // Ejecutar el endpoint
    await generateServiceRequestPdf(req, res);
    
    console.log('\n🎉 Prueba de endpoint completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la prueba del endpoint:', error);
    throw error;
  }
}

// Ejecutar la prueba
testEndpoint().catch(console.error);
