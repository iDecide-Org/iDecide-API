import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { // Assumes a 'jwt' Passport strategy is configured
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private jwtService: JwtService) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies['jwt']; // Extract token from cookie

    this.logger.debug(`JWT Guard: Checking for token in cookies.`);

    if (!token) {
      this.logger.warn('JWT Guard: No token found in cookies.');
      throw new UnauthorizedException('No JWT token found');
    }

    try {
      const payload = this.jwtService.verify(token); // Verify the token synchronously
      this.logger.debug('JWT Guard: Token verified successfully. Payload:', payload);
      request.user = payload; // Attach payload to request.user IMPORTANT!
      return true; // Allow access
    } catch (error) {
      this.logger.error(`JWT Guard: Token verification failed. Error: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired JWT token');
    }
  }

  // Optional: Handle request if you need custom logic after authentication
  // This part might not be strictly necessary if canActivate handles everything
  handleRequest(err, user, info, context: ExecutionContext) {
     this.logger.debug(`JWT Guard handleRequest: err=${err}, user=${JSON.stringify(user)}, info=${info}`);
    if (err || !user) {
       this.logger.error(`JWT Guard handleRequest: Authentication failed. Error: ${err || 'No user found'}`);
      throw err || new UnauthorizedException('Authentication failed in handleRequest');
    }
    // If canActivate attached the user, it should be available here.
    // Ensure the user object is returned correctly.
    return user;
  }
}
