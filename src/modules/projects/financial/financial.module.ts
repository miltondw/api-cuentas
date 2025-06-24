import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialService } from '@/modules/projects/financial/financial.service';
import { FinancialController } from '@/modules/projects/financial/financial.controller';
import { CompanyExpense } from '@/modules/projects/financial/entities/company-expense.entity';
import { FinancialSummary } from '@/modules/projects/financial/entities/financial-summary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyExpense, FinancialSummary])],
  controllers: [FinancialController],
  providers: [FinancialService],
  exports: [FinancialService, TypeOrmModule],
})
export class FinancialModule {}
