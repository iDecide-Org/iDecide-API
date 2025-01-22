import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';

import { SigninDto } from './dto/signin.dto';
import { UserRepository } from './users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}
  async Signup(
    signupDto: SignupDto,
    response: Response,
  ): Promise<{ token: string }> {
    try {
      // Create the user
      const user = await this.userRepository.createUser(signupDto);

      // Generate a JWT token
      const token = this.jwtService.sign({ id: user.id, email: user.email });
      response.cookie('jwt', token, { httpOnly: true });

      // Return the user and token
      return { token };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async Signin(signinDto: SigninDto, response: Response): Promise<any> {
    try {
      const user = await this.userRepository.validateUser(signinDto);
      const jwt = await this.jwtService.signAsync({ id: user.id });
      response.cookie('jwt', jwt, { httpOnly: true });

      return { message: 'Success' };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.UNAUTHORIZED);
    }
  }

  async deleteUser(id: string) {
    return this.userRepository.deleteUser(id);
  }
}
