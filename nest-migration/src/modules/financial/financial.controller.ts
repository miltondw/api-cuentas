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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Gastos Empresa')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gastos-mes')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // Company Expenses Endpoints  @Post('expenses')
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
  findAllCompanyExpenses(@Query() query: YearQueryDto) {
    if (query.year) {
      return this.financialService.findCompanyExpensesByYear(query.year);
    }
    return this.financialService.findAllCompanyExpenses();
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
}
