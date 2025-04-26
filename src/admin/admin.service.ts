import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/users/user.entity';
import { University } from '../universities/university.entity';
import { Scholarship } from '../scholarships/scholarship.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(University)
    private universitiesRepository: Repository<University>,
    @InjectRepository(Scholarship)
    private scholarshipsRepository: Repository<Scholarship>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  async getOverviewData() {
    const userCount = await this.usersRepository.count();
    const universityCount = await this.universitiesRepository.count();
    const scholarshipCount = await this.scholarshipsRepository.count();
    return {
      users: userCount,
      universities: universityCount,
      scholarships: scholarshipCount,
    };
  }

  // --- User Management ---
  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAllUsers() {
    return this.usersRepository.find();
  }

  async findOneUser(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOneUser(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async removeUser(id: string) {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`User with ID ${id} not found`);
  }

  // --- University Management ---
  async createUniversity(dto: CreateUniversityDto) {
    const university = this.universitiesRepository.create(dto);
    return this.universitiesRepository.save(university);
  }

  async findAllUniversities() {
    return this.universitiesRepository.find();
  }

  async findOneUniversity(id: string) {
    const university = await this.universitiesRepository.findOne({ where: { id } });
    if (!university) throw new NotFoundException(`University with ID ${id} not found`);
    return university;
  }

  async updateUniversity(id: string, dto: UpdateUniversityDto) {
    const university = await this.findOneUniversity(id);
    Object.assign(university, dto);
    return this.universitiesRepository.save(university);
  }

  async removeUniversity(id: string) {
    const result = await this.universitiesRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`University with ID ${id} not found`);
  }

  // --- Scholarship Management ---
  async createScholarship(dto: CreateScholarshipDto) {
    const scholarshipData: any = { ...dto };
    if (dto.eligibility) scholarshipData.eligibility = JSON.stringify(dto.eligibility);
    if (dto.requirements) scholarshipData.requirements = JSON.stringify(dto.requirements);
    const scholarship = this.scholarshipsRepository.create(scholarshipData);
    return this.scholarshipsRepository.save(scholarship);
  }

  async findAllScholarships() {
    return this.scholarshipsRepository.find();
  }

  async findOneScholarship(id: string) {
    const scholarship = await this.scholarshipsRepository.findOne({ where: { id } });
    if (!scholarship) throw new NotFoundException(`Scholarship with ID ${id} not found`);
    return scholarship;
  }

  async updateScholarship(id: string, dto: UpdateScholarshipDto) {
    const scholarship = await this.findOneScholarship(id);
    Object.assign(scholarship, dto);
    return this.scholarshipsRepository.save(scholarship);
  }

  async removeScholarship(id: string) {
    const result = await this.scholarshipsRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Scholarship with ID ${id} not found`);
  }
}
