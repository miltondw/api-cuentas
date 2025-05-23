import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { formatFieldName, formatValue, generateServicesContent } from "../utils/formatUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename)); // Navigate to src folder

/**
 * Datos de muestra para las vistas previas
 */
const sampleData = {
  name: "Milton Díaz",
  name_project: "Alcantarillado en Olaya Herrera",
  location: "Ocaña Norte de Santander",
  identification: "28398836",
  phone: "3002321421",
  email: "email@gmail.com",
  description: "Aquí estaría una descripción del proyecto si fuera un proyecto real",
  created_at: new Date(),
  request_number: "SLAB-2025-001",
  selectedServices: [
    {
      item: {
        code: "SR-1",
        name: "Contenido de humedad en suelos, rocas y mezclas"
      },
      quantity: 1,
      additionalInfo: {}
    },
    {
      item: {
        code: "EDS-1",
        name: "Estudios para edificaciones"
      },
      quantity: 2,
      additionalInfo: {
        areaPredio: 100,
        cantidadPisos: 21,
        ubicacion: "Rural"
      }
    },
    {
      item: {
        code: "EDS-2",
        name: "Estudios para vías"
      },
      quantity: 1,
      additionalInfo: {
        cantidadTramos: 12,
        intervencionAlcantarillado: true,
        longitudTramos: 21,
        ubicacion: "Rural"
      }
    },
    {
      item: {
        code: "EMC-1",
        name: "Ensayo de muestras de concreto"
      },
      quantity: 2,
      additionalInfo: {
        tipoMuestra: "Cilindro",
        elementoFundido: "Columna estructural",
        resistenciaDiseno: "3000",
        identificacionMuestra: "300",
        estructuraRealizada: "Edificio principal",
        fechaFundida: "21-05-2025",
        edadEnsayo: "28",
        tamanoCilindro: "6 pulgadas",
        resistenciaCompresion: 12
      }
    }
  ]
};

/**
 * Renderiza la vista previa básica del template
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const previewTemplate = async (req, res) => {
  try {
    // Leer la plantilla HTML
    const templatePath = path.join(__dirname, 'templates', 'serviceRequest.html');
    let template = await fs.readFile(templatePath, 'utf-8');

    // Preparar el logo
    const logoPath = path.join(__dirname, '..', 'assets', 'logo_text.png');
    const logoBase64 = (await fs.access(logoPath).then(() => true).catch(() => false)) 
      ? `data:image/png;base64,${(await fs.readFile(logoPath)).toString('base64')}`
      : '';

    // Obtener datos de la solicitud (usar datos de muestra o los proporcionados)
    const data = { ...sampleData };
    
    // Reemplazar variables básicas en la plantilla
    template = template
      .replace(/{{logo}}/g, logoBase64)
      .replace(/{{date}}/g, new Date().toLocaleDateString("es-CO"))
      .replace(/{{solicitante}}/g, formatValue(data.name))
      .replace(/{{identificacion}}/g, formatValue(data.identification))
      .replace(/{{fechaSolicitud}}/g, new Date(data.created_at).toLocaleDateString("es-CO"))
      .replace(/{{celular}}/g, formatValue(data.phone))
      .replace(/{{email}}/g, formatValue(data.email))
      .replace(/{{proyecto}}/g, formatValue(data.name_project))
      .replace(/{{ubicacion}}/g, formatValue(data.location))
      .replace(/{{descripcion}}/g, formatValue(data.description));

    // Generar el contenido de servicios
    const serviciosContent = generateServicesContent(data.selectedServices);
    template = template.replace("{{serviciosContent}}", serviciosContent);

    res.send(template);
  } catch (error) {
    console.error('Error en la vista previa:', error);
    res.status(500).send(`Error generando la vista previa: ${error.message}`);
  }
};

/**
 * Renderiza la vista previa del template con opciones para editar
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const previewWithForm = async (req, res) => {
  try {
    // Leer la plantilla HTML
    const templatePath = path.join(__dirname, 'templates', 'serviceRequest.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    
    // Preparar el logo
    const logoPath = path.join(__dirname, '..', 'assets', 'logo_text.png');
    const logoBase64 = (await fs.access(logoPath).then(() => true).catch(() => false)) 
      ? `data:image/png;base64,${(await fs.readFile(logoPath)).toString('base64')}`
      : '';
    
    // Obtener datos del query, o usar datos de muestra como fallback
    const data = { 
      ...sampleData,
      name: req.query.name || sampleData.name,
      name_project: req.query.name_project || sampleData.name_project,
      location: req.query.location || sampleData.location,
      identification: req.query.identification || sampleData.identification,
      phone: req.query.phone || sampleData.phone,
      email: req.query.email || sampleData.email,
      description: req.query.description || sampleData.description,
      created_at: req.query.created_at ? new Date(req.query.created_at) : sampleData.created_at,
      request_number: req.query.request_number || sampleData.request_number
    };
    
    // Reemplazar variables básicas en la plantilla
    template = template
      .replace(/{{logo}}/g, logoBase64)
      .replace(/{{date}}/g, new Date().toLocaleDateString("es-CO"))
      .replace(/{{solicitante}}/g, formatValue(data.name))
      .replace(/{{identificacion}}/g, formatValue(data.identification))
      .replace(/{{fechaSolicitud}}/g, new Date(data.created_at).toLocaleDateString("es-CO"))
      .replace(/{{celular}}/g, formatValue(data.phone))
      .replace(/{{email}}/g, formatValue(data.email))
      .replace(/{{proyecto}}/g, formatValue(data.name_project))
      .replace(/{{ubicacion}}/g, formatValue(data.location))
      .replace(/{{descripcion}}/g, formatValue(data.description));

    // Generar el contenido de servicios
    const serviciosContent = generateServicesContent(data.selectedServices);
    template = template.replace("{{serviciosContent}}", serviciosContent);

    res.send(template);
  } catch (error) {
    console.error('Error en la vista previa con formulario:', error);
    res.status(500).send(`Error generando la vista previa con formulario: ${error.message}`);
  }
};

/**
 * Sirve el formulario interactivo para editar la vista previa
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const servePreviewForm = async (req, res) => {
  try {
    const formPath = path.join(__dirname, 'templates', 'previewForm.html');
    const formHtml = await fs.readFile(formPath, 'utf-8');
    res.send(formHtml);
  } catch (error) {
    console.error('Error al servir el formulario de vista previa:', error);
    res.status(500).send(`Error al cargar el formulario: ${error.message}`);
  }
};
