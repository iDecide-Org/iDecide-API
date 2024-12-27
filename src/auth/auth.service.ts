import { Injectable } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';

import { SigninDto } from './dto/signin.dto';
import { UserRepository } from './users/users.repository';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}
  async Signup(signupDto: SignupDto) {
    return this.userRepository.createUser(signupDto);
  }
  async Signin(signinDto: SigninDto) {
    return this.userRepository.validateUser(signinDto);
  }

  async deleteUser(id: string) {
    return this.userRepository.deleteUser(id);
  }
}
