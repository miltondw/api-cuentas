import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServicesAdminService } from './services-admin.service';
import { ServicesAdminController } from './services-admin.controller';
import { Service } from './entities/service.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceAdditionalField } from './entities/service-additional-field.entity';
import { ServiceAdditionalValue } from './entities/service-additional-value.entity';

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
