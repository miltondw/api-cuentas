import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PDFController } from '@/modules/pdf/pdf.controller';
import { PDFService } from '@/modules/pdf/pdf.service';
import { ServiceRequest } from '@/modules/client/service-requests/entities/service-request.entity';
import { SelectedService } from '@/modules/client/service-requests/entities/selected-service.entity';
import { ServiceInstance } from '@/modules/client/service-requests/entities/service-instance.entity';
import { ServiceInstanceValue } from '@/modules/client/service-requests/entities/service-instance-value.entity';

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
