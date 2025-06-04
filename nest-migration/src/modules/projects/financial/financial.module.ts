import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { CompanyExpense } from './entities/company-expense.entity';
import { FinancialSummary } from './entities/financial-summary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyExpense, FinancialSummary])],
  controllers: [FinancialController],
  providers: [FinancialService],
  exports: [FinancialService, TypeOrmModule],
})
export class FinancialModule {}
