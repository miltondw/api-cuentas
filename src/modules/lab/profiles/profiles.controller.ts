import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import {
  CreateProfileDto,
  UpdateProfileDto,
  CreateBlowDto,
  UpdateBlowDto,
} from './dto/profile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Perfiles - Lab')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab/profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Crear un nuevo perfil de sondeo' })
  @ApiResponse({
    status: 201,
    description: 'Perfil creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'El número de sondeo ya existe para este proyecto',
  })
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(createProfileDto);
  }
  @Get()
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Obtener todos los perfiles' })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filtrar por ID del proyecto',
  })
  @ApiQuery({
    name: 'soundingNumber',
    required: false,
    description: 'Filtrar por número de sondeo',
  })
  @ApiQuery({
    name: 'startDepth',
    required: false,
    description: 'Filtrar por profundidad mínima',
    type: Number,
  })
  @ApiQuery({
    name: 'endDepth',
    required: false,
    description: 'Filtrar por profundidad máxima',
    type: Number,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Fecha de inicio para filtrar (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Fecha de fin para filtrar (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'hasSPT',
    required: false,
    description: 'Filtrar por perfiles que tienen pruebas SPT',
    type: Boolean,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página para paginación',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de resultados por página',
    type: Number,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Campo por el cual ordenar',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Orden de clasificación (ASC o DESC)',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfiles obtenida exitosamente',
  })
  findAll(
    @Query('projectId') projectId?: string,
    @Query('soundingNumber') soundingNumber?: string,
    @Query('startDepth') startDepth?: number,
    @Query('endDepth') endDepth?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('hasSPT') hasSPT?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const filters = {
      projectId: projectId ? parseInt(projectId, 10) : undefined,
      soundingNumber: soundingNumber ? parseInt(soundingNumber, 10) : undefined,
      startDepth,
      endDepth,
      startDate,
      endDate,
      hasSPT,
    };

    const pagination = {
      page: page ? page : 1,
      limit: limit ? limit : 10,
      sortBy: sortBy ? sortBy : 'created_at',
      sortOrder: sortOrder ? sortOrder : 'DESC',
    };

    return this.profilesService.findAllWithFilters(filters, pagination);
  }
  @Get('project/:projectId')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Obtener perfiles por proyecto' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto' })
  @ApiResponse({
    status: 200,
    description: 'Perfiles del proyecto obtenidos exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  findByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.profilesService.findByProject(projectId);
  }
  @Get('project/:projectId/sounding/:soundingNumber')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Obtener perfil por número de sondeo' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto' })
  @ApiParam({ name: 'soundingNumber', description: 'Número de sondeo' })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  findBySounding(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('soundingNumber') soundingNumber: string,
  ) {
    return this.profilesService.findBySounding(projectId, soundingNumber);
  }
  @Get(':id')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Obtener un perfil por ID' })
  @ApiParam({ name: 'id', description: 'ID del perfil' })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.findOne(id);
  }
  @Patch(':id')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Actualizar un perfil' })
  @ApiParam({ name: 'id', description: 'ID del perfil' })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El número de sondeo ya existe para este proyecto',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un perfil' })
  @ApiParam({ name: 'id', description: 'ID del perfil' })
  @ApiResponse({
    status: 204,
    description: 'Perfil eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.remove(id);
  }

  // Blow-specific endpoints  @Post(':profileId/blows')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Agregar golpeo a un perfil' })
  @ApiParam({ name: 'profileId', description: 'ID del perfil' })
  @ApiResponse({
    status: 201,
    description: 'Golpeo agregado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  addBlow(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Body() createBlowDto: CreateBlowDto,
  ) {
    return this.profilesService.addBlow(profileId, createBlowDto);
  }
  @Get(':profileId/blows')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Obtener golpeos de un perfil' })
  @ApiParam({ name: 'profileId', description: 'ID del perfil' })
  @ApiResponse({
    status: 200,
    description: 'Golpeos obtenidos exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  getBlowsByProfile(@Param('profileId', ParseIntPipe) profileId: number) {
    return this.profilesService.getBlowsByProfile(profileId);
  }
  @Patch('blows/:blowId')
  @Roles('admin', 'lab')
  @ApiOperation({ summary: 'Actualizar un golpeo' })
  @ApiParam({ name: 'blowId', description: 'ID del golpeo' })
  @ApiResponse({
    status: 200,
    description: 'Golpeo actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Golpeo no encontrado',
  })
  updateBlow(
    @Param('blowId', ParseIntPipe) blowId: number,
    @Body() updateBlowDto: UpdateBlowDto,
  ) {
    return this.profilesService.updateBlow(blowId, updateBlowDto);
  }
  @Delete('blows/:blowId')
  @Roles('admin', 'lab')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un golpeo' })
  @ApiParam({ name: 'blowId', description: 'ID del golpeo' })
  @ApiResponse({
    status: 204,
    description: 'Golpeo eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Golpeo no encontrado',
  })
  removeBlow(@Param('blowId', ParseIntPipe) blowId: number) {
    return this.profilesService.removeBlow(blowId);
  }
}
