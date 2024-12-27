import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async Signup(@Body() signupDto: SignupDto) {
    return this.authService.Signup(signupDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async Signin(@Body() signinDto: SigninDto) {
    return this.authService.Signin(signinDto);
  }
  @Delete('delete/:id')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
