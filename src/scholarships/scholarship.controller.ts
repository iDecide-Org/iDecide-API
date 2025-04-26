import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Delete,
  Put, // Import Put
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ScholarshipsService } from './scholarship.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto'; // Import Update DTO
// import { AuthGuard } from '../auth/auth.guard'; // Assuming you have an AuthGuard
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt'; // To verify JWT
import { UserRepository } from '../auth/users/users.repository'; // To get user details
import { User } from '../auth/users/user.entity';

@Controller('scholarships')
export class ScholarshipsController {
  constructor(
    private readonly scholarshipsService: ScholarshipsService,
    private readonly jwtService: JwtService, // Inject JwtService
    private readonly userRepository: UserRepository, // Inject UserRepository
  ) {}

  // Helper to get user from request (Consider moving to a shared utility or guard)
  private async getUserFromRequest(request: Request): Promise<User> {
    const cookie = request.cookies['jwt'];
    if (!cookie) {
      throw new UnauthorizedException('JWT cookie not found.');
    }
    try {
      const data = await this.jwtService.verifyAsync(cookie);
      if (!data || !data['id']) {
        throw new UnauthorizedException('Invalid JWT data.');
      }
      const user = await this.userRepository.findById(data['id']);
      if (!user) {
        throw new UnauthorizedException('User not found.');
      }
      return user;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired JWT.');
    }
  }

  @Post()
  // @UseGuards(AuthGuard) // Protect this route
  async addScholarship(
    @Body(new ValidationPipe()) createScholarshipDto: CreateScholarshipDto,
    @Req() request: Request,
  ) {
    const user = await this.getUserFromRequest(request);
    return this.scholarshipsService.addScholarship(createScholarshipDto, user);
  }

  @Get('/advisor') // Route specifically for advisors to get their scholarships
  // @UseGuards(AuthGuard)
  async getAdvisorScholarships(@Req() request: Request) {
    const user = await this.getUserFromRequest(request);
    if (user.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can access this resource.');
    }
    return this.scholarshipsService.getScholarshipsByAdvisor(user.id);
  }

   @Get() // General route for everyone (e.g., students)
   // No AuthGuard needed if public
   async getAllScholarships() {
     return this.scholarshipsService.getAllScholarships();
   }


  @Get(':id')
  // No AuthGuard needed if public
  async getScholarship(@Param('id', ParseUUIDPipe) id: string) {
    return this.scholarshipsService.getScholarshipById(id);
  }

  @Put(':id')
  // @UseGuards(AuthGuard)
  async updateScholarship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ skipMissingProperties: true })) updateScholarshipDto: UpdateScholarshipDto,
    @Req() request: Request,
  ) {
    const user = await this.getUserFromRequest(request);
    return this.scholarshipsService.updateScholarship(id, user, updateScholarshipDto);
  }

  @Delete(':id')
  // @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT) // Return 204 on successful deletion
  async removeScholarship(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = await this.getUserFromRequest(request);
    await this.scholarshipsService.removeScholarship(id, user);
    // No need to return anything on success (NO_CONTENT)
  }
}
