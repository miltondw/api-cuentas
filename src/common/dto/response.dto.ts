import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T = any> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data', required: false })
  data?: T;

  @ApiProperty({ description: 'Error details', required: false })
  error?: any;

  @ApiProperty({ description: 'Request timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Request path' })
  path: string;

  constructor(
    success: boolean,
    statusCode: number,
    message: string,
    path: string,
    data?: T,
    error?: any,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}

export class SuccessResponseDto<T = any> extends BaseResponseDto<T> {
  constructor(data: T, message = 'Success', statusCode = 200, path = '') {
    super(true, statusCode, message, path, data);
  }
}

export class ErrorResponseDto extends BaseResponseDto {
  constructor(error: any, message = 'Error', statusCode = 500, path = '') {
    super(false, statusCode, message, path, null, error);
  }
}

export class ResponseDto<T = any> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data', required: false })
  data?: T;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
}

export class PaginatedResponseDto<T = any> extends SuccessResponseDto<T[]> {
  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Success',
    path = '',
  ) {
    super(data, message, 200, path);
    this.meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }
}
