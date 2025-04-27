import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put, // Import Put
  Req,
  Res,
  UnauthorizedException,
  ValidationPipe, // Import ValidationPipe
  Logger, // Import Logger
  HttpException, // Import HttpException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './users/users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto'; // Import DTO
import { instanceToPlain } from 'class-transformer';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name); // Add Logger instance

  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  @Post('chatbot-status')
  @HttpCode(HttpStatus.OK)
  async updateChatbotStatus(
    @Body() body: { status: boolean },
    @Req() request: Request,
  ) {
    try {
      const cookie = request.cookies['jwt'];
      if (!cookie) {
        throw new UnauthorizedException('JWT cookie not found.');
      }
      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException('Unauthorized');
      }

      await this.userRepository.updateChatbotStatus(data['id'], body.status);

      return {
        message: 'Success',
      };
    } catch (e) {
      throw new UnauthorizedException(e.message);
    }
  }
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
  @HttpCode(HttpStatus.OK) //this will return 200 status code if success
  async getUser(@Req() request: Request) {
    // Log headers and cookies for the /user request
    // this.logger.debug('Incoming headers in getUser:', request.headers);
    // this.logger.debug('Incoming cookies in getUser:', request.cookies);

    try {
      const cookie = request.cookies['jwt'];
      if (!cookie) {
        // this.logger.error('JWT cookie not found in getUser request.'); // Log the specific error
        throw new UnauthorizedException('JWT cookie not found.');
      }
      const data = await this.jwtService.verifyAsync(cookie);

      if (!data || !data['id']) {
        throw new UnauthorizedException('Unauthorized');
      }
      // find user logic here
      const user = await this.userRepository.findById(data['id']);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const transformedUser = instanceToPlain(user); // remove password and other sensitive data

      if (user.type === 'student') {
        const student = await this.userRepository.findStudentByUserId(user.id);
        if (!student) {
          throw new UnauthorizedException('Student not found');
        }
        return { ...transformedUser, ...student }; // Return result (which includes id) + status
      } else if (user.type === 'advisor') {
        const advisor = await this.userRepository.findAdvisorByUserId(user.id);
        return {
          ...transformedUser,
          ...advisor, // Include advisor data if needed
        };
      } else if (user.type === 'admin') {
        // Handle admin type
        const admin = await this.userRepository.findAdminByUserId(user.id);
        // Add any admin-specific data to return if needed
        return {
          ...transformedUser,
          ...admin, // Include admin data if needed
        };
      }
    } catch (e) {
      this.logger.error(`Error in getUser: ${e.message}`, e.stack);
      if (e instanceof UnauthorizedException) {
        throw e; // Re-throw UnauthorizedException
      } else {
        // Throw a generic internal server error for other cases
        throw new HttpException(
          'Failed to retrieve user data',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Put('profile') // Use PUT for updates
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Req() request: Request,
    @Body(new ValidationPipe()) updateProfileDto: UpdateProfileDto, // Validate DTO
  ) {
    try {
      const cookie = request.cookies['jwt'];
      if (!cookie) {
        throw new UnauthorizedException('JWT cookie not found.');
      }
      const data = await this.jwtService.verifyAsync(cookie);

      if (!data || !data['id']) {
        throw new UnauthorizedException('Unauthorized');
      }

      const userId = data['id'];

      await this.userRepository.updateUserProfile(userId, updateProfileDto);

      return { message: 'Profile updated successfully' };
    } catch (e) {
      throw new UnauthorizedException(e.message || 'Failed to update profile');
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
