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

// Definir interfaces para filtros y paginación
interface CompanyExpenseFilters {
  year?: string;
  month?: string;
  minAmount?: number;
  maxAmount?: number;
  hasCategory?: boolean;
  categoryName?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

// Interfaz para filtros del resumen financiero
interface FinancialSummaryFilters {
  year?: string;
  month?: string;
  minIncome?: number;
  maxIncome?: number;
  minExpense?: number;
  maxExpense?: number;
  profitRange?: string;
}

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(CompanyExpense)
    private companyExpenseRepository: Repository<CompanyExpense>,
    @InjectRepository(FinancialSummary)
    private financialSummaryRepository: Repository<FinancialSummary>,
  ) {}

  // Helper method to transform CompanyExpense for API response
  private transformCompanyExpenseForResponse(expense: CompanyExpense): any {
    const transformed = {
      id: expense.id,
      mes: expense.mes,
      salarios: expense.salarios,
      luz: expense.luz,
      agua: expense.agua,
      arriendo: expense.arriendo,
      internet: expense.internet,
      salud: expense.salud,
      otros_campos: expense.otrosCampos, // Transform field name for API
      totalExpenses: expense.totalExpenses,
    };
    return transformed;
  }

  private transformCompanyExpensesArrayForResponse(
    expenses: CompanyExpense[],
  ): any[] {
    return expenses.map(expense =>
      this.transformCompanyExpenseForResponse(expense),
    );
  }

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
      mes: mesDate,
      salarios: createDto.salarios,
      luz: createDto.luz,
      agua: createDto.agua,
      arriendo: createDto.arriendo,
      internet: createDto.internet,
      salud: createDto.salud,
      otrosCampos: createDto.otros_campos, // Mapeo explícito del campo
    });
    const savedExpense = await this.companyExpenseRepository.save(expense);
    return this.transformCompanyExpenseForResponse(savedExpense);
  }
  async findAllCompanyExpenses(): Promise<any[]> {
    const expenses = await this.companyExpenseRepository.find({
      order: { mes: 'DESC' },
    });
    return this.transformCompanyExpensesArrayForResponse(expenses);
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

  async findCompanyExpenseByMonthForAPI(mes: string): Promise<any> {
    const expense = await this.findCompanyExpenseByMonth(mes);
    return this.transformCompanyExpenseForResponse(expense);
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
    } // If month is being updated, check for duplicates
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
    } // Preparar datos de actualización con mapeo correcto
    const updateData: any = {};

    if (updateDto.mes !== undefined) {
      updateData.mes = new Date(`${updateDto.mes}-01`);
    }
    if (updateDto.salarios !== undefined)
      updateData.salarios = updateDto.salarios;
    if (updateDto.luz !== undefined) updateData.luz = updateDto.luz;
    if (updateDto.agua !== undefined) updateData.agua = updateDto.agua;
    if (updateDto.arriendo !== undefined)
      updateData.arriendo = updateDto.arriendo;
    if (updateDto.internet !== undefined)
      updateData.internet = updateDto.internet;
    if (updateDto.salud !== undefined) updateData.salud = updateDto.salud;
    if (updateDto.otros_campos !== undefined)
      updateData.otrosCampos = updateDto.otros_campos;

    await this.companyExpenseRepository.update(id, updateData);
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
    } // Recalculate profit margin if income or profit changes
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
    }
    const totalIncome = summaries.reduce(
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

  async findCompanyExpensesWithFilters(
    filters: CompanyExpenseFilters,
    pagination: PaginationParams,
  ): Promise<{
    data: CompanyExpense[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    // Crear el query builder
    let queryBuilder =
      this.companyExpenseRepository.createQueryBuilder('expense');

    // Aplicar filtros
    if (filters.year) {
      const startDate = new Date(`${filters.year}-01-01`);
      const endDate = new Date(`${filters.year}-12-31`);

      queryBuilder = queryBuilder
        .andWhere('expense.mes >= :startDate', { startDate })
        .andWhere('expense.mes <= :endDate', { endDate });
    }

    if (filters.month) {
      // Filtrar por mes específico, independientemente del año
      queryBuilder = queryBuilder.andWhere('MONTH(expense.mes) = :month', {
        month: parseInt(filters.month),
      });
    } // Calcular el total de la suma de todas las propiedades numéricas excepto id
    const totalExpenseSQL = `
      (IFNULL(expense.salarios, 0) +
       IFNULL(expense.luz, 0) +
       IFNULL(expense.agua, 0) +
       IFNULL(expense.arriendo, 0) +
       IFNULL(expense.internet, 0) +
       IFNULL(expense.salud, 0))
    `;
    if (
      filters.minAmount !== undefined &&
      filters.minAmount !== null &&
      !isNaN(filters.minAmount)
    ) {
      queryBuilder = queryBuilder.andWhere(`${totalExpenseSQL} >= :minAmount`, {
        minAmount: filters.minAmount,
      });
    }

    if (
      filters.maxAmount !== undefined &&
      filters.maxAmount !== null &&
      !isNaN(filters.maxAmount)
    ) {
      queryBuilder = queryBuilder.andWhere(`${totalExpenseSQL} <= :maxAmount`, {
        maxAmount: filters.maxAmount,
      });
    }

    // Filtros para categorías específicas
    if (filters.hasCategory !== undefined && filters.categoryName) {
      const columnName = this.getCategoryColumnName(filters.categoryName);
      if (columnName) {
        if (filters.hasCategory) {
          queryBuilder = queryBuilder.andWhere(
            `expense.${columnName} IS NOT NULL AND expense.${columnName} > 0`,
          );
        } else {
          queryBuilder = queryBuilder.andWhere(
            `expense.${columnName} IS NULL OR expense.${columnName} = 0`,
          );
        }
      }
    }

    // Aplicar ordenamiento
    if (sortBy === 'mes') {
      queryBuilder = queryBuilder.orderBy('expense.mes', sortOrder);
    } else if (this.isValidColumn(sortBy)) {
      queryBuilder = queryBuilder.orderBy(`expense.${sortBy}`, sortOrder);
    } else if (sortBy === 'total') {
      // Ordenar por la suma total de todos los gastos
      queryBuilder = queryBuilder.orderBy(totalExpenseSQL, sortOrder);
    } else {
      queryBuilder = queryBuilder.orderBy('expense.mes', sortOrder);
    }

    // Aplicar paginación
    queryBuilder = queryBuilder.skip(skip).take(limit);

    // Ejecutar consulta
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findFinancialSummaryWithFilters(
    filters: FinancialSummaryFilters,
    pagination: PaginationParams,
  ): Promise<{
    data: FinancialSummary[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    // Crear el query builder
    let queryBuilder =
      this.financialSummaryRepository.createQueryBuilder('summary');

    // Aplicar filtros
    if (filters.year) {
      const startDate = new Date(`${filters.year}-01-01`);
      const endDate = new Date(`${filters.year}-12-31`);

      queryBuilder = queryBuilder
        .andWhere('summary.fecha >= :startDate', { startDate })
        .andWhere('summary.fecha <= :endDate', { endDate });
    }

    if (filters.month) {
      // Filtrar por mes específico, independientemente del año
      queryBuilder = queryBuilder.andWhere('MONTH(summary.fecha) = :month', {
        month: parseInt(filters.month),
      });
    }
    if (
      filters.minIncome !== undefined &&
      filters.minIncome !== null &&
      !isNaN(filters.minIncome)
    ) {
      queryBuilder = queryBuilder.andWhere('summary.ingresos >= :minIncome', {
        minIncome: filters.minIncome,
      });
    }

    if (
      filters.maxIncome !== undefined &&
      filters.maxIncome !== null &&
      !isNaN(filters.maxIncome)
    ) {
      queryBuilder = queryBuilder.andWhere('summary.ingresos <= :maxIncome', {
        maxIncome: filters.maxIncome,
      });
    }

    if (
      filters.minExpense !== undefined &&
      filters.minExpense !== null &&
      !isNaN(filters.minExpense)
    ) {
      queryBuilder = queryBuilder.andWhere('summary.gastos >= :minExpense', {
        minExpense: filters.minExpense,
      });
    }

    if (
      filters.maxExpense !== undefined &&
      filters.maxExpense !== null &&
      !isNaN(filters.maxExpense)
    ) {
      queryBuilder = queryBuilder.andWhere('summary.gastos <= :maxExpense', {
        maxExpense: filters.maxExpense,
      });
    }

    // Filtrar por rango de utilidad
    if (filters.profitRange) {
      const [min, max] = filters.profitRange
        .split('-')
        .map(val => parseFloat(val));

      if (!isNaN(min) && !isNaN(max)) {
        queryBuilder = queryBuilder.andWhere(
          '(summary.ingresos - summary.gastos) BETWEEN :minProfit AND :maxProfit',
          {
            minProfit: min,
            maxProfit: max,
          },
        );
      }
    }

    // Aplicar ordenamiento
    if (sortBy === 'fecha') {
      queryBuilder = queryBuilder.orderBy('summary.fecha', sortOrder);
    } else if (sortBy === 'ingresos') {
      queryBuilder = queryBuilder.orderBy('summary.ingresos', sortOrder);
    } else if (sortBy === 'gastos') {
      queryBuilder = queryBuilder.orderBy('summary.gastos', sortOrder);
    } else if (sortBy === 'utilidad') {
      queryBuilder = queryBuilder.orderBy(
        '(summary.ingresos - summary.gastos)',
        sortOrder,
      );
    } else {
      queryBuilder = queryBuilder.orderBy('summary.fecha', sortOrder);
    }

    // Aplicar paginación
    queryBuilder = queryBuilder.skip(skip).take(limit);

    // Ejecutar consulta
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  // Métodos auxiliares para validar columnas
  private isValidColumn(columnName: string): boolean {
    const validColumns = [
      'mes',
      'salarios',
      'luz',
      'agua',
      'arriendo',
      'internet',
      'salud',
      'otrosCampos',
    ];
    return validColumns.includes(columnName);
  }

  // Helper para mapear nombres de categoría a nombres de columna
  private getCategoryColumnName(categoryName: string): string | null {
    const categoryMap = {
      salarios: 'salarios',
      luz: 'luz',
      agua: 'agua',
      arriendo: 'arriendo',
      internet: 'internet',
      salud: 'salud',
      otros: 'otrosCampos',
    };

    return categoryMap[categoryName] || null;
  }

  // Métodos de análisis financiero
  async getMonthlyComparison(
    startYear: string,
    startMonth: string,
    endYear: string,
    endMonth: string,
  ): Promise<any> {
    // Validar y formatear fechas
    const startDate = new Date(`${startYear}-${startMonth}-01`);
    const endDate = new Date(`${endYear}-${endMonth}-01`);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // Construir consulta para gastos
    const expenses = await this.companyExpenseRepository
      .createQueryBuilder('expense')
      .where('expense.mes >= :startDate', { startDate })
      .andWhere('expense.mes <= :endDate', { endDate })
      .orderBy('expense.mes', 'ASC')
      .getMany();

    // Construir consulta para resumen financiero
    const summaries = await this.financialSummaryRepository
      .createQueryBuilder('summary')
      .orderBy('summary.mes', 'ASC')
      .getMany();

    // Filtrar resúmenes financieros por el rango de fechas
    const filteredSummaries = summaries.filter(summary => {
      const [year, month] = summary.mes.split('-');
      const summaryDate = new Date(`${year}-${month}-01`);
      return summaryDate >= startDate && summaryDate <= endDate;
    });

    // Crear un mapa de los datos por mes para comparación
    const monthlyData = {};

    expenses.forEach(expense => {
      const monthKey = expense.mes.toISOString().substring(0, 7); // Format YYYY-MM

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { expenses: {}, income: 0, profit: 0 };
      }

      // Extraer los gastos relevantes
      const expenseData = {
        salarios: expense.salarios || 0,
        luz: expense.luz || 0,
        agua: expense.agua || 0,
        arriendo: expense.arriendo || 0,
        internet: expense.internet || 0,
        salud: expense.salud || 0,
        otros: expense.otrosCampos ? JSON.stringify(expense.otrosCampos) : 0,
        total: expense.totalExpenses,
      };

      monthlyData[monthKey].expenses = expenseData;
    });

    filteredSummaries.forEach(summary => {
      const monthKey = summary.mes;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { expenses: {}, income: 0, profit: 0 };
      }

      monthlyData[monthKey].income = summary.ingresosTotales || 0;
      monthlyData[monthKey].expenses.total = summary.gastosTotales || 0;
      monthlyData[monthKey].profit = summary.utilidadBruta || 0;
    });

    // Ordenar los meses cronológicamente
    const sortedData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    return {
      comparison: sortedData,
      metrics: {
        totalMonths: Object.keys(sortedData).length,
        averageIncome: this.calculateAverage(
          Object.values(sortedData).map((data: any) => data.income),
        ),
        averageExpense: this.calculateAverage(
          Object.values(sortedData).map(
            (data: any) => data.expenses.total || 0,
          ),
        ),
        averageProfit: this.calculateAverage(
          Object.values(sortedData).map((data: any) => data.profit),
        ),
        growthRate: this.calculateGrowthRate(sortedData),
      },
    };
  }

  async getYearlySummary(year: string): Promise<any> {
    // Validar año
    if (!/^\d{4}$/.test(year)) {
      throw new BadRequestException('Invalid year format');
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    // Obtener todos los gastos del año
    const expenses = await this.companyExpenseRepository
      .createQueryBuilder('expense')
      .where('expense.mes >= :startDate', { startDate })
      .andWhere('expense.mes <= :endDate', { endDate })
      .orderBy('expense.mes', 'ASC')
      .getMany();

    // Obtener todos los resúmenes financieros del año
    const summaries = await this.financialSummaryRepository
      .createQueryBuilder('summary')
      .getMany();

    // Filtrar resúmenes por año
    const filteredSummaries = summaries.filter(summary =>
      summary.mes.startsWith(year),
    );

    // Calcular métricas
    const totalExpense = expenses.reduce(
      (sum, expense) => sum + expense.totalExpenses,
      0,
    );
    const totalIncome = filteredSummaries.reduce(
      (sum, summary) => sum + (summary.ingresosTotales || 0),
      0,
    );
    const totalProfit = totalIncome - totalExpense;

    // Organizar datos por mes
    const monthlyData = Array(12)
      .fill(null)
      .map((_, i) => {
        const month = i + 1;
        const monthExpenses = expenses.filter(
          e => e.mes.getMonth() + 1 === month,
        );
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        const monthKey = `${year}-${monthStr}`;
        const monthSummary = filteredSummaries.find(s => s.mes === monthKey);

        const monthTotalExpense = monthExpenses.reduce(
          (sum, e) => sum + e.totalExpenses,
          0,
        );
        const monthIncome = monthSummary ? monthSummary.ingresosTotales : 0;

        return {
          month,
          income: monthIncome,
          expense: monthTotalExpense,
          profit: monthIncome - monthTotalExpense,
        };
      });

    // Calcular distribución de gastos por categoría
    const expenseCategories = this.calculateExpenseCategories(expenses);

    return {
      year,
      summary: {
        totalIncome,
        totalExpense,
        totalProfit,
        profitMargin: totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0,
      },
      monthlyData,
      expenseCategories,
      quarterlyData: this.calculateQuarterlyData(monthlyData),
    };
  }

  async getExpenseDistribution(year?: string, month?: string): Promise<any> {
    let queryBuilder =
      this.companyExpenseRepository.createQueryBuilder('expense');

    // Aplicar filtros si se proporcionan
    if (year && month) {
      const startDate = new Date(`${year}-${month}-01`);
      const nextMonth = new Date(startDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      queryBuilder = queryBuilder
        .where('expense.mes >= :startDate', { startDate })
        .andWhere('expense.mes < :nextMonth', { nextMonth });
    } else if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);

      queryBuilder = queryBuilder
        .where('expense.mes >= :startDate', { startDate })
        .andWhere('expense.mes <= :endDate', { endDate });
    }

    const expenses = await queryBuilder.getMany();

    if (expenses.length === 0) {
      throw new NotFoundException(
        'No expense data found for the specified period',
      );
    }

    // Calcular distribución
    const categoryLabels = [
      'Salarios',
      'Luz',
      'Agua',
      'Arriendo',
      'Internet',
      'Salud',
      'Otros',
    ];

    const categoryFields = [
      'salarios',
      'luz',
      'agua',
      'arriendo',
      'internet',
      'salud',
      'otrosCampos',
    ];

    // Calcular suma de todos los gastos por categoría
    const categoryTotals = categoryFields.map((field, index) => {
      let total = 0;

      if (field === 'otrosCampos') {
        // Manejo especial para otrosCampos que es un JSON
        total = expenses.reduce((sum, expense) => {
          if (expense.otrosCampos) {
            // Si es un objeto, sumamos sus valores
            if (
              typeof expense.otrosCampos === 'object' &&
              expense.otrosCampos !== null
            ) {
              const values = Object.values(expense.otrosCampos);
              const valuesSum = values.reduce(
                (s: number, v: unknown) => s + (Number(v) || 0),
                0,
              );
              return sum + Number(valuesSum);
            }
            // Si es un número directo
            return sum + (Number(expense.otrosCampos) || 0);
          }
          return sum;
        }, 0);
      } else {
        total = expenses.reduce((sum, expense) => {
          const fieldValue = (expense as any)[field];
          return sum + (Number(fieldValue) || 0);
        }, 0);
      }

      return {
        category: categoryLabels[index],
        field: field,
        amount: total,
        percentage: 0, // Se calcula después
      };
    });

    // Calcular el total general
    const grandTotal = categoryTotals.reduce((sum, cat) => sum + cat.amount, 0);

    // Calcular los porcentajes
    categoryTotals.forEach(category => {
      category.percentage =
        grandTotal > 0 ? (category.amount / grandTotal) * 100 : 0;
    });

    // Ordenar por cantidad de mayor a menor
    const sortedCategories = [...categoryTotals].sort(
      (a, b) => b.amount - a.amount,
    );

    return {
      period:
        year && month ? `${year}-${month}` : year ? `${year}` : 'All time',
      totalExpenses: grandTotal,
      distribution: sortedCategories,
      topCategories: sortedCategories.slice(0, 3),
      lowestCategories: sortedCategories.slice(-3).reverse(),
    };
  }

  async getTrendAnalysis(
    startDate?: string,
    endDate?: string,
    metric: 'income' | 'expense' | 'profit' = 'profit',
  ): Promise<any> {
    // Preparar fechas
    const start = startDate ? new Date(`${startDate}-01`) : new Date();
    start.setFullYear(start.getFullYear() - 1);

    const end = endDate ? new Date(`${endDate}-01`) : new Date();

    // Validar fechas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // Asegurarnos de que la fecha de inicio es anterior a la fecha de fin
    if (start > end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Obtener gastos en el rango de fechas
    const expenses = await this.companyExpenseRepository
      .createQueryBuilder('expense')
      .where('expense.mes >= :start', { start })
      .andWhere('expense.mes <= :end', { end })
      .orderBy('expense.mes', 'ASC')
      .getMany();

    // Obtener todos los resúmenes financieros
    const allSummaries = await this.financialSummaryRepository
      .createQueryBuilder('summary')
      .orderBy('summary.mes', 'ASC')
      .getMany();

    // Organizar datos por mes
    const monthlyData = {};

    // Función para asegurar que cada mes tenga una entrada
    const ensureMonthEntry = (monthKey: string) => {
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          income: 0,
          expense: 0,
          profit: 0,
        };
      }
      return monthKey;
    };

    // Llenar los meses faltantes entre las fechas
    const current = new Date(start);
    while (current <= end) {
      const monthKey = current.toISOString().substring(0, 7);
      ensureMonthEntry(monthKey);
      current.setMonth(current.getMonth() + 1);
    }

    // Procesar datos de gastos
    expenses.forEach(expense => {
      const monthKey = expense.mes.toISOString().substring(0, 7);
      ensureMonthEntry(monthKey);
      monthlyData[monthKey].expense = expense.totalExpenses;
    });

    // Procesar datos de ingresos y utilidades
    allSummaries.forEach(summary => {
      // Verificar si el mes está en el rango
      const [year, month] = summary.mes.split('-');
      const summaryDate = new Date(`${year}-${month}-01`);

      if (summaryDate >= start && summaryDate <= end) {
        ensureMonthEntry(summary.mes);
        monthlyData[summary.mes].income = summary.ingresosTotales || 0;
        monthlyData[summary.mes].profit = summary.utilidadBruta || 0;
      }
    });

    // Recalcular utilidades basadas en ingresos y gastos
    Object.values(monthlyData).forEach((data: any) => {
      if (!data.profit) {
        data.profit = data.income - data.expense;
      }
    });

    // Convertir a array para análisis de tendencias
    const timeSeriesData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: (data as any).income,
        expense: (data as any).expense,
        profit: (data as any).profit,
      }));

    // Calcular tendencias
    const trendData = this.calculateTrend(timeSeriesData, metric);

    return {
      metric,
      period: {
        start: start.toISOString().substring(0, 7),
        end: end.toISOString().substring(0, 7),
        months: timeSeriesData.length,
      },
      summary: {
        totalIncome: timeSeriesData.reduce((sum, data) => sum + data.income, 0),
        totalExpense: timeSeriesData.reduce(
          (sum, data) => sum + data.expense,
          0,
        ),
        totalProfit: timeSeriesData.reduce((sum, data) => sum + data.profit, 0),
        averageIncome: this.calculateAverage(
          timeSeriesData.map(data => data.income),
        ),
        averageExpense: this.calculateAverage(
          timeSeriesData.map(data => data.expense),
        ),
        averageProfit: this.calculateAverage(
          timeSeriesData.map(data => data.profit),
        ),
      },
      trend: trendData,
      timeSeriesData,
    };
  }

  // Funciones auxiliares para cálculos financieros
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  private calculateGrowthRate(data: any): number {
    const months = Object.keys(data).sort();
    if (months.length < 2) return 0;

    const firstMonth = data[months[0]];
    const lastMonth = data[months[months.length - 1]];

    // Calcular tasa de crecimiento para ingresos
    const initialIncome = firstMonth.income || 0;
    const finalIncome = lastMonth.income || 0;

    if (initialIncome === 0) return 0;
    return ((finalIncome - initialIncome) / initialIncome) * 100;
  }

  private calculateExpenseCategories(expenses: CompanyExpense[]): any[] {
    const categoryFields = [
      'salarios',
      'luz',
      'agua',
      'arriendo',
      'internet',
      'salud',
      'otrosCampos',
    ];

    const categoryLabels = [
      'Salarios',
      'Luz',
      'Agua',
      'Arriendo',
      'Internet',
      'Salud',
      'Otros',
    ];

    const categorySums = categoryFields.reduce((acc, field, index) => {
      let total = 0;

      if (field === 'otrosCampos') {
        // Manejo especial para otrosCampos
        total = expenses.reduce((sum, expense) => {
          if (expense.otrosCampos) {
            if (
              typeof expense.otrosCampos === 'object' &&
              expense.otrosCampos !== null
            ) {
              const valuesSum = Object.values(expense.otrosCampos).reduce(
                (s: number, v: unknown) => s + (Number(v) || 0),
                0,
              );
              return sum + Number(valuesSum);
            }
            return sum + (Number(expense.otrosCampos) || 0);
          }
          return sum;
        }, 0);
      } else {
        total = expenses.reduce((sum, expense) => {
          const fieldValue = (expense as any)[field];
          return sum + (Number(fieldValue) || 0);
        }, 0);
      }

      acc[field] = {
        label: categoryLabels[index],
        total,
      };
      return acc;
    }, {});
    const totalExpense = Object.values(categorySums).reduce(
      (sum: number, cat: any) => sum + Number(cat.total),
      0,
    );

    return Object.entries(categorySums)
      .map(([field, data]: [string, any]) => ({
        category: data.label,
        field,
        amount: Number(data.total),
        percentage:
          Number(totalExpense) > 0
            ? (Number(data.total) / Number(totalExpense)) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private calculateQuarterlyData(monthlyData: any[]): any[] {
    const quarterlyData = [
      { quarter: 'Q1', income: 0, expense: 0, profit: 0 },
      { quarter: 'Q2', income: 0, expense: 0, profit: 0 },
      { quarter: 'Q3', income: 0, expense: 0, profit: 0 },
      { quarter: 'Q4', income: 0, expense: 0, profit: 0 },
    ];

    monthlyData.forEach((monthData, index) => {
      const quarterIndex = Math.floor(index / 3);
      if (quarterIndex < 4) {
        quarterlyData[quarterIndex].income += monthData.income;
        quarterlyData[quarterIndex].expense += monthData.expense;
        quarterlyData[quarterIndex].profit += monthData.profit;
      }
    });

    return quarterlyData;
  }

  private calculateTrend(data: any[], metric: string): any {
    // Si no hay suficientes datos, no podemos calcular tendencia
    if (data.length < 2) {
      return { slope: 0, trend: 'stable', growthRate: 0 };
    }

    // Calcular pendiente de la línea de tendencia (método de mínimos cuadrados)
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    data.forEach((point, index) => {
      const x = index;
      const y = point[metric];

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Determinar tendencia basada en la pendiente
    let trend = 'stable';
    if (slope > 0.05 * (sumY / n)) {
      trend = 'increasing';
    } else if (slope < -0.05 * (sumY / n)) {
      trend = 'decreasing';
    }

    // Calcular tasa de crecimiento
    const firstValue = data[0][metric];
    const lastValue = data[data.length - 1][metric];
    let growthRate = 0;

    if (firstValue !== 0) {
      growthRate = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
    }

    return {
      slope,
      trend,
      growthRate,
      firstValue,
      lastValue,
      changeValue: lastValue - firstValue,
    };
  }
}
