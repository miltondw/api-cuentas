import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { ServiceCategory } from './entities/service-category.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private serviceCategoryRepository: Repository<ServiceCategory>,
  ) {}

  async findAllServices(): Promise<Service[]> {
    return this.serviceRepository.find({
      relations: ['category'],
      order: { category: { id: 'ASC' }, id: 'ASC' },
    });
  }

  async findAllCategories(): Promise<ServiceCategory[]> {
    return this.serviceCategoryRepository.find({
      relations: ['services'],
      order: { id: 'ASC' },
    });
  }

  async findServicesByCategory(categoryId: number): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { categoryId },
      relations: ['category'],
      order: { id: 'ASC' },
    });
  }

  async findServiceById(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!service) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }

    return service;
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
}
