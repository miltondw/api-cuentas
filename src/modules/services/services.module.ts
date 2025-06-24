import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from '@/modules/services/services.service';
import { ServicesController } from '@/modules/services/services.controller';
import { ServicesAdminService } from '@/modules/services/services-admin.service';
import { ServicesAdminController } from '@/modules/services/services-admin.controller';
import { Service } from '@/modules/services/entities/service.entity';
import { ServiceCategory } from '@/modules/services/entities/service-category.entity';
import { ServiceAdditionalField } from '@/modules/services/entities/service-additional-field.entity';
import { ServiceAdditionalValue } from '@/modules/services/entities/service-additional-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      ServiceCategory,
      ServiceAdditionalField,
      ServiceAdditionalValue,
    ]),
  ],
  controllers: [ServicesController, ServicesAdminController],
  providers: [ServicesService, ServicesAdminService],
  exports: [ServicesService, ServicesAdminService],
})
export class ServicesModule {}
