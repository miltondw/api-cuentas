import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import {
  CreateCompanyExpenseDto,
  UpdateCompanyExpenseDto,
  CreateFinancialSummaryDto,
  UpdateFinancialSummaryDto,
  YearQueryDto,
} from './dto/financial.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Gastos Empresa')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gastos-mes')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // Company Expenses Endpoints
  @Post('expenses')
  @Roles('admin')
  @ApiOperation({ summary: 'Create company expenses for a month' })
  @ApiResponse({
    status: 201,
    description: 'Company expenses created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - expenses for month already exist',
  })
  createCompanyExpense(@Body() createDto: CreateCompanyExpenseDto) {
    return this.financialService.createCompanyExpense(createDto);
  }

  @Get('expenses')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all company expenses' })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Filter by year (YYYY format)',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Filter by month (MM format)',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    description: 'Filter by minimum total amount',
    type: Number,
  })
  @ApiQuery({
    name: 'maxAmount',
    required: false,
    description: 'Filter by maximum total amount',
    type: Number,
  })
  @ApiQuery({
    name: 'hasCategory',
    required: false,
    description: 'Filter by presence of specific expense category',
    type: Boolean,
  })
  @ApiQuery({
    name: 'categoryName',
    required: false,
    description: 'Filter by expense category name',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Results limit per page',
    type: Number,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by (e.g. mes, total)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (ASC or DESC)',
    enum: ['ASC', 'DESC'],
  })
  findAllCompanyExpenses(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('hasCategory') hasCategory?: boolean,
    @Query('categoryName') categoryName?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const filters = {
      year,
      month,
      minAmount,
      maxAmount,
      hasCategory,
      categoryName,
    };

    const pagination = {
      page: page ? page : 1,
      limit: limit ? limit : 10,
      sortBy: sortBy ? sortBy : 'mes',
      sortOrder: sortOrder ? sortOrder : 'DESC',
    };

    // Si solo se proporciona el año, usar el método existente
    if (
      year &&
      !month &&
      !minAmount &&
      !maxAmount &&
      !hasCategory &&
      !categoryName
    ) {
      return this.financialService.findCompanyExpensesByYear(year);
    }

    return this.financialService.findCompanyExpensesWithFilters(
      filters,
      pagination,
    );
  }

  @Get('expenses/month/:mes')
  @Roles('admin')
  @ApiOperation({ summary: 'Get company expenses by month' })
  @ApiResponse({ status: 200, description: 'Company expenses found' })
  @ApiResponse({ status: 404, description: 'Company expenses not found' })
  findCompanyExpenseByMonth(@Param('mes') mes: string) {
    return this.financialService.findCompanyExpenseByMonth(mes);
  }

  @Get('expenses/month/:mes/total')
  @Roles('admin')
  @ApiOperation({ summary: 'Get total expenses for a month' })
  @ApiResponse({ status: 200, description: 'Total expenses calculated' })
  getTotalExpensesByMonth(@Param('mes') mes: string) {
    return this.financialService.getTotalExpensesByMonth(mes);
  }

  @Patch('expenses/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update company expenses' })
  @ApiResponse({
    status: 200,
    description: 'Company expenses updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Company expenses not found' })
  updateCompanyExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCompanyExpenseDto,
  ) {
    return this.financialService.updateCompanyExpense(id, updateDto);
  }

  @Delete('expenses/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete company expenses' })
  @ApiResponse({
    status: 200,
    description: 'Company expenses deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Company expenses not found' })
  deleteCompanyExpense(@Param('id', ParseIntPipe) id: number) {
    return this.financialService.deleteCompanyExpense(id);
  }
  // Financial Summary Endpoints
  @Post('summaries')
  @Roles('admin')
  @ApiOperation({ summary: 'Create financial summary for a month' })
  @ApiResponse({
    status: 201,
    description: 'Financial summary created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - summary for month already exists',
  })
  createFinancialSummary(@Body() createDto: CreateFinancialSummaryDto) {
    return this.financialService.createFinancialSummary(createDto);
  }

  @Get('summaries')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all financial summaries' })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Filter by year (YYYY format)',
  })
  findAllFinancialSummaries(@Query() query: YearQueryDto) {
    if (query.year) {
      return this.financialService.findFinancialSummariesByYear(query.year);
    }
    return this.financialService.findAllFinancialSummaries();
  }

  @Get('summaries/month/:mes')
  @Roles('admin')
  @ApiOperation({ summary: 'Get financial summary by month' })
  @ApiResponse({ status: 200, description: 'Financial summary found' })
  @ApiResponse({ status: 404, description: 'Financial summary not found' })
  findFinancialSummaryByMonth(@Param('mes') mes: string) {
    return this.financialService.findFinancialSummaryByMonth(mes);
  }

  @Patch('summaries/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update financial summary' })
  @ApiResponse({
    status: 200,
    description: 'Financial summary updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Financial summary not found' })
  updateFinancialSummary(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFinancialSummaryDto,
  ) {
    return this.financialService.updateFinancialSummary(id, updateDto);
  }

  @Delete('summaries/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete financial summary' })
  @ApiResponse({
    status: 200,
    description: 'Financial summary deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Financial summary not found' })
  deleteFinancialSummary(@Param('id', ParseIntPipe) id: number) {
    return this.financialService.deleteFinancialSummary(id);
  }

  // Utility Endpoints
  @Post('summaries/generate/:mes')
  @Roles('admin')
  @ApiOperation({ summary: 'Generate financial summary from existing data' })
  @ApiResponse({
    status: 201,
    description: 'Financial summary generated successfully',
  })
  @ApiResponse({ status: 404, description: 'Required data not found' })
  generateFinancialSummary(@Param('mes') mes: string) {
    return this.financialService.generateFinancialSummaryFromData(mes);
  }

  @Get('overview')
  @Roles('admin')
  @ApiOperation({ summary: 'Get financial overview' })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Filter by year (YYYY format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial overview with totals and monthly breakdown',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string', example: '2024' },
        totalIncome: { type: 'number', example: 96000000 },
        totalExpenses: { type: 'number', example: 72000000 },
        totalProfit: { type: 'number', example: 24000000 },
        averageMargin: { type: 'number', example: 25.5 },
        monthlyData: {
          type: 'array',
          description: 'Array of monthly financial summaries',
        },
      },
    },
  })
  getFinancialOverview(@Query() query: YearQueryDto) {
    return this.financialService.getFinancialOverview(query.year);
  }

  @Get('summary')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all financial summary entries' })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Filter by year (YYYY format)',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Filter by month (MM format)',
  })
  @ApiQuery({
    name: 'minIncome',
    required: false,
    description: 'Filter by minimum income amount',
    type: Number,
  })
  @ApiQuery({
    name: 'maxIncome',
    required: false,
    description: 'Filter by maximum income amount',
    type: Number,
  })
  @ApiQuery({
    name: 'minExpense',
    required: false,
    description: 'Filter by minimum expense amount',
    type: Number,
  })
  @ApiQuery({
    name: 'maxExpense',
    required: false,
    description: 'Filter by maximum expense amount',
    type: Number,
  })
  @ApiQuery({
    name: 'profitRange',
    required: false,
    description: 'Filter by profit range (e.g. "10000-20000")',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Results limit per page',
    type: Number,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by (e.g. fecha, ingresos, gastos, utilidad)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (ASC or DESC)',
    enum: ['ASC', 'DESC'],
  })
  findAllFinancialSummary(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('minIncome') minIncome?: number,
    @Query('maxIncome') maxIncome?: number,
    @Query('minExpense') minExpense?: number,
    @Query('maxExpense') maxExpense?: number,
    @Query('profitRange') profitRange?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const filters = {
      year,
      month,
      minIncome,
      maxIncome,
      minExpense,
      maxExpense,
      profitRange,
    };

    const pagination = {
      page: page ? page : 1,
      limit: limit ? limit : 10,
      sortBy: sortBy ? sortBy : 'fecha',
      sortOrder: sortOrder ? sortOrder : 'DESC',
    }; // Si solo se proporciona el año, usar el método existente
    if (
      year &&
      !month &&
      !minIncome &&
      !maxIncome &&
      !minExpense &&
      !maxExpense &&
      !profitRange
    ) {
      return this.financialService.findFinancialSummariesByYear(year);
    }

    return this.financialService.findFinancialSummaryWithFilters(
      filters,
      pagination,
    );
  }

  @Get('analytics/monthly-comparison')
  @Roles('admin')
  @ApiOperation({ summary: 'Compare financial data between months' })
  @ApiQuery({
    name: 'startYear',
    required: true,
    description: 'Start year (YYYY format)',
  })
  @ApiQuery({
    name: 'startMonth',
    required: true,
    description: 'Start month (MM format)',
  })
  @ApiQuery({
    name: 'endYear',
    required: true,
    description: 'End year (YYYY format)',
  })
  @ApiQuery({
    name: 'endMonth',
    required: true,
    description: 'End month (MM format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly comparison data retrieved successfully',
  })
  getMonthlyComparison(
    @Query('startYear') startYear: string,
    @Query('startMonth') startMonth: string,
    @Query('endYear') endYear: string,
    @Query('endMonth') endMonth: string,
  ) {
    return this.financialService.getMonthlyComparison(
      startYear,
      startMonth,
      endYear,
      endMonth,
    );
  }

  @Get('analytics/yearly-summary')
  @Roles('admin')
  @ApiOperation({ summary: 'Get yearly financial summary' })
  @ApiQuery({
    name: 'year',
    required: true,
    description: 'Year to analyze (YYYY format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Yearly summary data retrieved successfully',
  })
  getYearlySummary(@Query('year') year: string) {
    return this.financialService.getYearlySummary(year);
  }

  @Get('analytics/expense-distribution')
  @Roles('admin')
  @ApiOperation({ summary: 'Get expense distribution analysis' })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Filter by year (YYYY format)',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Filter by month (MM format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Expense distribution data retrieved successfully',
  })
  getExpenseDistribution(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.financialService.getExpenseDistribution(year, month);
  }

  @Get('analytics/trend-analysis')
  @Roles('admin')
  @ApiOperation({ summary: 'Get financial trend analysis' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (YYYY-MM format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM format)',
  })
  @ApiQuery({
    name: 'metric',
    required: false,
    description: 'Metric to analyze (income, expense, profit)',
    enum: ['income', 'expense', 'profit'],
  })
  @ApiResponse({
    status: 200,
    description: 'Trend analysis data retrieved successfully',
  })
  getTrendAnalysis(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('metric') metric: 'income' | 'expense' | 'profit' = 'profit',
  ) {
    return this.financialService.getTrendAnalysis(startDate, endDate, metric);
  }
}
