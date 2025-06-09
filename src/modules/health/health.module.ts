import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ApiHealthController } from './api-health.controller';

@Module({
  controllers: [HealthController, ApiHealthController],
})
export class HealthModule {}
