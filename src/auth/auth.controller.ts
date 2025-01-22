import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './users/users.repository';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async Signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token } = await this.authService.Signup(signupDto, response);
    return { massage: 'Success', token };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async Signin(
    @Body() signinDto: SigninDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.Signin(signinDto, response);
  }
  @Delete('delete/:id')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
  @Get('user')
  async getUser(@Req() request: Request) {
    try {
      const cookie = request.cookies['jwt'];
      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException('Unauthorized');
      }
      // find user logic here
      const user = await this.userRepository.findById(data['id']);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, id, ...result } = user;
      return result;
    } catch (e) {
      throw new UnauthorizedException(e.message);
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');
    return {
      message: 'Success',
    };
  }
}
