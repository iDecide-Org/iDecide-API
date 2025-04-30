import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Major } from './entities/major.entity';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { College } from '../colleges/entities/college.entity'; // Import College

@Injectable()
export class MajorsRepository {
  constructor(
    @InjectRepository(Major)
    private readonly majorRepository: Repository<Major>,
    @InjectRepository(College) // Inject College repository to check ownership via university
    private readonly collegeRepository: Repository<College>,
  ) {}

  async createMajor(
    createMajorDto: CreateMajorDto,
    advisorId: string,
  ): Promise<Major> {
    // Verify advisor owns the university that owns the college
    const college = await this.collegeRepository.findOne({
      where: { id: createMajorDto.collegeId },
      relations: ['university'], // Need university to check advisorId
    });

    if (!college) {
      throw new NotFoundException(
        `College with ID ${createMajorDto.collegeId} not found.`,
      );
    }
    if (college.university.advisorId !== advisorId) {
      throw new UnauthorizedException(
        'You do not own the university associated with this college.',
      );
    }

    const major = this.majorRepository.create({
      ...createMajorDto,
      college: college, // Link the college object
    });
    await this.majorRepository.save(major);
    return major;
  }

  async findAllByCollege(collegeId: string): Promise<Major[]> {
    return this.majorRepository.find({
      where: { collegeId },
      relations: ['college'],
    });
  }

  async findOneById(id: string): Promise<Major> {
    const major = await this.majorRepository.findOne({
      where: { id },
      relations: ['college', 'college.university'], // Load relations to check ownership
    });
    if (!major) {
      throw new NotFoundException(`Major with ID ${id} not found`);
    }
    return major;
  }

  async updateMajor(
    id: string,
    updateMajorDto: UpdateMajorDto,
    advisorId: string,
  ): Promise<Major> {
    const major = await this.findOneById(id); // This already throws NotFoundException if not found

    // Verify advisor owns the university associated with this major's college
    if (major.college.university.advisorId !== advisorId) {
      throw new UnauthorizedException(
        'You do not have permission to update this major.',
      );
    }

    Object.assign(major, updateMajorDto);
    await this.majorRepository.save(major);
    return major;
  }

  async removeMajor(id: string, advisorId: string): Promise<void> {
    const major = await this.findOneById(id); // Check existence and get college/university info

    // Verify advisor owns the university associated with this major's college
    if (major.college.university.advisorId !== advisorId) {
      throw new UnauthorizedException(
        'You do not have permission to delete this major.',
      );
    }

    const result = await this.majorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Major with ID ${id} not found`);
    }
  }
}
