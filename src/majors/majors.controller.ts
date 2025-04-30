import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException, // Import BadRequestException
} from '@nestjs/common';
import { MajorsService } from './majors.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '../auth/users/user.entity';
import { AdvisorGuard } from 'src/auth/guards/advisor.guard';

@Controller('majors')
export class MajorsController {
  constructor(private readonly majorsService: MajorsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), AdvisorGuard)
  create(
    @Body(ValidationPipe) createMajorDto: CreateMajorDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.majorsService.create(createMajorDto, user);
  }

  @Get()
  findAll(
    @Query(
      'collegeId',
      new ParseUUIDPipe({
        optional: true,
        exceptionFactory: () =>
          new BadRequestException('Invalid College ID format.'),
      }),
    )
    collegeId?: string,
  ) {
    if (collegeId) {
      return this.majorsService.findAllByCollege(collegeId);
    } else {
      return this.majorsService.findAll();
    }
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.majorsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), AdvisorGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateMajorDto: UpdateMajorDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.majorsService.update(id, updateMajorDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdvisorGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.majorsService.remove(id, user);
  }
}
