import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera un PDF para una solicitud de servicio con el formato GM-F11 de INGEOCIMYC
 * @param {Object} serviceRequest - Objeto con datos de la solicitud
 * @param {Array} selectedServices - Array de servicios seleccionados
 * @returns {Promise<String>} - Ruta del archivo PDF generado
 */
export const generateServiceRequestPDF = async (serviceRequest, selectedServices) => {
  try {
    if (!serviceRequest) {
      throw new Error('Datos de solicitud no proporcionados');
    }
    
    // Configurar directorio para PDFs
    const pdfDir = path.join(__dirname, '..', '..', 'uploads', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    
    const pdfPath = path.join(pdfDir, `solicitud-${serviceRequest.id}.pdf`);
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    
    // Pipe output to file
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // Añadir logo
    const logoPath = path.join(__dirname, '..', '..', 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 150 });
    } else {
      console.warn('Logo no encontrado:', logoPath);
    }
    
    // Título del formulario
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('#0a95a5')
       .text('SOLICITUD DE SERVICIOS DE LABORATORIO', 50, 50, { align: 'center' })
       .moveDown(0.5);
    
    doc.fontSize(10)
       .text(`Código: GM-F11`, { align: 'right' })
       .text(`Versión: 01`, { align: 'right' })
       .moveDown(0.5);
    
    // Información de la solicitud
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#00a2a5')
       .text('INFORMACIÓN DE LA SOLICITUD')
       .moveDown(0.3);
    
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#000000');
    
    // Si tiene número de solicitud
    if (serviceRequest.request_number) {
      doc.text(`Número de solicitud: ${serviceRequest.request_number}`);
    }
    
    doc.text(`Fecha: ${new Date(serviceRequest.created_at).toLocaleDateString('es-CO')}`)
       .moveDown(0.5);
    
    // Datos de contacto
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#00a2a5')
       .text('DATOS DE CONTACTO')
       .moveDown(0.3);
    
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#000000');
    
    doc.text(`Solicitante: ${serviceRequest.name}`);
    doc.text(`Identificación: ${serviceRequest.identification}`);
    doc.text(`Teléfono: ${serviceRequest.phone}`);
    doc.text(`Correo electrónico: ${serviceRequest.email}`);
    doc.moveDown(0.5);
    
    // Información del proyecto
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#00a2a5')
       .text('INFORMACIÓN DEL PROYECTO')
       .moveDown(0.3);
    
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#000000');
    
    doc.text(`Proyecto: ${serviceRequest.name_project}`);
    doc.text(`Ubicación: ${serviceRequest.location}`);
    doc.text(`Descripción: ${serviceRequest.description}`);
    doc.moveDown(0.5);
    
    // Tabla de servicios
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#00a2a5')
       .text('ENSAYOS A REALIZAR')
       .moveDown(0.5);
    
    // Cabecera de la tabla
    const tableTop = doc.y;
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor('#ffffff');
    
    doc.rect(50, tableTop, 490, 20).fill('#0a95a5');
    doc.text('Código', 55, tableTop + 6);
    doc.text('Servicio', 120, tableTop + 6);
    doc.text('Cantidad', 300, tableTop + 6);
    doc.text('Información adicional', 370, tableTop + 6);
    
    // Contenido de la tabla
    let y = tableTop + 30;
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#000000');
    
    if (selectedServices && selectedServices.length > 0) {
      for (const service of selectedServices) {
        // Verificar si necesitamos una nueva página
        if (y > 700) {
          doc.addPage();
          y = 50;
          
          // Volver a dibujar encabezado de tabla en nueva página
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .fillColor('#ffffff');
          
          doc.rect(50, y, 490, 20).fill('#0a95a5');
          doc.text('Código', 55, y + 6);
          doc.text('Servicio', 120, y + 6);
          doc.text('Cantidad', 300, y + 6);
          doc.text('Información adicional', 370, y + 6);
          
          y += 30;
          doc.font('Helvetica')
             .fontSize(9)
             .fillColor('#000000');
        }
        
        // Aplicar efecto zebra (alternancia de colores)
        if ((selectedServices.indexOf(service) % 2) === 0) {
          doc.rect(50, y - 5, 490, 20).fill('#f5f5f5').stroke('#f5f5f5');
          doc.fillColor('#000000');
        }
        
        doc.text(service.item?.code || 'N/A', 55, y);
        
        // Servicio (nombre) con wrapping
        const serviceNameWidth = 170;
        const serviceText = doc.heightOfString(service.item?.name || 'N/A', { width: serviceNameWidth });
        doc.text(service.item?.name || 'N/A', 120, y, { width: serviceNameWidth });
        
        doc.text(service.quantity?.toString() || '1', 300, y);
        
        // Info adicional
        let additionalInfoText = '';
        if (service.additionalInfo) {
          for (const [key, value] of Object.entries(service.additionalInfo)) {
            additionalInfoText += `${key}: ${value}\n`;
          }
        }
        
        const infoHeight = doc.heightOfString(additionalInfoText, { width: 165 });
        doc.text(additionalInfoText, 370, y, { width: 165 });
        
        // Calcular la altura máxima para determinar la siguiente posición Y
        const rowHeight = Math.max(serviceText, infoHeight, 20);
        y += rowHeight + 10;
      }
    } else {
      doc.text('No hay ensayos seleccionados', 55, y);
      y += 20;
    }
    
    // Líneas de firma
    y = Math.max(y + 50, 650);
    
    doc.moveTo(70, y).lineTo(220, y).stroke();
    doc.moveTo(320, y).lineTo(470, y).stroke();
    
    doc.fontSize(9).text('Firma del solicitante', 70, y + 5, { width: 150, align: 'center' });
    doc.text('Firma INGEOCIMYC', 320, y + 5, { width: 150, align: 'center' });
    
    // Pie de página
    doc.fontSize(8)
       .fillColor('#666666')
       .text(
         'INGEOCIMYC SAS | NIT: 900.270.443-0 | www.ingeocimyc.com',
         50,
         780,
         { align: 'center' }
       );
    
    // Finalizar documento
    doc.end();
    
    // Esperar a que el stream termine
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};
