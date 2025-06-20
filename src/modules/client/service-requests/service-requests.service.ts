import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from './entities/service-request.entity';
import { SelectedService } from './entities/selected-service.entity';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from './dto/service-request.dto';
import { Service } from '@/modules/services/entities/service.entity';
import { ServiceAdditionalValue } from '@/modules/services/entities/service-additional-value.entity';

// Definir los tipos para los filtros y la paginación
interface ServiceRequestFilters {
  status?: ServiceRequestStatus;
  name?: string;
  nameProject?: string;
  location?: string;
  email?: string;
  startDate?: string;
  endDate?: string;
  serviceType?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(SelectedService)
    private selectedServiceRepository: Repository<SelectedService>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ServiceAdditionalValue)
    private serviceAdditionalValueRepository: Repository<ServiceAdditionalValue>,
    private dataSource: DataSource,
  ) {}

  async create(
    createServiceRequestDto: CreateServiceRequestDto,
  ): Promise<ServiceRequest> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que todos los servicios existen
      const serviceIds = createServiceRequestDto.selectedServices.map(
        s => s.serviceId,
      );
      const services = await queryRunner.manager.findByIds(Service, serviceIds);

      if (services.length !== serviceIds.length) {
        throw new BadRequestException(
          'Uno o más servicios seleccionados no existen',
        );
      }

      // Crear la solicitud de servicio
      const serviceRequest = queryRunner.manager.create(ServiceRequest, {
        name: createServiceRequestDto.name,
        nameProject: createServiceRequestDto.nameProject,
        location: createServiceRequestDto.location,
        identification: createServiceRequestDto.identification,
        phone: createServiceRequestDto.phone,
        email: createServiceRequestDto.email,
        description: createServiceRequestDto.description,
      });

      const savedRequest = await queryRunner.manager.save(serviceRequest); // Crear los servicios seleccionados
      const selectedServices = createServiceRequestDto.selectedServices.map(
        selectedService =>
          queryRunner.manager.create(SelectedService, {
            requestId: savedRequest.id,
            serviceId: selectedService.serviceId,
            quantity: selectedService.quantity,
          }),
      );

      const savedSelectedServices =
        await queryRunner.manager.save(selectedServices);

      // Crear los valores adicionales si existen
      for (
        let i = 0;
        i < createServiceRequestDto.selectedServices.length;
        i++
      ) {
        const selectedServiceDto = createServiceRequestDto.selectedServices[i];
        const savedSelectedService = savedSelectedServices[i];
        if (
          selectedServiceDto.additionalValues &&
          selectedServiceDto.additionalValues.length > 0
        ) {
          const additionalValues = selectedServiceDto.additionalValues.map(
            valueDto =>
              queryRunner.manager.create(ServiceAdditionalValue, {
                selectedServiceId: savedSelectedService.id,
                fieldName: valueDto.fieldName,
                fieldValue: valueDto.fieldValue,
              }),
          );
          await queryRunner.manager.save(
            ServiceAdditionalValue,
            additionalValues,
          );
        }
      }
      await queryRunner.commitTransaction();

      // Retornar la solicitud con las relaciones
      return this.findOne(savedRequest.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async findAll(): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository.find({
      relations: [
        'selectedServices',
        'selectedServices.service',
        'selectedServices.service.category',
        'selectedServices.service.additionalFields',
        'selectedServices.additionalValues',
        'selectedServices.serviceInstances',
        'selectedServices.serviceInstances.serviceInstanceValues',
      ],
      order: { created_at: 'DESC' },
    });
  }
  async findOne(id: number): Promise<ServiceRequest> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: [
        'selectedServices',
        'selectedServices.service',
        'selectedServices.service.category',
        'selectedServices.service.additionalFields',
        'selectedServices.additionalValues',
        'selectedServices.serviceInstances',
        'selectedServices.serviceInstances.serviceInstanceValues',
      ],
    });

    if (!serviceRequest) {
      throw new NotFoundException(
        `Solicitud de servicio con ID ${id} no encontrada`,
      );
    }

    return serviceRequest;
  }

  async update(
    id: number,
    updateServiceRequestDto: UpdateServiceRequestDto,
  ): Promise<ServiceRequest> {
    const serviceRequest = await this.findOne(id);

    Object.assign(serviceRequest, updateServiceRequestDto);
    await this.serviceRequestRepository.save(serviceRequest);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const serviceRequest = await this.findOne(id);
    await this.serviceRequestRepository.remove(serviceRequest);
  }
  async findByStatus(status: string): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository.find({
      where: { status: status as any },
      relations: [
        'selectedServices',
        'selectedServices.service',
        'selectedServices.service.category',
        'selectedServices.service.additionalFields',
        'selectedServices.additionalValues',
        'selectedServices.additionalValues.field',
        'selectedServices.serviceInstances',
        'selectedServices.serviceInstances.serviceInstanceValues',
      ],
      order: { created_at: 'DESC' },
    });
  }
  async findAllWithFilters(
    filters: ServiceRequestFilters,
    pagination: PaginationParams,
  ): Promise<{
    data: ServiceRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit; // Crear query con todas las relaciones necesarias para información adicional
    let query = this.serviceRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.selectedServices', 'selectedServices')
      .leftJoinAndSelect('selectedServices.service', 'service')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.additionalFields', 'additionalFields')
      .leftJoinAndSelect(
        'selectedServices.additionalValues',
        'additionalValues',
      )
      .leftJoinAndSelect(
        'selectedServices.serviceInstances',
        'serviceInstances',
      )
      .leftJoinAndSelect(
        'serviceInstances.serviceInstanceValues',
        'serviceInstanceValues',
      );

    // Aplicar filtros directamente con el query builder
    if (filters.status) {
      query = query.andWhere('request.status = :status', {
        status: filters.status,
      });
    }

    if (filters.name) {
      query = query.andWhere('request.name LIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters.nameProject) {
      query = query.andWhere('request.nameProject LIKE :nameProject', {
        nameProject: `%${filters.nameProject}%`,
      });
    }

    if (filters.location) {
      query = query.andWhere('request.location LIKE :location', {
        location: `%${filters.location}%`,
      });
    }

    if (filters.email) {
      query = query.andWhere('request.email LIKE :email', {
        email: `%${filters.email}%`,
      });
    }

    // Filtro de fechas
    if (filters.startDate && filters.endDate) {
      query = query.andWhere(
        'request.created_at BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(filters.startDate),
          endDate: new Date(filters.endDate),
        },
      );
    }

    // Filtrar por tipo de servicio si está especificado
    if (filters.serviceType) {
      query = query.andWhere('service.name LIKE :serviceType', {
        serviceType: `%${filters.serviceType}%`,
      });
    }

    // Aplicar ordenamiento, paginación y obtener resultados
    query.orderBy(`request.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
