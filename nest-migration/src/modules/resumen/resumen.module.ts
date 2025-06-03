import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumenController } from './resumen.controller';
import { ResumenService } from './resumen.service';
// Import entities when they are defined
import { FinancialSummary } from '../financial/entities/financial-summary.entity';
import { CompanyExpense } from '../financial/entities/company-expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialSummary, CompanyExpense])],
  controllers: [ResumenController],
  providers: [ResumenService],
  exports: [ResumenService],
})
export class ResumenModule {}
