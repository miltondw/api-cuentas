import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumenController } from '@/modules/projects/resumen/resumen.controller';
import { ResumenService } from '@/modules/projects/resumen/resumen.service';
// Import entities when they are defined
import { FinancialSummary } from '@/modules/projects/financial/entities/financial-summary.entity';
import { CompanyExpense } from '@/modules/projects/financial/entities/company-expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialSummary, CompanyExpense])],
  controllers: [ResumenController],
  providers: [ResumenService],
  exports: [ResumenService],
})
export class ResumenModule {}
