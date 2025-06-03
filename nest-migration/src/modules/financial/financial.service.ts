import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CompanyExpense } from './entities/company-expense.entity';
import { FinancialSummary } from './entities/financial-summary.entity';
import {
  CreateCompanyExpenseDto,
  UpdateCompanyExpenseDto,
  CreateFinancialSummaryDto,
  UpdateFinancialSummaryDto,
} from './dto/financial.dto';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(CompanyExpense)
    private companyExpenseRepository: Repository<CompanyExpense>,
    @InjectRepository(FinancialSummary)
    private financialSummaryRepository: Repository<FinancialSummary>,
  ) {}
  // Company Expenses Methods
  async createCompanyExpense(
    createDto: CreateCompanyExpenseDto,
  ): Promise<CompanyExpense> {
    // Convert string to Date for database comparison
    const mesDate = new Date(`${createDto.mes}-01`);
    
    // Check if expense for this month already exists
    const existingExpense = await this.companyExpenseRepository.findOne({
      where: { mes: mesDate },
    });

    if (existingExpense) {
      throw new BadRequestException(
        `Company expense for month ${createDto.mes} already exists`,
      );
    }

    const expense = this.companyExpenseRepository.create({
      ...createDto,
      mes: mesDate,
    });
    return this.companyExpenseRepository.save(expense);
  }

  async findAllCompanyExpenses(): Promise<CompanyExpense[]> {
    return this.companyExpenseRepository.find({
      order: { mes: 'DESC' },
    });
  }
  async findCompanyExpensesByYear(year: string): Promise<CompanyExpense[]> {
    // Create date range for the year
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    
    return this.companyExpenseRepository
      .createQueryBuilder('expense')
      .where('expense.mes >= :startDate', { startDate })
      .andWhere('expense.mes <= :endDate', { endDate })
      .orderBy('expense.mes', 'ASC')
      .getMany();
  }
  async findCompanyExpenseByMonth(mes: string): Promise<CompanyExpense> {
    // Convert string to Date for database comparison
    const mesDate = new Date(`${mes}-01`);
    
    const expense = await this.companyExpenseRepository.findOne({
      where: { mes: mesDate },
    });

    if (!expense) {
      throw new NotFoundException(`Company expense for month ${mes} not found`);
    }

    return expense;
  }

  async updateCompanyExpense(
    id: number,
    updateDto: UpdateCompanyExpenseDto,
  ): Promise<CompanyExpense> {
    const expense = await this.companyExpenseRepository.findOne({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException(`Company expense with ID ${id} not found`);
    }    // If month is being updated, check for duplicates
    if (updateDto.mes) {
      // Convert string to Date for comparison
      const updateMesDate = new Date(`${updateDto.mes}-01`);
      const formattedExistingMes = expense.mes.toISOString().substring(0, 7); // Format: YYYY-MM
      
      if (updateDto.mes !== formattedExistingMes) {
        const existingExpense = await this.companyExpenseRepository.findOne({
          where: { mes: updateMesDate },
        });

        if (existingExpense) {
          throw new BadRequestException(
            `Company expense for month ${updateDto.mes} already exists`,
          );
        }
      }
    }

    await this.companyExpenseRepository.update(id, updateDto);
    return this.companyExpenseRepository.findOne({ where: { id } });
  }

  async deleteCompanyExpense(id: number): Promise<void> {
    const result = await this.companyExpenseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Company expense with ID ${id} not found`);
    }
  }

  async getTotalExpensesByMonth(mes: string): Promise<number> {
    const expense = await this.findCompanyExpenseByMonth(mes);
    return expense.totalExpenses;
  }

  // Financial Summary Methods
  async createFinancialSummary(
    createDto: CreateFinancialSummaryDto,
  ): Promise<FinancialSummary> {
    // Check if summary for this month already exists
    const existingSummary = await this.financialSummaryRepository.findOne({
      where: { mes: createDto.mes },
    });

    if (existingSummary) {
      throw new BadRequestException(
        `Financial summary for month ${createDto.mes} already exists`,
      );
    }

    // Calculate profit margin if not provided
    if (!createDto.margen_utilidad && createDto.ingresos_totales > 0) {
      createDto.margen_utilidad =
        (createDto.utilidad_neta / createDto.ingresos_totales) * 100;
    }

    const summary = this.financialSummaryRepository.create(createDto);
    return this.financialSummaryRepository.save(summary);
  }

  async findAllFinancialSummaries(): Promise<FinancialSummary[]> {
    return this.financialSummaryRepository.find({
      order: { mes: 'DESC' },
    });
  }

  async findFinancialSummariesByYear(
    year: string,
  ): Promise<FinancialSummary[]> {
    return this.financialSummaryRepository.find({
      where: { mes: Like(`${year}%`) },
      order: { mes: 'ASC' },
    });
  }

  async findFinancialSummaryByMonth(mes: string): Promise<FinancialSummary> {
    const summary = await this.financialSummaryRepository.findOne({
      where: { mes },
    });

    if (!summary) {
      throw new NotFoundException(
        `Financial summary for month ${mes} not found`,
      );
    }

    return summary;
  }

  async updateFinancialSummary(
    id: number,
    updateDto: UpdateFinancialSummaryDto,
  ): Promise<FinancialSummary> {
    const summary = await this.financialSummaryRepository.findOne({
      where: { id },
    });

    if (!summary) {
      throw new NotFoundException(`Financial summary with ID ${id} not found`);
    }

    // If month is being updated, check for duplicates
    if (updateDto.mes && updateDto.mes !== summary.mes) {
      const existingSummary = await this.financialSummaryRepository.findOne({
        where: { mes: updateDto.mes },
      });

      if (existingSummary) {
        throw new BadRequestException(
          `Financial summary for month ${updateDto.mes} already exists`,
        );
      }
    }    // Recalculate profit margin if income or profit changes
    if (updateDto.ingresos_totales || updateDto.utilidad_neta) {
      const newIncome = updateDto.ingresos_totales ?? summary.ingresosTotales;
      const newProfit = updateDto.utilidad_neta ?? summary.utilidadNeta;

      if (newIncome > 0) {
        updateDto.margen_utilidad =
          (Number(newProfit) / Number(newIncome)) * 100;
      }
    }

    await this.financialSummaryRepository.update(id, updateDto);
    return this.financialSummaryRepository.findOne({ where: { id } });
  }

  async deleteFinancialSummary(id: number): Promise<void> {
    const result = await this.financialSummaryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Financial summary with ID ${id} not found`);
    }
  }

  // Utility Methods
  async generateFinancialSummaryFromData(
    mes: string,
  ): Promise<FinancialSummary> {
    // This method would integrate with projects to calculate actual income
    // For now, it's a placeholder for future implementation
    const mesDate = new Date(`${mes}-01`);
    const companyExpenses = await this.companyExpenseRepository.findOne({
      where: { mes: mesDate },
    });

    if (!companyExpenses) {
      throw new NotFoundException(`No company expenses found for month ${mes}`);
    }

    // TODO: Calculate actual income from projects
    const mockIncome = 8000000; // This should be calculated from actual project data
    const totalExpenses = companyExpenses.totalExpenses;
    const grossProfit = mockIncome - totalExpenses;
    const netProfit = grossProfit * 0.9; // Assuming 10% for taxes/other deductions
    const profitMargin = mockIncome > 0 ? (netProfit / mockIncome) * 100 : 0;

    const summaryData: CreateFinancialSummaryDto = {
      mes,
      ingresos_totales: mockIncome,
      gastos_totales: totalExpenses,
      utilidad_bruta: grossProfit,
      utilidad_neta: netProfit,
      margen_utilidad: profitMargin,
    };

    return this.createFinancialSummary(summaryData);
  }

  async getFinancialOverview(year?: string) {
    let summaries: FinancialSummary[];

    if (year) {
      summaries = await this.findFinancialSummariesByYear(year);
    } else {
      summaries = await this.findAllFinancialSummaries();
    }    const totalIncome = summaries.reduce(
      (sum, s) => sum + Number(s.ingresosTotales),
      0,
    );
    const totalExpenses = summaries.reduce(
      (sum, s) => sum + Number(s.gastosTotales),
      0,
    );
    const totalProfit = summaries.reduce(
      (sum, s) => sum + Number(s.utilidadNeta),
      0,
    );
    const averageMargin =
      summaries.length > 0
        ? summaries.reduce((sum, s) => sum + Number(s.margenUtilidad), 0) /
          summaries.length
        : 0;

    return {
      period: year || 'All time',
      totalIncome,
      totalExpenses,
      totalProfit,
      averageMargin: Math.round(averageMargin * 100) / 100,
      monthlyData: summaries,
    };
  }
}
