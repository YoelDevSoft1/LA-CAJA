import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

type StoreIdCandidate = string | string[] | undefined | null;

@Injectable()
export class StoreIdValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const userStoreId = request?.user?.store_id;

    if (!userStoreId) {
      return next.handle();
    }

    const candidates: StoreIdCandidate[] = [
      request?.params?.storeId,
      request?.params?.store_id,
      request?.query?.store_id,
      request?.body?.store_id,
      request?.body?.storeId,
    ];

    const normalizedUserStoreId = String(userStoreId).toLowerCase();

    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null || candidate === '') {
        continue;
      }

      const values = Array.isArray(candidate) ? candidate : [candidate];
      for (const value of values) {
        if (String(value).toLowerCase() !== normalizedUserStoreId) {
          throw new BadRequestException('store_id no autorizado');
        }
      }
    }

    return next.handle();
  }
}
