import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from '../users/user.entity';

@Injectable()
export class AdvisorGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user || user.type !== 'advisor') {
      throw new ForbiddenException('Access denied. Advisor role required.');
    }

    return true;
  }
}
