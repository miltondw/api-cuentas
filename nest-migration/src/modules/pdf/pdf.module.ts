import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PDFController } from './pdf.controller';
import { PDFService } from './pdf.service';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { SelectedService } from '../service-requests/entities/selected-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceRequest, SelectedService])],
  controllers: [PDFController],
  providers: [PDFService],
  exports: [PDFService],
})
export class PDFModule {}
