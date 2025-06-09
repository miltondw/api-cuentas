import { Module } from '@nestjs/common';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [ServiceRequestsModule, ServicesModule],
  exports: [ServiceRequestsModule, ServicesModule],
})
export class ClientModule {}
