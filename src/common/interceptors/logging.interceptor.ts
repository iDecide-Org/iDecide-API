import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url, body, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = request.ip || request.connection.remoteAddress;
    const userId = (request as any).user?.id || 'anonymous';

    const startTime = Date.now();

    // Sanitize sensitive data
    const sanitizedBody = this.sanitizeBody(body);

    this.logger.log(
      `Incoming Request: ${method} ${url} - IP: ${ip} - User: ${userId} - UserAgent: ${userAgent}`,
    );

    if (Object.keys(sanitizedBody).length > 0) {
      this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const { statusCode } = response;

        this.logger.log(
          `Request completed: ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId}`,
        );

        // Log response data in development
        if (process.env.NODE_ENV !== 'production' && data) {
          const sanitizedResponse = this.sanitizeResponse(data);
          this.logger.debug(`Response: ${JSON.stringify(sanitizedResponse)}`);
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        this.logger.error(
          `Request failed: ${method} ${url} - ${duration}ms - User: ${userId} - Error: ${error.message}`,
          error.stack,
        );

        return throwError(() => error);
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return {};

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
    ];
    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeResponse(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    if (Array.isArray(sanitized)) {
      return sanitized.map((item) => this.sanitizeResponse(item));
    }

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
