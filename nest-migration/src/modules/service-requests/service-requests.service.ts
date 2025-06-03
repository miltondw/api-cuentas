import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { SelectedService } from './entities/selected-service.entity';
import { Service } from '../services/entities/service.entity';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from './dto/service-request.dto';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(SelectedService)
    private selectedServiceRepository: Repository<SelectedService>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
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

      const savedRequest = await queryRunner.manager.save(serviceRequest);

      // Crear los servicios seleccionados
      const selectedServices = createServiceRequestDto.selectedServices.map(
        selectedService =>
          queryRunner.manager.create(SelectedService, {
            requestId: savedRequest.id,
            serviceId: selectedService.serviceId,
            quantity: selectedService.quantity,
          }),
      );

      await queryRunner.manager.save(selectedServices);
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
      ],
      order: { created_at: 'DESC' },
    });
  }
}
