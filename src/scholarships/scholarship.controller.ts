import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ScholarshipsService } from './scholarship.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '../auth/users/user.entity';

@Controller('scholarships')
export class ScholarshipsController {
  constructor(private readonly scholarshipsService: ScholarshipsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async addScholarship(
    @Body(new ValidationPipe()) createScholarshipDto: CreateScholarshipDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;
    return this.scholarshipsService.addScholarship(createScholarshipDto, user);
  }

  @Get('/advisor')
  @UseGuards(AuthGuard('jwt'))
  async getAdvisorScholarships(@Req() request: Request) {
    const user = request.user as User;
    if (user.type !== 'advisor') {
      throw new UnauthorizedException(
        'Only advisors can access this resource.',
      );
    }
    return this.scholarshipsService.getScholarshipsByAdvisor(user.id);
  }

  @Get()
  async getAllScholarships() {
    return this.scholarshipsService.getAllScholarships();
  }

  @Get(':id')
  async getScholarship(@Param('id', ParseUUIDPipe) id: string) {
    return this.scholarshipsService.getScholarshipById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateScholarship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ skipMissingProperties: true }))
    updateScholarshipDto: UpdateScholarshipDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;
    return this.scholarshipsService.updateScholarship(
      id,
      user,
      updateScholarshipDto,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeScholarship(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;
    await this.scholarshipsService.removeScholarship(id, user);
  }
}
