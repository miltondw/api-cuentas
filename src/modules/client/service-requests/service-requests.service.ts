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
import { SelectedService } from '@/modules/client/service-requests/entities/selected-service.entity';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from './dto/service-request.dto';
import { Service } from '@/modules/services/entities/service.entity';
import { ServiceAdditionalValue } from '@/modules/services/entities/service-additional-value.entity';

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

  /**
   * Crear una nueva solicitud de servicio con servicios y valores adicionales
   */
  async create(createDto: CreateServiceRequestDto): Promise<ServiceRequest> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Validar servicios
      const serviceIds = createDto.selectedServices.map(s => s.serviceId);
      const services = await queryRunner.manager.findByIds(Service, serviceIds);
      if (services.length !== serviceIds.length) {
        throw new BadRequestException(
          'Uno o más servicios seleccionados no existen',
        );
      }
      // Crear solicitud
      const serviceRequest = queryRunner.manager.create(ServiceRequest, {
        name: createDto.name,
        nameProject: createDto.nameProject,
        location: createDto.location,
        identification: createDto.identification,
        phone: createDto.phone,
        email: createDto.email,
        description: createDto.description,
      });
      const savedRequest = await queryRunner.manager.save(serviceRequest);
      // Crear servicios seleccionados y valores adicionales
      for (const sel of createDto.selectedServices) {
        const selected = await queryRunner.manager.save(
          SelectedService,
          queryRunner.manager.create(SelectedService, {
            requestId: savedRequest.id,
            serviceId: sel.serviceId,
            quantity: sel.quantity,
          }),
        );
        if (sel.additionalValues && sel.additionalValues.length > 0) {
          const additionalValues = sel.additionalValues.map(val =>
            queryRunner.manager.create(ServiceAdditionalValue, {
              selectedServiceId: selected.id,
              fieldName: val.fieldName,
              fieldValue: val.fieldValue,
            }),
          );
          await queryRunner.manager.save(
            ServiceAdditionalValue,
            additionalValues,
          );
        }
      }
      await queryRunner.commitTransaction();
      return this.findOne(savedRequest.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtener todas las solicitudes con relaciones
   */
  async findAll(): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository.find({
      relations: [
        'selectedServices',
        'selectedServices.service',
        'selectedServices.additionalValues',
      ],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Obtener una solicitud por ID con relaciones
   */
  async findOne(id: number): Promise<ServiceRequest> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: [
        'selectedServices',
        'selectedServices.service',
        'selectedServices.additionalValues',
      ],
    });
    if (!serviceRequest) {
      throw new NotFoundException(
        `Solicitud de servicio con ID ${id} no encontrada`,
      );
    }
    return serviceRequest;
  }

  /**
   * Actualizar (reemplazar) una solicitud y sincronizar servicios y valores adicionales
   */
  async update(
    id: number,
    updateDto: UpdateServiceRequestDto,
  ): Promise<ServiceRequest> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. Buscar los SelectedService asociados a la solicitud
      const dbSelected = await queryRunner.manager.find(SelectedService, {
        where: { requestId: id },
        relations: ['additionalValues'],
      });
      // 2. Sincronizar cantidad y muestras (campos adicionales)
      for (const sel of updateDto.selectedServices) {
        const dbSel = dbSelected.find(s => s.serviceId === sel.serviceId);
        if (dbSel) {
          // Actualizar cantidad
          if (dbSel.quantity !== sel.quantity) {
            dbSel.quantity = sel.quantity;
            await queryRunner.manager.save(SelectedService, dbSel);
          }
          // Sincronizar muestras (additionalValues)
          const dbValues = dbSel.additionalValues || [];
          const dbValMap = new Map(dbValues.map(v => [v.fieldName, v]));
          const payloadValMap = new Map(
            (sel.additionalValues || []).map(v => [v.fieldName, v]),
          );
          // Eliminar muestras que ya no están
          for (const dbVal of dbValues) {
            if (!payloadValMap.has(dbVal.fieldName)) {
              await queryRunner.manager.delete(ServiceAdditionalValue, {
                id: dbVal.id,
              });
            }
          }
          // Crear o actualizar las que están
          for (const val of sel.additionalValues || []) {
            const dbVal = dbValMap.get(val.fieldName);
            if (!dbVal) {
              // Crear nueva muestra
              await queryRunner.manager.save(
                ServiceAdditionalValue,
                queryRunner.manager.create(ServiceAdditionalValue, {
                  selectedServiceId: dbSel.id,
                  fieldName: val.fieldName,
                  fieldValue: val.fieldValue,
                }),
              );
            } else if (dbVal.fieldValue !== val.fieldValue) {
              // Actualizar valor
              dbVal.fieldValue = val.fieldValue;
              await queryRunner.manager.save(ServiceAdditionalValue, dbVal);
            }
          }
        } else {
          // Servicio nuevo: agregar SelectedService y sus muestras
          const newSelected = await queryRunner.manager.save(
            SelectedService,
            queryRunner.manager.create(SelectedService, {
              requestId: id,
              serviceId: sel.serviceId,
              quantity: sel.quantity,
            }),
          );
          if (sel.additionalValues && sel.additionalValues.length > 0) {
            const additionalValues = sel.additionalValues.map(val =>
              queryRunner.manager.create(ServiceAdditionalValue, {
                selectedServiceId: newSelected.id,
                fieldName: val.fieldName,
                fieldValue: val.fieldValue,
              }),
            );
            await queryRunner.manager.save(
              ServiceAdditionalValue,
              additionalValues,
            );
          }
        }
      }
      // Eliminar servicios que ya no están en el payload
      const payloadServiceIds = updateDto.selectedServices.map(
        s => s.serviceId,
      );
      for (const dbSel of dbSelected) {
        if (!payloadServiceIds.includes(dbSel.serviceId)) {
          // Eliminar sus muestras primero
          await queryRunner.manager.delete(ServiceAdditionalValue, {
            selectedServiceId: dbSel.id,
          });
          // Eliminar el servicio seleccionado
          await queryRunner.manager.delete(SelectedService, { id: dbSel.id });
        }
      }
      // 3. Actualizar información principal del cliente si cambió
      const mainFields = [
        'name',
        'nameProject',
        'location',
        'identification',
        'phone',
        'email',
        'description',
      ];
      const serviceRequest = await queryRunner.manager.findOne(ServiceRequest, {
        where: { id },
      });
      let updated = false;
      for (const field of mainFields) {
        if (
          updateDto[field] !== undefined &&
          serviceRequest[field] !== updateDto[field]
        ) {
          serviceRequest[field] = updateDto[field];
          updated = true;
        }
      }
      if (updated) {
        await queryRunner.manager.save(ServiceRequest, serviceRequest);
      }
      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Eliminar una solicitud y todos sus hijos
   */
  async remove(id: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const serviceRequest = await queryRunner.manager.findOne(ServiceRequest, {
        where: { id },
      });
      if (!serviceRequest)
        throw new NotFoundException(
          `Solicitud de servicio con ID ${id} no encontrada`,
        );
      // Eliminar hijos primero
      const selected = await queryRunner.manager.find(SelectedService, {
        where: { requestId: id },
      });
      for (const sel of selected) {
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(ServiceAdditionalValue)
          .where('selectedServiceId = :id', { id: sel.id })
          .execute();
      }
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(SelectedService)
        .where('requestId = :id', { id })
        .execute();
      await queryRunner.manager.delete(ServiceRequest, { id });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Buscar solicitudes con filtros y paginación
   */
  async findAllWithFilters(
    filters: any,
    pagination: {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'ASC' | 'DESC';
    },
  ): Promise<{
    data: ServiceRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;
    let query = this.serviceRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.selectedServices', 'selectedServices')
      .leftJoinAndSelect('selectedServices.service', 'service')
      .leftJoinAndSelect('service.additionalFields', 'additionalFields')
      .leftJoinAndSelect(
        'selectedServices.additionalValues',
        'additionalValues',
      );
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
    if (filters.startDate && filters.endDate) {
      query = query.andWhere(
        'request.created_at BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(filters.startDate),
          endDate: new Date(filters.endDate),
        },
      );
    }
    if (filters.serviceType) {
      query = query.andWhere('service.name LIKE :serviceType', {
        serviceType: `%${filters.serviceType}%`,
      });
    }
    query.orderBy(`request.${sortBy}`, sortOrder).skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();
    // Mapear para incluir additionalFields en cada servicio seleccionado
    const mappedData = data.map(req => ({
      ...req,
      selectedServices: req.selectedServices.map(ss => ({
        ...ss,
        service: ss.service
          ? {
              ...ss.service,
              additionalFields: Array.isArray(ss.service?.additionalFields)
                ? ss.service.additionalFields
                : [],
            }
          : undefined,
      })),
    }));
    return { data: mappedData, total, page, limit };
  }

  /**
   * Reemplazar toda la solicitud (PUT)
   */
  async replace(
    id: number,
    createDto: CreateServiceRequestDto,
  ): Promise<ServiceRequest> {
    // Simplemente reutiliza el update, pero usando el DTO de creación
    return this.update(id, createDto as any);
  }

  /**
   * Actualizar solo el estado de la solicitud
   */
  async updateStatus(
    id: number,
    status: ServiceRequestStatus,
  ): Promise<ServiceRequest> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id },
    });
    if (!serviceRequest) {
      throw new NotFoundException(
        `Solicitud de servicio con ID ${id} no encontrada`,
      );
    }
    serviceRequest.status = status;
    await this.serviceRequestRepository.save(serviceRequest);
    return this.findOne(id);
  }
}
