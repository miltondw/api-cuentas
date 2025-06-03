import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequest } from './entities/service-request.entity';
import { SelectedService } from './entities/selected-service.entity';
import { ServiceInstance } from './entities/service-instance.entity';
import { ServiceInstanceValue } from './entities/service-instance-value.entity';
import { Service } from '../services/entities/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceRequest, 
      SelectedService, 
      ServiceInstance, 
      ServiceInstanceValue, 
      Service
    ]),
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
