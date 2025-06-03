import { Module } from '@nestjs/common';
import { ServiceRequestsModule } from '../service-requests/service-requests.module';
import { ServicesModule } from '../services/services.module';
import { ClientServiceRequestsController } from './client-service-requests.controller';

@Module({
  imports: [ServiceRequestsModule, ServicesModule],
  controllers: [ClientServiceRequestsController],
  exports: [ServiceRequestsModule, ServicesModule],
})
export class ClientModule {}
