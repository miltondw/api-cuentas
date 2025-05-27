// filepath: d:\Users\HOGAR\Documents\Ingeocimyc\informes-ingeo\software\api-cuentas\src\utils\pdfGenerator.js
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  formatFieldName,
  formatValue,
  generateServicesContent,
} from "./formatUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera un PDF de solicitud de servicio.
 * @param {object} serviceRequest - Datos de la solicitud (solicitante, proyecto, etc.).
 * @param {Array<object>} selectedServices - Array de servicios seleccionados, cada uno con sus instancias.
 * @param {boolean} returnBuffer - Si es true, devuelve el PDF como un buffer en lugar de guardarlo en disco.
 * @returns {Promise<string|Buffer>} La ruta al archivo PDF generado o el buffer del PDF.
 */
export const generateServiceRequestPDF = async (
  serviceRequest,
  selectedServices,
  returnBuffer = false
) => {
  try {
    if (!serviceRequest || !selectedServices) {
      throw new Error("Datos de solicitud o servicios no proporcionados.");
    }

    // --- 1. Cargar la plantilla HTML ---
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "serviceRequest.html"
    );
    let template = await fs.readFile(templatePath, "utf8");

    // --- 2. Cargar el logo SVG y convertirlo a Base64 ---
    const logoPath = path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "logo_text.svg"
    );
    const phone = path.join(__dirname, "..", "..", "assets", "phone.svg");
    const location = path.join(__dirname, "..", "..", "assets", "location.svg");
    const internet = path.join(__dirname, "..", "..", "assets", "internet.svg");
    let logoBase64 = "";
    let phoneBase64 = "";
    let locationBase64 = "";
    let internetBase64 = "";
    try {
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString("base64")}`;

      const phoneBuffer = await fs.readFile(phone);
      phoneBase64 = `data:image/svg+xml;base64,${phoneBuffer.toString(
        "base64"
      )}`;

      const locationBuffer = await fs.readFile(location);
      locationBase64 = `data:image/svg+xml;base64,${locationBuffer.toString(
        "base64"
      )}`;

      const internetBuffer = await fs.readFile(internet);
      internetBase64 = `data:image/svg+xml;base64,${internetBuffer.toString(
        "base64"
      )}`;
    } catch (e) {
      console.error(
        "Error al cargar el logo:",
        e.message,
        "\nRuta intentada:",
        logoPath
      );
    }

    // --- 3. Reemplazar variables básicas en la plantilla ---
    template = template
      .replace(/{{logo}}/g, logoBase64)
      .replace(/{{date}}/g, new Date().toLocaleDateString("es-CO"))
      .replace(/{{solicitante}}/g, formatValue(serviceRequest.name))
      .replace(
        /{{identificacion}}/g,
        formatValue(serviceRequest.identification)
      )
      .replace(
        /{{fechaSolicitud}}/g,
        serviceRequest.created_at
          ? new Date(serviceRequest.created_at).toLocaleDateString("es-CO")
          : formatValue(null)
      )
      .replace(/{{celular}}/g, formatValue(serviceRequest.phone))
      .replace(/{{email}}/g, formatValue(serviceRequest.email))
      .replace(/{{proyecto}}/g, formatValue(serviceRequest.name_project))
      .replace(/{{ubicacion}}/g, formatValue(serviceRequest.location))
      .replace(/{{descripcion}}/g, formatValue(serviceRequest.description));

    // --- 4. Generar el contenido de servicios utilizando la función utility ---
    const serviciosContent = generateServicesContent(selectedServices);
    template = template.replace("{{serviciosContent}}", serviciosContent);    // --- 5. Generar el PDF usando Puppeteer ---
    let pdfPath = null;
    
    // Solo crear directorio y archivo si no estamos devolviendo un buffer
    if (!returnBuffer) {
      const pdfDir = path.join(__dirname, "..", "..", "uploads", "pdfs");
      await fs.mkdir(pdfDir, { recursive: true });
      pdfPath = path.join(
        pdfDir,
        `solicitud-${serviceRequest.request_number || serviceRequest.id}.pdf`
      );
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(template, { waitUntil: "networkidle0" });

    // Definir las plantillas de encabezado y pie de página
    /*    const headerHTML = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; width: 100%; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #008D97; box-sizing: border-box; margin-bottom: 15px;">
        <div style="flex: 0 0 40%; display: flex; align-items: center;">
          <img src="${logoBase64}" alt="INGEOCIMYC Logo" style="max-width: 30px; height: auto; object-fit: contain;">
        </div>
        <div style="flex: 0 0 60%; text-align: right; padding-right: 15px;">
          <div style="color: #008D97; font-weight: bold; font-size: 14px; text-transform: uppercase;">Solicitud de Servicios</div>
          <div style="font-size: 10px; font-weight: 600; margin-top: 3px;">Laboratorio de Geotecnia y Concretos</div>
          <div style="font-size: 8px; color: #7f8c8d; margin-top: 5px;">
            <span>GM-F11</span> | <span>VERSIÓN 1.0</span> | <span>Fecha: ${new Date().toLocaleDateString(
              "es-CO"
            )}</span>
          </div>
        </div>
      </div>
    `; */
    const headerHTML = `    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; width: 100%; display: flex; padding: 0; margin: 0; box-sizing: border-box; border-bottom: 3px solid #008D97; margin-bottom: 15px;">
       
        <div style="flex: 0 0 10%; background-color: #ffffff; padding: 10px 15px; display: flex; align-items: center;">
          <img src="${logoBase64}" alt="INGEOCIMYC Logo" style="max-width: 250px; height: auto; object-fit: contain;">
        </div>
        <div style="background-color: #008380; padding: 8px 15px; display: flex; width: 100%; place-items: center;">
          <div style="text-align: center; color: #000000; width: 100%;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">SOLICITUD DE SERVICIOS DE ENSAYO DE CONCRETOS EN LABORATORIO</div>
            <div style="font-size: 12px; margin-bottom: 3px;">LABORATORIO DE GEOTECNIA Y CONCRETOS</div>
            <div style="display: flex; justify-content: space-evenly; font-size: 10px; margin-top: 5px;">
              <div style="width: 120px; text-align: center;">GM-F11</div>
              <div style="width: 120px; text-align: center;">VERSIÓN 1.0</div>
              <div style="width: 120px; text-align: center;"> ${new Date().toLocaleDateString(
                "es-CO"
              )}</div>
            </div>
          </div>
        </div>
      </div>`;

    const footerHTML = `
<div style="width: 100%; font-family: sans-serif; font-size: 14px; color: #333; box-sizing: border-box;">
    
    <div style="display: flex; justify-content: space-around; align-items: center; padding: 10px 40px; border-bottom: 1px solid #eeeeee;">
        
        <div style="display: flex; align-items: center;">
            <img src="${phoneBase64}" style="width: 24px; height: 24px; margin-right: 8px;">
            <span>301-351-7044</span>
        </div>

        <div style="display: flex; align-items: center;">
            <img src="${internetBase64}" style="width: 24px; height: 24px; margin-right: 8px;">
            <div style="display: flex; flex-direction: column;">
                <span>coordinador@ingeocimyc.com.co</span>
                <span>www.ingeocimyc.com.co</span>
            </div>
        </div>

        <div style="display: flex; align-items: center;">
            <img src="${locationBase64}" style="width: 24px; height: 24px; margin-right: 8px;">
            <div style="display: flex; flex-direction: column;">
                <span>Calle 2 No 10a - 117 Barrio Juan XXIII</span>
                <span>Ocaña, Norte de Santander</span>
            </div>
        </div>
    </div>

    <div style="width: 100%; height: 40px; margin-top: 5px; line-height: 0;">
      <svg width="100%" height="40" viewBox="0 0 1000 12" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0 6 L 980 6 L 1000 12 L 0 12 Z" fill="#2b2b2b" />
        <path d="M 0 0 L 970 0 L 990 6 L 0 6 Z" fill="#1EE4C3" />
      </svg>
    </div>

</div>
`;    const pdfOptions = {
      format: "A4",
      margin: {
        top: "50mm", // Margen superior amplio para el encabezado
        right: "4mm",
        bottom: "25mm",
        left: "4mm",
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerHTML,
      footerTemplate: footerHTML,
    };
    
    // Si se solicita un buffer, no establecemos path
    if (!returnBuffer) {
      pdfOptions.path = pdfPath;
    }
    
    const pdfResult = await page.pdf(pdfOptions);

    await browser.close();    if (returnBuffer) {
      console.log(`PDF generado exitosamente como buffer. Tamaño: ${pdfResult.length} bytes`);
      
      // Verificar que el resultado sea válido (puede ser Buffer o Uint8Array)
      if (!pdfResult || pdfResult.length === 0) {
        throw new Error('Error: El PDF generado está vacío o es nulo');
      }
      
      // Convertir a Buffer si es necesario
      const buffer = Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult);
      
      console.log(`Buffer final - Tamaño: ${buffer.length} bytes, Tipo: ${buffer.constructor.name}`);
      
      return buffer; // Devuelve el buffer del PDF
    } else {
      console.log(`PDF generado exitosamente en: ${pdfPath}`);
      return pdfPath; // Devuelve la ruta del archivo
    }
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    throw error;
  }
};
