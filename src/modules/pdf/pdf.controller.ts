import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { PDFService, PDFGenerationOptions } from './pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('PDF Generation')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pdf')
export class PDFController {
  constructor(private readonly pdfService: PDFService) {}
  @Get('service-request/:id')
  @Public()
  @ApiOperation({ summary: 'Generate PDF for service request' })
  @ApiParam({ name: 'id', description: 'Service Request ID', type: 'number' })
  @ApiQuery({
    name: 'buffer',
    required: false,
    description: 'Force return as buffer (true/false)',
    type: 'boolean',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'PDF format (A4/Letter)',
    enum: ['A4', 'Letter'],
  })
  @ApiResponse({
    status: 200,
    description: 'PDF generado exitosamente (Solo admin)',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Service request not found' })
  async generateServiceRequestPDF(
    @Param('id', ParseIntPipe) id: number,
    @Query('buffer') buffer?: string,
    @Query('format') format?: 'A4' | 'Letter',
    @Res() res?: Response,
  ): Promise<void> {
    try {
      // Parse query parameters
      const options: PDFGenerationOptions = {
        returnBuffer:
          buffer === 'true' || process.env.NODE_ENV === 'production',
        format: format || 'A4',
      };

      const result = await this.pdfService.generateServiceRequestPDF(
        id,
        options,
      );

      if (Buffer.isBuffer(result)) {
        // Return PDF as buffer (for production or when explicitly requested)
        const filename = `Solicitud-${id}.pdf`;

        // Verify buffer is valid
        if (result.length === 0) {
          throw new BadRequestException('Generated PDF is empty');
        }

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"`,
        );
        res.setHeader('Content-Length', result.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Accept-Ranges', 'bytes');

        // Send buffer directly
        res.end(result, 'binary');
      } else {
        // Return file path (for development)
        const filename = `Solicitud-${id}.pdf`;
        res.download(result, filename);
      }
    } catch (error) {
      throw new BadRequestException(`Failed to generate PDF: ${error.message}`);
    }
  }

  @Get('service-request/:id/preview')
  @Roles('admin', 'user', 'viewer')
  @ApiOperation({ summary: 'Preview service request PDF content as HTML' })
  @ApiParam({ name: 'id', description: 'Service Request ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'HTML preview generated successfully',
    content: {
      'text/html': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Service request not found' })
  async previewServiceRequestPDF(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // This would require implementing an HTML preview method in the service
      // For now, we'll return a simple message
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <html>
          <body>
            <h1>PDF Preview</h1>
            <p>PDF preview functionality for Service Request ID: ${id}</p>
            <p>This feature is under development.</p>
            <p><a href="/api/pdf/service-request/${id}" target="_blank">Download PDF</a></p>
          </body>
        </html>
      `);
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate preview: ${error.message}`,
      );
    }
  }

  @Post('service-request/:id/regenerate')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Force regenerate PDF for service request' })
  @ApiParam({ name: 'id', description: 'Service Request ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'PDF regenerated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        size: { type: 'number', description: 'PDF size in bytes' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Service request not found' })
  async regenerateServiceRequestPDF(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string; size?: number }> {
    try {
      const result = await this.pdfService.generateServiceRequestPDF(id, {
        returnBuffer: true,
      });

      if (Buffer.isBuffer(result)) {
        return {
          success: true,
          message: 'PDF regenerated successfully',
          size: result.length,
        };
      } else {
        return {
          success: true,
          message: 'PDF regenerated and saved to disk',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to regenerate PDF: ${error.message}`,
      };
    }
  }
}
