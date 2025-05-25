import { generateServiceRequestPDF } from '../utils/pdfGenerator.js';

// Datos de prueba
const testData = {
  formData: {
    name: "Carlos Rodríguez",
    name_project: "Construcción Residencial Altos del Norte",
    location: "Ocaña, Norte de Santander",
    identification: "1092457823",
    phone: "3158762345",
    email: "carlos.rodriguez@example.com",
    description: "Proyecto de construcción de conjunto residencial con 3 torres de apartamentos de 5 pisos cada una. Requiere estudios de suelos, ensayos de materiales y diseño de mezclas.",
    status: "pendiente",
    id: "TEST-PDF", // ID único para el archivo de prueba
    request_number: "SLAB-TEST"
  },  selectedServices: [
    {
      item: {
        id: 1,
        code: "SR-1",
        name: "Servicio de Revisión",
        category: "Revisión"
      },
      quantity: 1,
      instances: [
        {
          instance_number: 1,
          additionalInfo: {
            tipoRevision: "Completa",
            fechaProgramada: "30-05-2025"
          }
        }
      ]
    },    {
      item: {
        id: 2,
        code: "EDS-1",
        name: "Estudio de Suelos - Edificación",
        category: "Estudio de Suelos"
      },
      quantity: 3,
      instances: [
        {
          instance_number: 1,
          additionalInfo: {
            areaPredio: "780",
            cantidadPisos: "5",
            ubicacion: "Rural",
            usoEdificacion: "Residencial",
            tipoEstructura: "Pórticos"
          }
        },
        {
          instance_number: 2,
          additionalInfo: {
            areaPredio: "650",
            cantidadPisos: "5",
            ubicacion: "Rural",
            usoEdificacion: "Residencial",
            tipoEstructura: "Pórticos"
          }
        },
        {
          instance_number: 3,
          additionalInfo: {
            areaPredio: "720",
            cantidadPisos: "5",
            ubicacion: "Rural",
            usoEdificacion: "Residencial",
            tipoEstructura: "Pórticos"
          }
        }
      ]
    },    {
      item: {
        id: 3,
        code: "EDS-2",
        name: "Estudio de Suelos - Alcantarillado",
        category: "Estudio de Suelos"
      },
      quantity: 2,
      instances: [
        {
          instance_number: 1,
          additionalInfo: {
            cantidadTramos: "8",
            intervencionAlcantarillado: "1",
            longitudTramos: "150",
            ubicacion: "Rural"
          }
        },
        {
          instance_number: 2,
          additionalInfo: {
            cantidadTramos: "6",
            intervencionAlcantarillado: "1",
            longitudTramos: "120",
            ubicacion: "Rural"
          }
        }
      ]
    },    {
      item: {
        id: 4,
        code: "EMC-1",
        name: "Ensayo de Materiales - Concreto",
        category: "Ensayo de Materiales"
      },
      quantity: 4,
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
        },
        {
          instance_number: 2,
          additionalInfo: {
            tipoMuestra: "Cilindro",
            elementoFundido: "Viga",
            resistenciaDiseno: "3500",
            identificacionMuestra: "V-001",
            estructuraRealizada: "Torre A",
            fechaFundida: "12-06-2025",
            edadEnsayo: "28",
            tamanoCilindro: "6 pulgadas"
          }
        },
        {
          instance_number: 3,
          additionalInfo: {
            tipoMuestra: "Cilindro",
            elementoFundido: "Losa",
            resistenciaDiseno: "3500",
            identificacionMuestra: "L-001",
            estructuraRealizada: "Torre A",
            fechaFundida: "15-06-2025",
            edadEnsayo: "28",
            tamanoCilindro: "6 pulgadas"
          }
        },
        {
          instance_number: 4,
          additionalInfo: {
            tipoMuestra: "Cilindro",
            elementoFundido: "Zapata",
            resistenciaDiseno: "3500",
            identificacionMuestra: "Z-001",
            estructuraRealizada: "Torre B",
            fechaFundida: "20-06-2025",
            edadEnsayo: "28",
            tamanoCilindro: "6 pulgadas"
          }
        }
      ]
    },    {
      item: {
        id: 5,
        code: "DMC-1",
        name: "Diseño de Mezcla de Concreto",
        category: "Diseño de Mezclas"
      },
      quantity: 2,
      instances: [
        {
          instance_number: 1,
          additionalInfo: {
            planta: "Planta Norte",
            resistenciaRequerida: "3500",
            tamanoTriturado: "3/4\"",
            tipoCemento: "Portland Tipo I"
          }
        },
        {
          instance_number: 2,
          additionalInfo: {
            planta: "Planta Sur",
            resistenciaRequerida: "4000",
            tamanoTriturado: "1/2\"",
            tipoCemento: "Portland Tipo II"
          }
        }
      ]
    }
  ]
};

// Generar el PDF usando los datos de prueba
async function runTest() {
  try {
    // 1. Probar generación de PDF y guardarlo en disco
    console.log('Modo 1: Generando PDF de prueba y guardándolo en disco...');
    const pdfPath = await generateServiceRequestPDF(testData.formData, testData.selectedServices, false);
    console.log(`PDF guardado exitosamente en: ${pdfPath}`);
    
    // 2. Probar generación de PDF como buffer (para entorno de producción)
    console.log('\nModo 2: Generando PDF como buffer (para producción)...');
    const pdfBuffer = await generateServiceRequestPDF(testData.formData, testData.selectedServices, true);
    console.log(`PDF generado como buffer. Tamaño: ${pdfBuffer.length} bytes`);
    console.log('Este buffer podría enviarse directamente como respuesta HTTP sin guardarlo en disco.');
    
    console.log('\n✅ Prueba completada exitosamente. Ambos modos funcionan correctamente.');
  } catch (error) {
    console.error('❌ Error al generar el PDF de prueba:', error);
  }
}

// Ejecutar la prueba
console.log('Iniciando prueba de generación de PDF...');
runTest().then(() => console.log('Prueba finalizada.'));
