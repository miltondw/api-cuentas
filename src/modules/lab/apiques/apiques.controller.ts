import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiquesService } from './apiques.service';
import {
  CreateApiqueDto,
  UpdateApiqueDto,
  ApiqueResponseDto,
} from './dto/apique.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Apiques - Lab')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab/apiques')
export class ApiquesController {
  constructor(private readonly apiquesService: ApiquesService) {}

  @Get()
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'List all apiques (general endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'Information about apiques endpoints',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(): Promise<{
    message: string;
    availableEndpoints: string[];
    totalApiques?: number;
  }> {
    // En lugar de devolver todos los apiques (que puede ser mucho),
    // devolvemos información útil sobre los endpoints disponibles
    return {
      message: 'Use specific endpoints to get apiques by project',
      availableEndpoints: [
        'GET /lab/apiques/project/:projectId - Get apiques for specific project',
        'GET /lab/apiques/:projectId/:apiqueId - Get specific apique',
        'POST /lab/apiques - Create new apique',
        'PUT /lab/apiques/:projectId/:apiqueId - Update apique',
        'DELETE /lab/apiques/:projectId/:apiqueId - Delete apique',
      ],
    };
  }

  @Post()
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Create a new apique' })
  @ApiResponse({
    status: 201,
    description: 'Apique created successfully',
    type: ApiqueResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() createApiqueDto: CreateApiqueDto,
  ): Promise<ApiqueResponseDto> {
    const apique = await this.apiquesService.create(createApiqueDto);
    return this.transformToResponseDto(apique);
  }

  @Get('project/:projectId')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Get all apiques for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: 'number' })
  @ApiQuery({
    name: 'apiqueNumber',
    required: false,
    description: 'Filter by apique number',
  })
  @ApiQuery({
    name: 'startDepth',
    required: false,
    description: 'Filter by minimum depth',
    type: Number,
  })
  @ApiQuery({
    name: 'endDepth',
    required: false,
    description: 'Filter by maximum depth',
    type: Number,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by end date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location',
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
    description: 'Field to sort by (e.g. apiqueNumber, depth, date)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (ASC or DESC)',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: 200,
    description: 'Apiques found',
    type: [ApiqueResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('apiqueNumber') apiqueNumber?: string,
    @Query('startDepth') startDepth?: number,
    @Query('endDepth') endDepth?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('location') location?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<{
    data: ApiqueResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filters = {
      apiqueNumber: apiqueNumber ? parseInt(apiqueNumber, 10) : undefined,
      startDepth,
      endDepth,
      startDate,
      endDate,
      location,
    };

    const pagination = {
      page: page ? page : 1,
      limit: limit ? limit : 10,
      sortBy: sortBy ? sortBy : 'apiqueNumber',
      sortOrder: sortOrder ? sortOrder : 'ASC',
    };

    const result = await this.apiquesService.findAllByProjectWithFilters(
      projectId,
      filters,
      pagination,
    );

    return {
      data: result.data.map(apique => this.transformToResponseDto(apique)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':projectId/:apiqueId')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Get apique by project ID and apique ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: 'number' })
  @ApiParam({ name: 'apiqueId', description: 'Apique ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Apique found',
    type: ApiqueResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Apique not found' })
  async findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('apiqueId', ParseIntPipe) apiqueId: number,
  ): Promise<ApiqueResponseDto> {
    const apique = await this.apiquesService.findOne(projectId, apiqueId);
    return this.transformToResponseDto(apique);
  }

  @Put(':projectId/:apiqueId')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Update apique' })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: 'number' })
  @ApiParam({ name: 'apiqueId', description: 'Apique ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Apique updated successfully',
    type: ApiqueResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Apique not found' })
  async update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('apiqueId', ParseIntPipe) apiqueId: number,
    @Body() updateApiqueDto: UpdateApiqueDto,
  ): Promise<ApiqueResponseDto> {
    const apique = await this.apiquesService.update(
      projectId,
      apiqueId,
      updateApiqueDto,
    );
    return this.transformToResponseDto(apique);
  }

  @Delete(':projectId/:apiqueId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete apique' })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: 'number' })
  @ApiParam({ name: 'apiqueId', description: 'Apique ID', type: 'number' })
  @ApiResponse({ status: 204, description: 'Apique deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Apique not found' })
  async remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('apiqueId', ParseIntPipe) apiqueId: number,
  ): Promise<void> {
    return this.apiquesService.remove(projectId, apiqueId);
  }

  @Get('project/:projectId/statistics')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Get apiques statistics for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getStatistics(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<any> {
    return this.apiquesService.getApiqueStatistics(projectId);
  }

  // Helper method to transform entity to response DTO
  private transformToResponseDto(apique: any): ApiqueResponseDto {
    return {
      apique_id: apique.id,
      proyecto_id: apique.proyectoId,
      apique: apique.apique,
      location: apique.location,
      depth: apique.depth,
      date: apique.date,
      cbr_unaltered: apique.cbr_unaltered,
      depth_tomo: apique.depth_tomo,
      molde: apique.molde,
      layers: apique.layers || [],
      created_at: apique.created_at,
      updatedAt: apique.updatedAt,
    };
  }
}
