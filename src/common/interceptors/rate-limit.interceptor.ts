import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    firstRequest: number;
  };
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private store: RateLimitStore = {};
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly maxRequests = 100; // requests per window

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request);

    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Clean old entries
    if (this.store[key] && this.store[key].firstRequest < windowStart) {
      delete this.store[key];
    }

    if (!this.store[key]) {
      this.store[key] = {
        count: 1,
        firstRequest: now,
      };
    } else {
      this.store[key].count++;
    }

    if (this.store[key].count > this.maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          retryAfter: Math.ceil(
            (this.store[key].firstRequest + this.windowMs - now) / 1000,
          ),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }

  private generateKey(request: Request): string {
    // Use IP address and user ID (if authenticated) for more granular control
    const ip = request.ip || request.connection.remoteAddress;
    const userId = (request as any).user?.id || 'anonymous';
    return `${ip}:${userId}`;
  }
}
