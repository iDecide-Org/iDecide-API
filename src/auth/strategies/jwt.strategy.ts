import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserRepository } from '../users/users.repository'; // Assuming you have this repository
import { User } from '../users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') { // Use 'jwt' as the strategy name
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository, // Inject UserRepository
  ) {
    super({
      // Extract JWT from cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let token = null;
          if (request && request.cookies) {
            token = request.cookies['jwt'];
          }
          // Optionally, you could also check the Authorization header as a fallback
          // if (!token && request && request.headers.authorization) {
          //   token = request.headers.authorization.split(' ')[1];
          // }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'YOUR_DEFAULT_SECRET'), // Use ConfigService
    });
  }

  async validate(payload: { id: string; email: string }): Promise<User> {
    const { id } = payload;
    const user = await this.userRepository.findById(id); // Fetch user from DB

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    // You can add more validation here if needed (e.g., check if user is active)

    // The user object returned here will be attached to request.user
    // Exclude password before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as User; // Return the user object (without password)
  }
}
