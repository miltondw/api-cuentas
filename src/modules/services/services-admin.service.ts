import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Service } from '@/modules/services/entities/service.entity';
import { ServiceCategory } from '@/modules/services/entities/service-category.entity';
import { ServiceAdditionalField } from '@/modules/services/entities/service-additional-field.entity';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceAdditionalFieldDto,
  UpdateServiceAdditionalFieldDto,
  CreateServiceWithFieldsDto,
} from './dto/admin-services.dto';

@Injectable()
export class ServicesAdminService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private serviceCategoryRepository: Repository<ServiceCategory>,
    @InjectRepository(ServiceAdditionalField)
    private serviceAdditionalFieldRepository: Repository<ServiceAdditionalField>,
    private dataSource: DataSource,
  ) {}

  // ===== CATEGORÍAS =====
  async createCategory(
    createCategoryDto: CreateServiceCategoryDto,
  ): Promise<ServiceCategory> {
    // Verificar si ya existe una categoría con el mismo código
    const existingCategory = await this.serviceCategoryRepository.findOne({
      where: { code: createCategoryDto.code },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Ya existe una categoría con el código ${createCategoryDto.code}`,
      );
    }

    const category = this.serviceCategoryRepository.create(createCategoryDto);
    return this.serviceCategoryRepository.save(category);
  }

  async findAllCategories(): Promise<ServiceCategory[]> {
    return this.serviceCategoryRepository.find({
      relations: ['services'],
      order: { id: 'ASC' },
    });
  }

  async findCategoryById(id: number): Promise<ServiceCategory> {
    const category = await this.serviceCategoryRepository.findOne({
      where: { id },
      relations: ['services'],
    });

    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    return category;
  }

  async updateCategory(
    id: number,
    updateCategoryDto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategory> {
    const category = await this.findCategoryById(id);

    // Si se está actualizando el código, verificar que no exista
    if (updateCategoryDto.code && updateCategoryDto.code !== category.code) {
      const existingCategory = await this.serviceCategoryRepository.findOne({
        where: { code: updateCategoryDto.code },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Ya existe una categoría con el código ${updateCategoryDto.code}`,
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.serviceCategoryRepository.save(category);
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.findCategoryById(id);

    // Verificar si tiene servicios asociados
    if (category.services && category.services.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar la categoría porque tiene servicios asociados',
      );
    }

    await this.serviceCategoryRepository.remove(category);
  }

  // ===== SERVICIOS =====
  async createService(createServiceDto: CreateServiceDto): Promise<Service> {
    // Verificar si la categoría existe
    const category = await this.findCategoryById(createServiceDto.categoryId);

    // Verificar si ya existe un servicio con el mismo código
    const existingService = await this.serviceRepository.findOne({
      where: { code: createServiceDto.code },
    });

    if (existingService) {
      throw new ConflictException(
        `Ya existe un servicio con el código ${createServiceDto.code}`,
      );
    }

    const service = this.serviceRepository.create(createServiceDto);
    return this.serviceRepository.save(service);
  }

  async createServiceWithFields(
    createServiceDto: CreateServiceWithFieldsDto,
  ): Promise<Service> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear el servicio
      const service = await this.createService(createServiceDto);

      // Si hay campos adicionales, crearlos
      if (
        createServiceDto.additionalFields &&
        createServiceDto.additionalFields.length > 0
      ) {
        for (const fieldDto of createServiceDto.additionalFields) {
          await this.addAdditionalField(service.id, fieldDto);
        }
      }

      await queryRunner.commitTransaction();

      // Retornar el servicio con los campos adicionales
      return this.findServiceById(service.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllServices(): Promise<Service[]> {
    return this.serviceRepository.find({
      relations: ['category', 'additionalFields'],
      order: {
        category: { id: 'ASC' },
        id: 'ASC',
        additionalFields: { displayOrder: 'ASC' },
      },
    });
  }

  async findServiceById(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['category', 'additionalFields'],
      order: {
        additionalFields: { displayOrder: 'ASC' },
      },
    });

    if (!service) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }

    return service;
  }

  async updateService(
    id: number,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.findServiceById(id);

    // Si se está actualizando la categoría, verificar que exista
    if (updateServiceDto.categoryId) {
      await this.findCategoryById(updateServiceDto.categoryId);
    }

    // Si se está actualizando el código, verificar que no exista
    if (updateServiceDto.code && updateServiceDto.code !== service.code) {
      const existingService = await this.serviceRepository.findOne({
        where: { code: updateServiceDto.code },
      });

      if (existingService) {
        throw new ConflictException(
          `Ya existe un servicio con el código ${updateServiceDto.code}`,
        );
      }
    }

    Object.assign(service, updateServiceDto);
    return this.serviceRepository.save(service);
  }

  async deleteService(id: number): Promise<void> {
    const service = await this.findServiceById(id);
    await this.serviceRepository.remove(service);
  }

  // ===== CAMPOS ADICIONALES =====
  async addAdditionalField(
    serviceId: number,
    createFieldDto: CreateServiceAdditionalFieldDto,
  ): Promise<ServiceAdditionalField> {
    // Verificar si el servicio existe
    await this.findServiceById(serviceId);

    // Verificar si ya existe un campo con el mismo nombre para este servicio
    const existingField = await this.serviceAdditionalFieldRepository.findOne({
      where: {
        serviceId,
        fieldName: createFieldDto.fieldName,
      },
    });

    if (existingField) {
      throw new ConflictException(
        `Ya existe un campo con el nombre ${createFieldDto.fieldName} para este servicio`,
      );
    }

    // Si no se especifica displayOrder, usar el siguiente número disponible
    if (createFieldDto.displayOrder === undefined) {
      const maxOrder = await this.serviceAdditionalFieldRepository
        .createQueryBuilder('field')
        .where('field.serviceId = :serviceId', { serviceId })
        .select('MAX(field.displayOrder)', 'maxOrder')
        .getRawOne();

      createFieldDto.displayOrder = (maxOrder.maxOrder || 0) + 1;
    }

    const field = this.serviceAdditionalFieldRepository.create({
      ...createFieldDto,
      serviceId,
    });

    return this.serviceAdditionalFieldRepository.save(field);
  }

  async getAdditionalFieldsByService(
    serviceId: number,
  ): Promise<ServiceAdditionalField[]> {
    // Verificar si el servicio existe
    await this.findServiceById(serviceId);

    return this.serviceAdditionalFieldRepository.find({
      where: { serviceId },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
  }

  async getAdditionalFieldById(id: number): Promise<ServiceAdditionalField> {
    const field = await this.serviceAdditionalFieldRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!field) {
      throw new NotFoundException(`Campo adicional con ID ${id} no encontrado`);
    }

    return field;
  }

  async updateAdditionalField(
    id: number,
    updateFieldDto: UpdateServiceAdditionalFieldDto,
  ): Promise<ServiceAdditionalField> {
    const field = await this.getAdditionalFieldById(id);

    // Si se está actualizando el nombre del campo, verificar que no exista
    if (
      updateFieldDto.fieldName &&
      updateFieldDto.fieldName !== field.fieldName
    ) {
      const existingField = await this.serviceAdditionalFieldRepository.findOne(
        {
          where: {
            serviceId: field.serviceId,
            fieldName: updateFieldDto.fieldName,
          },
        },
      );

      if (existingField) {
        throw new ConflictException(
          `Ya existe un campo con el nombre ${updateFieldDto.fieldName} para este servicio`,
        );
      }
    }

    Object.assign(field, updateFieldDto);
    return this.serviceAdditionalFieldRepository.save(field);
  }

  async deleteAdditionalField(id: number): Promise<void> {
    const field = await this.getAdditionalFieldById(id);
    await this.serviceAdditionalFieldRepository.remove(field);
  }
}
