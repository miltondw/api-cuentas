import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { LabProjectsService } from './lab-projects.service';
import {
  LabProjectsQueryDto,
  LabProjectsResponseDto,
} from './dto/lab-projects.dto';

@ApiTags('Lab Projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab/projects')
export class LabProjectsController {
  constructor(private readonly labProjectsService: LabProjectsService) {}

  @Get()
  @Roles('admin', 'lab')
  @ApiOperation({
    summary: 'Get all projects with lab statistics',
    description:
      'Returns all projects with apiques and profiles count, with advanced filtering options for lab dashboard',
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
    description: 'Field to sort by',
    enum: [
      'id',
      'fecha',
      'nombreProyecto',
      'solicitante',
      'estado',
      'total_apiques',
      'total_profiles',
    ],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiQuery({
    name: 'nombreProyecto',
    required: false,
    description: 'Filter by project name (partial match)',
  })
  @ApiQuery({
    name: 'solicitante',
    required: false,
    description: 'Filter by applicant name (partial match)',
  })
  @ApiQuery({
    name: 'obrero',
    required: false,
    description: 'Filter by worker name (partial match)',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filter by project status',
    enum: ['activo', 'completado', 'cancelado', 'pausado'],
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
    name: 'hasApiques',
    required: false,
    description: 'Filter projects with/without apiques',
    type: Boolean,
  })
  @ApiQuery({
    name: 'hasProfiles',
    required: false,
    description: 'Filter projects with/without profiles',
    type: Boolean,
  })
  @ApiQuery({
    name: 'minApiques',
    required: false,
    description: 'Minimum number of apiques',
    type: Number,
  })
  @ApiQuery({
    name: 'maxApiques',
    required: false,
    description: 'Maximum number of apiques',
    type: Number,
  })
  @ApiQuery({
    name: 'minProfiles',
    required: false,
    description: 'Minimum number of profiles',
    type: Number,
  })
  @ApiQuery({
    name: 'maxProfiles',
    required: false,
    description: 'Maximum number of profiles',
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Global search across project name, applicant, and worker',
  })
  @ApiResponse({
    status: 200,
    description: 'Lab projects retrieved successfully',
    type: LabProjectsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getLabProjects(
    @Query() query: LabProjectsQueryDto,
  ): Promise<LabProjectsResponseDto> {
    return this.labProjectsService.getLabProjects(query);
  }
}
