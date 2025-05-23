// filepath: d:\Users\HOGAR\Documents\Ingeocimyc\informes-ingeo\software\api-cuentas\src\utils\pdfGenerator.js
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { formatFieldName, formatValue, generateServicesContent } from "./formatUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera un PDF de solicitud de servicio.
 * @param {object} serviceRequest - Datos de la solicitud (solicitante, proyecto, etc.).
 * @param {Array<object>} selectedServices - Array de servicios seleccionados, cada uno con sus instancias.
 * @returns {Promise<string>} La ruta al archivo PDF generado.
 */
export const generateServiceRequestPDF = async (
  serviceRequest,
  selectedServices
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
    
    // --- 2. Cargar el logo y convertirlo a Base64 ---
    const logoPath = path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "logo_text.png"
    ); // Logo en la carpeta assets de la raíz
    let logoBase64 = "";
    try {
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      console.log("Logo cargado exitosamente");
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
    template = template.replace("{{serviciosContent}}", serviciosContent);

    // --- 5. Generar el PDF usando Puppeteer ---
    const pdfDir = path.join(__dirname, "..", "..", "uploads", "pdfs");
    await fs.mkdir(pdfDir, { recursive: true });
    const pdfPath = path.join(
      pdfDir,
      `solicitud-${serviceRequest.request_number || serviceRequest.id}.pdf`
    );

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    
    const page = await browser.newPage();
    await page.setContent(template, { waitUntil: "networkidle0" });
    
    // Definir las plantillas de encabezado y pie de página
    const headerHTML = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; width: 100%; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #008D97; box-sizing: border-box; margin-bottom: 15px;">
        <div style="flex: 0 0 40%; display: flex; align-items: center;">
          <img src="${logoBase64}" alt="INGEOCIMYC Logo" style="max-width: 180px; height: auto;">
        </div>
        <div style="flex: 0 0 60%; text-align: right; padding-right: 15px;">
          <div style="color: #008D97; font-weight: bold; font-size: 14px; text-transform: uppercase;">Solicitud de Servicios</div>
          <div style="font-size: 10px; font-weight: 600; margin-top: 3px;">Laboratorio de Geotecnia y Concretos</div>
          <div style="font-size: 8px; color: #7f8c8d; margin-top: 5px;">
            <span>GM-F11</span> | <span>VERSIÓN 1.0</span> | <span>Fecha: ${new Date().toLocaleDateString("es-CO")}</span>
          </div>
        </div>
      </div>
    `;
    
    const footerHTML = `
      <div style="width: 100%; font-size: 8px; padding: 5px 15px; background: #008D97; color: white; text-align: center;">
        <div style="margin-bottom: 2px;">
          301-351-7044 | coordinador@ingeocimyc.com.co | www.ingeocimyc.com.co
        </div>
        <div>
          Calle 2 No 10a-117 Barrio Juan XXIII, Ocaña, Norte de Santander
        </div>
      </div>
    `;
    
    await page.pdf({
      path: pdfPath,
      format: "A4",
      margin: {
        top: "50mm",       // Margen superior amplio para el encabezado
        right: "15mm",
        bottom: "25mm",
        left: "15mm",
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerHTML,
      footerTemplate: footerHTML
    });

    await browser.close();

    console.log(`PDF generado exitosamente en: ${pdfPath}`);
    return pdfPath;
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    throw error;
  }
};
