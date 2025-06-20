import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ServiceRequest } from '../client/service-requests/entities/service-request.entity';
import { SelectedService } from '../client/service-requests/entities/selected-service.entity';
import { ServiceInstance } from '../client/service-requests/entities/service-instance.entity';
import { ServiceInstanceValue } from '../client/service-requests/entities/service-instance-value.entity';
import { generateHorizontalInstancesContent } from './utils/format-utils';

export interface PDFGenerationOptions {
  returnBuffer?: boolean;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeFooter?: boolean;
}

export interface ServiceRequestPDFData {
  request: ServiceRequest;
  services: SelectedService[];
}

@Injectable()
export class PDFService {
  private readonly templatesPath: string;
  private readonly assetsPath: string;
  private readonly uploadsPath: string;
  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(SelectedService)
    private selectedServiceRepository: Repository<SelectedService>,
    @InjectRepository(ServiceInstance)
    private serviceInstanceRepository: Repository<ServiceInstance>,
    @InjectRepository(ServiceInstanceValue)
    private serviceInstanceValueRepository: Repository<ServiceInstanceValue>,
  ) {
    // Initialize paths
    this.templatesPath = path.join(process.cwd(), 'src', 'templates');
    this.assetsPath = path.join(process.cwd(), 'assets');
    this.uploadsPath = path.join(process.cwd(), 'uploads', 'pdfs');
  }

  async generateServiceRequestPDF(
    requestId: number,
    options: PDFGenerationOptions = {},
  ): Promise<Buffer | string> {
    try {
      // Set default options
      const defaultOptions: PDFGenerationOptions = {
        returnBuffer: process.env.NODE_ENV === 'production',
        format: 'A4',
        orientation: 'portrait',
        includeHeader: true,
        includeFooter: true,
        ...options,
      };

      // Get service request data
      const serviceRequestData = await this.getServiceRequestData(requestId);

      // Generate HTML content
      const htmlContent = await this.generateHTMLContent(serviceRequestData);

      // Generate PDF
      return await this.generatePDFFromHTML(
        htmlContent,
        serviceRequestData.request,
        defaultOptions,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate PDF: ${error.message}`,
      );
    }
  }
  private async getServiceRequestData(
    requestId: number,
  ): Promise<ServiceRequestPDFData> {
    // Get service request
    const request = await this.serviceRequestRepository.findOne({
      where: { id: requestId },
      relations: [
        'selectedServices',
        'selectedServices.service',
        'selectedServices.service.category',
      ],
    });

    if (!request) {
      throw new BadRequestException(
        `Service request with ID ${requestId} not found`,
      );
    }

    // Get associated services with all needed relations
    const services = await this.selectedServiceRepository.find({
      where: { requestId: requestId },
      relations: [
        'service',
        'service.category',
        'service.additionalFields',
        'serviceInstances',
        'serviceInstances.serviceInstanceValues',
        'additionalValues',
      ],
      order: { id: 'ASC' },
    });

    return { request, services };
  }

  private async generateHTMLContent(
    data: ServiceRequestPDFData,
  ): Promise<string> {
    try {
      // Load HTML template
      const templatePath = path.join(
        this.templatesPath,
        'service-request.html',
      );
      let template = await fs.readFile(templatePath, 'utf8');

      // Load and encode assets
      const assets = await this.loadAssets();

      // Replace variables in template
      template = this.replaceTemplateVariables(template, data, assets);

      return template;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate HTML content: ${error.message}`,
      );
    }
  }

  private async loadAssets(): Promise<Record<string, string>> {
    const assetFiles = {
      logo: 'logo_text.svg',
      phone: 'phone.svg',
      location: 'location.svg',
      internet: 'internet.svg',
    };

    const assets: Record<string, string> = {};

    for (const [key, filename] of Object.entries(assetFiles)) {
      try {
        const filePath = path.join(this.assetsPath, filename);
        const buffer = await fs.readFile(filePath);
        assets[key] = `data:image/svg+xml;base64,${buffer.toString('base64')}`;
      } catch (error) {
        console.warn(
          `Warning: Could not load asset ${filename}:`,
          error.message,
        );
        assets[key] = '';
      }
    }

    return assets;
  }

  private replaceTemplateVariables(
    template: string,
    data: ServiceRequestPDFData,
    assets: Record<string, string>,
  ): string {
    const { request, services } = data;

    // Replace asset placeholders
    Object.entries(assets).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(placeholder, value);
    }); // Replace basic information
    const replacements = {
      '{{requestNumber}}': request.id.toString() || '',
      '{{date}}': new Date().toLocaleDateString('es-CO'),
      '{{solicitante}}': request.name || '',
      '{{identificacion}}': request.identification || '',
      '{{fechaSolicitud}}': request.created_at
        ? new Date(request.created_at).toLocaleDateString('es-CO')
        : '',
      '{{celular}}': request.phone || '',
      '{{email}}': request.email || '',
      '{{proyecto}}': request.nameProject || '',
      '{{ubicacion}}': request.location || '',
      '{{descripcion}}': request.description || '',
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      template = template.replace(regex, this.formatValue(value));
    });

    // Generate services content
    const servicesContent = this.generateServicesContent(services);
    template = template.replace('{{serviciosContent}}', servicesContent);

    return template;
  }
  private generateServicesContent(services: SelectedService[]): string {
    if (!services || services.length === 0) {
      return '<p>No hay servicios seleccionados</p>';
    }

    let content = `
      <div class="section-title no-break" style="background-color: #008d97; color: white; padding: 12px 20px; margin: 20px 0 15px 0; font-size: 14pt; font-weight: bold; text-align: center; border-radius: 5px; page-break-inside: avoid; page-break-after: avoid;">
        SERVICIOS SOLICITADOS
      </div>
    `;

    // Separar servicios con y sin información adicional
    const servicesWithoutAdditional: SelectedService[] = [];
    const servicesWithAdditional: SelectedService[] = [];

    services.forEach(selectedService => {
      const hasAdditionalInfo =
        selectedService.additionalValues &&
        selectedService.additionalValues.length > 0;

      if (hasAdditionalInfo) {
        servicesWithAdditional.push(selectedService);
      } else {
        servicesWithoutAdditional.push(selectedService);
      }
    });

    // Tabla principal para servicios sin información adicional
    if (servicesWithoutAdditional.length > 0) {
      content += `
        <div class="no-break" style="page-break-inside: avoid;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 9pt; page-break-inside: avoid;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ccc; padding: 10px; text-align: center; font-weight: bold; width: 15%;">CÓDIGO</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: center; font-weight: bold; width: 45%;">ENSAYO</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: center; font-weight: bold; width: 10%;">CANT</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: center; font-weight: bold; width: 30%;">CATEGORÍA</th>
              </tr>
            </thead>
            <tbody>
      `;

      servicesWithoutAdditional.forEach((selectedService, index) => {
        const { service, quantity } = selectedService;
        const rowStyle =
          index % 2 === 0
            ? 'background-color: #ffffff;'
            : 'background-color: #f9f9f9;';

        content += `
          <tr style="${rowStyle}">
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">${service?.code || 'N/A'}</td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: left;">${service?.name || 'N/A'}</td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${quantity || 1}</td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${service?.category?.name || 'N/A'}</td>
          </tr>
        `;
      });

      content += `
            </tbody>
          </table>
        </div>
      `;
    }

    // Tablas adicionales para servicios con información adicional
    servicesWithAdditional.forEach((selectedService, index) => {
      const { service, quantity, additionalValues } = selectedService;

      // Agregar salto de página antes de cada servicio (excepto el primero)
      if (index > 0 || servicesWithoutAdditional.length > 0) {
        content += `<div class="page-break" style="page-break-before: always;"></div>`;
      }

      // Título del servicio con información adicional - SOLO EL NOMBRE
      content += `
        <div class="service-section no-break" style="page-break-inside: avoid; margin-bottom: 20px;">
          <div class="service-title" style="background-color: #008d97; color: white; padding: 12px 20px; font-weight: bold; font-size: 12pt; text-align: center; border-radius: 5px; margin-bottom: 15px; page-break-after: avoid;">
            ${service?.name || 'Servicio sin nombre'}
          </div>
      `;

      if (additionalValues && additionalValues.length > 0) {
        // Procesar additionalValues para crear instancias
        const instancesData = this.processAdditionalValues(
          additionalValues,
          service?.additionalFields || [],
        );

        if (instancesData.instances.length > 0) {
          content += this.generateInstancesTable(instancesData);
        }
      }

      content += `</div>`; // Cerrar service-section
    });

    return content;
  }

  /**
   * Procesa los additionalValues para extraer instancias y sus campos
   */
  private processAdditionalValues(
    additionalValues: any[],
    additionalFields: any[],
  ) {
    const instancesMap = new Map<number, Record<string, any>>();
    const fieldLabelsMap = new Map<string, string>();

    // Crear mapa de labels de campos
    additionalFields.forEach(field => {
      fieldLabelsMap.set(field.id.toString(), field.label || field.fieldName);
    });

    // Procesar additionalValues
    additionalValues.forEach(value => {
      // Extraer número de instancia y field ID del fieldName
      // Formato esperado: "instance_1_field_36"
      const match = value.fieldName.match(/instance_(\d+)_field_(\d+)/);
      if (match) {
        const instanceNumber = parseInt(match[1]);
        const fieldId = match[2];
        const fieldLabel = fieldLabelsMap.get(fieldId) || `Campo ${fieldId}`;

        if (!instancesMap.has(instanceNumber)) {
          instancesMap.set(instanceNumber, {});
        }

        instancesMap.get(instanceNumber)![fieldLabel] = value.fieldValue;
      }
    });

    // Convertir mapa a array y ordenar por número de instancia
    const instances = Array.from(instancesMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([instanceNumber, data]) => ({
        instanceNumber,
        data,
      }));

    // Obtener todos los campos únicos
    const allFields = new Set<string>();
    instances.forEach(instance => {
      Object.keys(instance.data).forEach(field => {
        allFields.add(field);
      });
    });

    return {
      instances,
      fields: Array.from(allFields).sort(),
    };
  }

  /**
   * Genera tabla HTML para instancias con información adicional
   */ private generateInstancesTable(instancesData: {
    instances: any[];
    fields: string[];
  }): string {
    const { instances, fields } = instancesData;

    if (instances.length === 0 || fields.length === 0) {
      return '';
    }

    let tableHTML = `
      <div class="instances-container no-break" style="page-break-inside: avoid; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0; font-size: 8pt; page-break-inside: avoid;">
          <thead>
            <tr style="background-color: #e0e0e0;">
              <th style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold; width: 80px;">N° MUESTRA</th>
    `;

    // Headers de campos
    fields.forEach(field => {
      tableHTML += `<th style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">${field}</th>`;
    });

    tableHTML += `
            </tr>
          </thead>
          <tbody>
    `;

    // Filas de datos
    instances.forEach((instance, index) => {
      const rowStyle =
        index % 2 === 0
          ? 'background-color: #ffffff;'
          : 'background-color: #f9f9f9;';

      tableHTML += `
        <tr style="${rowStyle}">
          <td style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; background-color: #f0f0f0;">${index + 1}</td>
      `;

      fields.forEach(field => {
        const value = instance.data[field] || '';
        tableHTML += `<td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${this.formatValue(value)}</td>`;
      });

      tableHTML += `</tr>`;
    });

    tableHTML += `
          </tbody>
        </table>      </div>
    `;

    return tableHTML;
  }

  private async generatePDFFromHTML(
    htmlContent: string,
    request: ServiceRequest,
    options: PDFGenerationOptions,
  ): Promise<Buffer | string> {
    let browser: puppeteer.Browser | null = null;

    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate header and footer HTML
      const assets = await this.loadAssets();
      const headerHTML = this.generateHeaderHTML(assets);
      const footerHTML = this.generateFooterHTML(assets);

      // PDF options
      const pdfOptions: puppeteer.PDFOptions = {
        format: options.format,
        margin: {
          top: '50mm',
          right: '4mm',
          bottom: '25mm',
          left: '4mm',
        },
        printBackground: true,
        displayHeaderFooter: options.includeHeader || options.includeFooter,
        headerTemplate: options.includeHeader ? headerHTML : '',
        footerTemplate: options.includeFooter ? footerHTML : '',
      };

      if (!options.returnBuffer) {
        // Ensure uploads directory exists
        await fs.mkdir(this.uploadsPath, { recursive: true });
        const filename = `solicitud-${request.id}.pdf`;
        const filepath = path.join(this.uploadsPath, filename);
        pdfOptions.path = filepath;
      }

      const pdfResult = await page.pdf(pdfOptions);

      if (options.returnBuffer) {
        // Verify buffer is valid
        if (!pdfResult || pdfResult.length === 0) {
          throw new Error('Generated PDF buffer is empty or null');
        }

        const buffer = Buffer.isBuffer(pdfResult)
          ? pdfResult
          : Buffer.from(pdfResult);
        console.log(`PDF generated as buffer. Size: ${buffer.length} bytes`);

        return buffer;
      } else {
        console.log(`PDF generated successfully at: ${pdfOptions.path}`);
        return pdfOptions.path as string;
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  private generateHeaderHTML(assets: Record<string, string>): string {
    return `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; width: 100%; display: flex; padding: 0; margin: 0; box-sizing: border-box; border-bottom: 3px solid #008D97; margin-bottom: 20px;">
        <div style="flex: 0 0 15%; background-color: #ffffff; padding: 15px 20px; display: flex; align-items: center; justify-content: center;">
          <img src="${assets.logo}" alt="INGEOCIMYC Logo" style="max-width: 250px; height: auto; object-fit: contain;">
        </div>
        <div style="flex: 0 0 62%; background-color: #008380; padding: 20px 25px; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center; color: #ffffff; width: 100%;">
            <div style="font-weight: bold; font-size: 18px; margin-bottom: 8px; line-height: 1.2;">
              SOLICITUD DE SERVICIOS DE ENSAYO DE CONCRETOS EN LABORATORIO
            </div>
            <div style="font-size: 14px; margin-bottom: 12px; font-weight: 500;">
              LABORATORIO DE GEOTECNIA Y CONCRETOS
            </div>
            <div style="display: flex; justify-content: center; gap: 40px; font-size: 11px; margin-top: 8px;">
              <div style="background-color: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 3px;">
                <strong>GM-F11</strong>
              </div>
              <div style="background-color: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 3px;">
                <strong>VERSIÓN 1.0</strong>
              </div>
              <div style="background-color: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 3px;">
                <strong>${new Date().toLocaleDateString('es-CO')}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private generateFooterHTML(assets: Record<string, string>): string {
    return `
      <div style="width: 100%; font-family: sans-serif; font-size: 14px; color: #333; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-around; align-items: center; padding: 10px 40px; border-bottom: 1px solid #eeeeee;">
          <div style="display: flex; align-items: center;">
            <img src="${assets.phone}" style="width: 24px; height: 24px; margin-right: 8px;">
            <span>301-351-7044</span>
          </div>
          <div style="display: flex; align-items: center;">
            <img src="${assets.internet}" style="width: 24px; height: 24px; margin-right: 8px;">
            <div style="display: flex; flex-direction: column;">
              <span>coordinador@ingeocimyc.com.co</span>
              <span>www.ingeocimyc.com.co</span>
            </div>
          </div>
          <div style="display: flex; align-items: center;">
            <img src="${assets.location}" style="width: 24px; height: 24px; margin-right: 8px;">
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
    `;
  }
  private formatValue(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '&nbsp;'; // Retorna un espacio HTML para celdas vacías
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        return new Date(value).toLocaleDateString('es-CO');
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private formatFieldName(fieldName: string): string {
    // Convert camelCase to readable format
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Generate HTML preview of service request PDF
   * @param requestId - Service request ID
   * @returns HTML content for preview
   */
  async generateServiceRequestPreview(requestId: number): Promise<string> {
    try {
      // Get the same data used for PDF generation
      const data = await this.getServiceRequestData(requestId);

      // Generate HTML content with the same process as PDF
      const htmlContent = await this.generateHTMLContent(data);

      // Add preview-specific styles and controls
      const previewHTML = this.addPreviewControls(htmlContent, requestId);

      return previewHTML;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate HTML preview: ${error.message}`,
      );
    }
  }

  /**
   * Add preview controls and styles to HTML content
   * @param htmlContent - Original HTML content
   * @param requestId - Service request ID
   * @returns HTML with preview controls
   */
  private addPreviewControls(htmlContent: string, requestId: number): string {
    const previewControls = `
      <style>
        .preview-controls {
          position: fixed;
          top: 10px;
          right: 10px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          font-family: Arial, sans-serif;
          min-width: 200px;
        }
        .preview-controls h3 {
          margin: 0 0 10px 0;
          color: #008d97;
          font-size: 14px;
        }
        .preview-controls button {
          background: #008d97;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin: 5px 5px 5px 0;
          font-size: 12px;
        }
        .preview-controls button:hover {
          background: #006d75;
        }
        .preview-controls .refresh-btn {
          background: #28a745;
        }
        .preview-controls .download-btn {
          background: #dc3545;
        }
        .preview-zoom {
          margin: 10px 0;
        }
        .preview-zoom label {
          display: block;
          margin-bottom: 5px;
          font-size: 12px;
        }
        .preview-zoom select {
          width: 100%;
          padding: 4px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        body.preview-mode {
          padding-top: 20px;
        }
        .preview-wrapper {
          transform-origin: top left;
          transition: transform 0.3s ease;
        }
      </style>
      
      <div class="preview-controls">
        <h3>Vista Previa PDF</h3>
        <button onclick="refreshPreview()" class="refresh-btn">🔄 Actualizar</button>
        <button onclick="downloadPDF()" class="download-btn">📥 Descargar PDF</button>
        <div class="preview-zoom">
          <label for="zoom-select">Zoom:</label>
          <select id="zoom-select" onchange="changeZoom(this.value)">
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1" selected>100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
          </select>
        </div>
      </div>
      
      <script>
        document.body.classList.add('preview-mode');
        
        function refreshPreview() {
          window.location.reload();
        }
        
        function downloadPDF() {
          window.open('/api/pdf/service-request/${requestId}', '_blank');
        }
        
        function changeZoom(scale) {
          const wrapper = document.querySelector('.preview-wrapper') || document.body;
          wrapper.style.transform = 'scale(' + scale + ')';
          
          // Adjust body height based on zoom
          if (scale < 1) {
            document.body.style.height = (100 / scale) + '%';
          } else {
            document.body.style.height = 'auto';
          }
        }
        
        // Add wrapper class to container
        document.addEventListener('DOMContentLoaded', function() {
          const container = document.querySelector('.container');
          if (container) {
            container.classList.add('preview-wrapper');
          }
        });
      </script>
    `;

    // Insert preview controls before closing body tag
    return htmlContent.replace('</body>', previewControls + '</body>');
  }

  /**
   * Generate PDF editor interface with live preview
   * @param requestId - Service request ID
   * @returns HTML editor interface
   */
  async generatePDFEditor(requestId: number): Promise<string> {
    try {
      // Get the current template content
      const templatePath = path.join(
        this.templatesPath,
        'service-request.html',
      );
      const templateContent = await fs.readFile(templatePath, 'utf8');

      // Extract CSS from template
      const cssMatch = templateContent.match(/<style>([\s\S]*?)<\/style>/);
      const currentCSS = cssMatch ? cssMatch[1] : '';

      // Generate the editor interface
      const editorHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor de PDF - Solicitud ${requestId}</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', sans-serif; }
        
        .editor-container {
            display: flex;
            height: 100vh;
        }
        
        .editor-panel {
            width: 40%;
            background: #f8f9fa;
            border-right: 1px solid #dee2e6;
            display: flex;
            flex-direction: column;
        }
        
        .preview-panel {
            width: 60%;
            background: white;
            overflow: auto;
        }
        
        .editor-header {
            background: #008d97;
            color: white;
            padding: 15px;
            text-align: center;
        }
        
        .editor-controls {
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .editor-controls button {
            background: #008d97;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            font-size: 14px;
        }
        
        .editor-controls button:hover {
            background: #006d75;
        }
        
        .css-editor {
            flex: 1;
            padding: 0;
        }
        
        .css-editor textarea {
            width: 100%;
            height: 100%;
            border: none;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 15px;
            resize: none;
            outline: none;
            background: #2d3748;
            color: #e2e8f0;
        }
        
        .preview-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .status-bar {
            background: #e9ecef;
            padding: 8px 15px;
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
        }
        
        .loading {
            opacity: 0.7;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="editor-container">
        <div class="editor-panel">
            <div class="editor-header">
                <h2>Editor de Estilos PDF</h2>
                <p>Solicitud de Servicio #${requestId}</p>
            </div>
            
            <div class="editor-controls">
                <button onclick="updatePreview()">🔄 Actualizar Vista</button>
                <button onclick="downloadPDF()">📥 Descargar PDF</button>
                <button onclick="resetStyles()">↶ Restaurar</button>
                <button onclick="saveTemplate()">💾 Guardar Template</button>
            </div>
            
            <div class="css-editor">
                <textarea id="css-input" placeholder="Modifica los estilos CSS aquí...">${currentCSS}</textarea>
            </div>
            
            <div class="status-bar">
                <span id="status">Listo - Modifica los estilos y haz clic en "Actualizar Vista"</span>
            </div>
        </div>
        
        <div class="preview-panel">
            <iframe id="preview-frame" class="preview-iframe" src="/api/pdf/service-request/${requestId}/preview"></iframe>
        </div>
    </div>

    <script>
        let updateTimeout;
        const statusEl = document.getElementById('status');
        const cssInput = document.getElementById('css-input');
        const previewFrame = document.getElementById('preview-frame');
        
        // Auto-update preview while typing (debounced)
        cssInput.addEventListener('input', function() {
            clearTimeout(updateTimeout);
            statusEl.textContent = 'Escribiendo...';
            
            updateTimeout = setTimeout(() => {
                updatePreview();
            }, 1000); // Wait 1 second after user stops typing
        });
        
        function updatePreview() {
            statusEl.textContent = 'Actualizando vista previa...';
            document.body.classList.add('loading');
            
            const styles = encodeURIComponent(cssInput.value);
            previewFrame.src = '/api/pdf/service-request/${requestId}/preview-with-styles?styles=' + styles;
            
            previewFrame.onload = function() {
                statusEl.textContent = 'Vista previa actualizada';
                document.body.classList.remove('loading');
            };
        }
        
        function downloadPDF() {
            statusEl.textContent = 'Generando PDF...';
            window.open('/api/pdf/service-request/${requestId}', '_blank');
            statusEl.textContent = 'PDF descargado';
        }
        
        function resetStyles() {
            if (confirm('¿Estás seguro de que quieres restaurar los estilos originales?')) {
                location.reload();
            }
        }
        
        function saveTemplate() {
            alert('Funcionalidad de guardado pendiente de implementación');
            // TODO: Implement template saving functionality
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                updatePreview();
            }
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                downloadPDF();
            }
        });
    </script>
</body>
</html>`;

      return editorHTML;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate PDF editor: ${error.message}`,
      );
    }
  }

  /**
   * Generate service request preview with custom styles
   * @param requestId - Service request ID
   * @param customStyles - Custom CSS styles
   * @returns HTML content with custom styles
   */
  async generateServiceRequestPreviewWithStyles(
    requestId: number,
    customStyles: string,
  ): Promise<string> {
    try {
      // Get the same data used for PDF generation
      const data = await this.getServiceRequestData(requestId);

      // Load template and replace CSS
      const templatePath = path.join(
        this.templatesPath,
        'service-request.html',
      );
      let template = await fs.readFile(templatePath, 'utf8');

      // Replace the existing styles with custom ones
      template = template.replace(
        /<style>[\s\S]*?<\/style>/,
        `<style>${customStyles}</style>`,
      );

      // Load and encode assets
      const assets = await this.loadAssets();

      // Replace variables in template
      template = this.replaceTemplateVariables(template, data, assets);

      // Add preview indicator
      const previewIndicator = `
        <div style="position: fixed; top: 10px; left: 10px; background: #28a745; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; z-index: 1000;">
          Vista Previa - Solicitud #${requestId}
        </div>
      `;

      return template.replace('<body>', '<body>' + previewIndicator);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate preview with custom styles: ${error.message}`,
      );
    }
  }
}
