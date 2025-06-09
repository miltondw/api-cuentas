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

    // Get associated services with instances and values
    const services = await this.selectedServiceRepository.find({
      where: { requestId: requestId },
      relations: [
        'service',
        'service.category',
        'serviceInstances',
        'serviceInstances.serviceInstanceValues',
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

    // --- Agrupar servicios por categoría ---
    const servicesByCategory: Record<string, SelectedService[]> = {};
    for (const selectedService of services) {
      const service = selectedService.service;
      if (!service) continue;
      
      const categoryCode = service.code.split('-')[0]; // SR, EDS, EMC, DMC, etc.
      if (!servicesByCategory[categoryCode]) {
        servicesByCategory[categoryCode] = [];
      }
      servicesByCategory[categoryCode].push(selectedService);
    }

    // Títulos de categorías
    const categoryTitles: Record<string, string> = {
      SR: 'Servicios de Caracterización',
      EDS: 'Estudios de Suelos',
      EMC: 'Ensayos de Muestras de Concreto',
      DMC: 'Diseño de Mezclas de Concreto',
    };

    let serviciosContent = '';

    // Procesar cada categoría en una página separada
    for (const [categoryCode, categoryServices] of Object.entries(servicesByCategory)) {
      if (categoryServices.length === 0) continue;

      // Agregar salto de página si no es la primera categoría
      if (serviciosContent) {
        serviciosContent += '<div class="page-break"></div>';
      }

      serviciosContent += `
        <div class="section-title">${
          categoryTitles[categoryCode] || categoryCode
        }</div>
      `;

      // Para cada servicio en la categoría
      for (const selectedService of categoryServices) {
        const { service, serviceInstances } = selectedService;
        const quantity = selectedService.quantity || 1;

        serviciosContent += `
          <div class="service-header">
            <strong>${service?.code} - ${service?.name}</strong> (Cantidad: ${quantity})
          </div>
        `;

        // Si hay instancias con información adicional, mostrarlas en formato horizontal
        if (serviceInstances && serviceInstances.length > 0) {
          // Formatear instancias para el generador horizontal
          const instances = serviceInstances
            .map(instance => ({
              instanceNumber: instance.instanceNumber,
              additionalInfo: instance.serviceInstanceValues.reduce(
                (acc, value) => {
                  acc[value.fieldName] = value.fieldValue;
                  return acc;
                },
                {} as Record<string, any>,
              ),
            }))
            .sort((a, b) => a.instanceNumber - b.instanceNumber);

          serviciosContent += generateHorizontalInstancesContent(instances);
        }
      }
    }

    return serviciosContent;
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
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; width: 100%; display: flex; padding: 0; margin: 0; box-sizing: border-box; border-bottom: 3px solid #008D97; margin-bottom: 15px;">
        <div style="flex: 0 0 10%; background-color: #ffffff; padding: 10px 15px; display: flex; align-items: center;">
          <img src="${assets.logo}" alt="INGEOCIMYC Logo" style="max-width: 250px; height: auto; object-fit: contain;">
        </div>
        <div style="flex: 0 0 90%; background-color: #008380; padding: 8px 15px; display: flex; width: 100%; place-items: center;">
          <div style="text-align: center; color: #000000; width: 100%;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">SOLICITUD DE SERVICIOS DE ENSAYO DE CONCRETOS EN LABORATORIO</div>
            <div style="font-size: 12px; margin-bottom: 3px;">LABORATORIO DE GEOTECNIA Y CONCRETOS</div>
            <div style="display: flex; justify-content: space-evenly; font-size: 10px; margin-top: 5px;">
              <div style="width: 120px; text-align: center;">GM-F11</div>
              <div style="width: 120px; text-align: center;">VERSIÓN 1.0</div>
              <div style="width: 120px; text-align: center;">${new Date().toLocaleDateString('es-CO')}</div>
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
}
