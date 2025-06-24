import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  SuccessResponseDto,
  PaginatedResponseDto,
} from '@common/dto/response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    return next.handle().pipe(
      map(data => {
        // If data is already a response DTO, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Check if it's paginated data
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          return new PaginatedResponseDto(
            data.data,
            data.meta.page,
            data.meta.limit,
            data.meta.total,
            'Success',
            path,
          );
        }

        // Regular success response
        return new SuccessResponseDto(data, 'Success', 200, path);
      }),
    );
  }
}
