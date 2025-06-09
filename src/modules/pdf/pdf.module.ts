import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PDFController } from './pdf.controller';
import { PDFService } from './pdf.service';
import { ServiceRequest } from '../client/service-requests/entities/service-request.entity';
import { SelectedService } from '../client/service-requests/entities/selected-service.entity';
import { ServiceInstance } from '../client/service-requests/entities/service-instance.entity';
import { ServiceInstanceValue } from '../client/service-requests/entities/service-instance-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceRequest,
      SelectedService,
      ServiceInstance,
      ServiceInstanceValue,
    ]),
  ],
  controllers: [PDFController],
  providers: [PDFService],
  exports: [PDFService],
})
export class PDFModule {}
