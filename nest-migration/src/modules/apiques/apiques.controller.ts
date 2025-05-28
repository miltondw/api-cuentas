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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ApiquesService } from './apiques.service';
import {
  CreateApiqueDto,
  UpdateApiqueDto,
  ApiqueResponseDto,
} from './dto/apique.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Apiques - Lab')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab/apiques')
export class ApiquesController {
  constructor(private readonly apiquesService: ApiquesService) {}

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
    return this.apiquesService.create(createApiqueDto);
  }

  @Get('project/:projectId')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Get all apiques for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: 'number' })
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
  ): Promise<ApiqueResponseDto[]> {
    return this.apiquesService.findAllByProject(projectId);
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
    return this.apiquesService.findOne(projectId, apiqueId);
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
    return this.apiquesService.update(projectId, apiqueId, updateApiqueDto);
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
}
