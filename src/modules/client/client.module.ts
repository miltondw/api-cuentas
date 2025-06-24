import { Module } from '@nestjs/common';
import { ServiceRequestsModule } from '@/modules/client/service-requests/service-requests.module';
import { ServicesModule } from '@/modules/services/services.module';

@Module({
  imports: [ServiceRequestsModule, ServicesModule],
  exports: [ServiceRequestsModule, ServicesModule],
})
export class ClientModule {}
