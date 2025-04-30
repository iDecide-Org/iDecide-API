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
  BadRequestException,
} from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '../auth/users/user.entity';
import { AdvisorGuard } from 'src/auth/guards/advisor.guard';

@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  // Advisor creates a college for a university they own
  @Post()
  @UseGuards(AuthGuard('jwt'), AdvisorGuard)
  create(
    @Body(ValidationPipe) createCollegeDto: CreateCollegeDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.collegesService.create(createCollegeDto, user);
  }

  // Get all colleges (potentially filtered by university)
  @Get()
  findAll(
    @Query(
      'universityId',
      new ParseUUIDPipe({
        optional: true,
        exceptionFactory: () =>
          new BadRequestException('Invalid University ID format.'),
      }),
    )
    universityId?: string,
  ) {
    if (universityId) {
      return this.collegesService.findAllByUniversity(universityId);
    } else {
      return this.collegesService.findAll();
    }
  }

  // Get a specific college
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.collegesService.findOne(id);
  }

  // Advisor updates a college they own (via university)
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), AdvisorGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateCollegeDto: UpdateCollegeDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.collegesService.update(id, updateCollegeDto, user);
  }

  // Advisor deletes a college they own (via university)
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdvisorGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.collegesService.remove(id, user);
  }
}
