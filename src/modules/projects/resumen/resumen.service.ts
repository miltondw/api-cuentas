import { Injectable } from '@nestjs/common';

@Injectable()
export class ResumenService {
  async getAllResumenFinanciero(page: number = 1, limit: number = 10) {
    // TODO: Implementar lógica de obtener todos los resúmenes financieros
    // Por ahora retorna una respuesta mock
    return {
      success: true,
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
      },
      message: 'Funcionalidad en desarrollo - migrada desde Express',
    };
  }

  async getResumenFinancieroPorFecha(fecha: string) {
    // TODO: Implementar lógica de obtener resumen por fecha
    // Por ahora retorna una respuesta mock
    return {
      success: true,
      data: null,
      message: `Funcionalidad en desarrollo - búsqueda por fecha: ${fecha}`,
    };
  }
}
