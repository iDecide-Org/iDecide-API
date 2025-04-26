import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, ValidationPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './guards/admin.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverviewData();
  }

  // --- User Management ---
  @Post('users')
  createUser(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('users/:id')
  findOneUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOneUser(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id', ParseUUIDPipe) id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  removeUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.removeUser(id);
  }

  // --- University Management ---
  @Post('universities')
  createUniversity(@Body(ValidationPipe) createUniversityDto: CreateUniversityDto) {
    return this.adminService.createUniversity(createUniversityDto);
  }

  @Get('universities')
  findAllUniversities() {
    return this.adminService.findAllUniversities();
  }

  @Get('universities/:id')
  findOneUniversity(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOneUniversity(id);
  }

  @Patch('universities/:id')
  updateUniversity(@Param('id', ParseUUIDPipe) id: string, @Body(ValidationPipe) updateUniversityDto: UpdateUniversityDto) {
    return this.adminService.updateUniversity(id, updateUniversityDto);
  }

  @Delete('universities/:id')
  removeUniversity(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.removeUniversity(id);
  }

  // --- Scholarship Management ---
  @Post('scholarships')
  createScholarship(@Body(ValidationPipe) createScholarshipDto: CreateScholarshipDto) {
    return this.adminService.createScholarship(createScholarshipDto);
  }

  @Get('scholarships')
  findAllScholarships() {
    return this.adminService.findAllScholarships();
  }

  @Get('scholarships/:id')
  findOneScholarship(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOneScholarship(id);
  }

  @Patch('scholarships/:id')
  updateScholarship(@Param('id', ParseUUIDPipe) id: string, @Body(ValidationPipe) updateScholarshipDto: UpdateScholarshipDto) {
    return this.adminService.updateScholarship(id, updateScholarshipDto);
  }

  @Delete('scholarships/:id')
  removeScholarship(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.removeScholarship(id);
  }
}
