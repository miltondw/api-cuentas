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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Perfiles - Lab')
@ApiBearerAuth()
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
  @Roles('admin', 'ingeniero', 'tecnico')
  @ApiOperation({ summary: 'Obtener todos los perfiles' })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filtrar por ID del proyecto',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfiles obtenida exitosamente',
  })
  findAll(@Query('projectId') projectId?: string) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.profilesService.findAll(projectIdNum);
  }

  @Get('project/:projectId')
  @Roles('admin', 'ingeniero', 'tecnico')
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
  @Roles('admin', 'ingeniero', 'tecnico')
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
  @Roles('admin', 'ingeniero', 'tecnico')
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
  @Roles('admin', 'ingeniero')
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

  // Blow-specific endpoints
  @Post(':profileId/blows')
  @Roles('admin', 'ingeniero')
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
  @Roles('admin', 'ingeniero', 'tecnico')
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
  @Roles('admin', 'ingeniero')
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
  @Roles('admin', 'ingeniero')
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
