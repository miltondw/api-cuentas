import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequestsService } from '@/modules/client/service-requests/service-requests.service';
import { ServiceRequestsController } from '@/modules/client/service-requests/service-requests.controller';
import { ServiceRequest } from '@/modules/client/service-requests/entities/service-request.entity';
import { SelectedService } from '@/modules/client/service-requests/entities/selected-service.entity';
import { ServiceInstance } from '@/modules/client/service-requests/entities/service-instance.entity';
import { ServiceInstanceValue } from '@/modules/client/service-requests/entities/service-instance-value.entity';
import { Service } from '@/modules/services/entities/service.entity';
import { ServiceAdditionalValue } from '@/modules/services/entities/service-additional-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceRequest,
      SelectedService,
      ServiceInstance,
      ServiceInstanceValue,
      Service,
      ServiceAdditionalValue,
    ]),
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
