import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException, // Import InternalServerErrorException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { College } from './entities/college.entity';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { University } from '../universities/university.entity'; // Import University

@Injectable()
export class CollegesRepository {
  constructor(
    @InjectRepository(College)
    private readonly collegeRepository: Repository<College>,
    @InjectRepository(University) // Inject University repository to check ownership
    private readonly universityRepository: Repository<University>,
  ) {}

  async createCollege(
    createCollegeDto: CreateCollegeDto,
    advisorId: string,
  ): Promise<College> {
    // Verify advisor owns the university
    const university = await this.universityRepository.findOne({
      where: { id: createCollegeDto.universityId, advisorId: advisorId },
    });
    if (!university) {
      throw new UnauthorizedException(
        'You do not own the specified university.',
      );
    }

    const college = this.collegeRepository.create({
      ...createCollegeDto,
      university: university, // Link the university object
    });
    await this.collegeRepository.save(college);
    return college;
  }

  async findAll(): Promise<College[]> {
    try {
      return await this.collegeRepository.find({
        relations: ['university', 'majors'], // Optionally load relations
      });
    } catch (error) {
      console.error('Error finding all colleges:', error);
      throw new InternalServerErrorException('Failed to retrieve colleges.');
    }
  }

  async findAllByUniversity(universityId: string): Promise<College[]> {
    return this.collegeRepository.find({
      where: { universityId },
      relations: ['university', 'majors'],
    });
  }

  async findOneById(id: string): Promise<College> {
    const college = await this.collegeRepository.findOne({
      where: { id },
      relations: ['university', 'majors'], // Load relations
    });
    if (!college) {
      throw new NotFoundException(`College with ID ${id} not found`);
    }
    return college;
  }

  async updateCollege(
    id: string,
    updateCollegeDto: UpdateCollegeDto,
    advisorId: string,
  ): Promise<College> {
    const college = await this.findOneById(id); // This already throws NotFoundException if not found

    // Verify advisor owns the university associated with this college
    if (college.university.advisorId !== advisorId) {
      throw new UnauthorizedException(
        'You do not have permission to update this college.',
      );
    }

    Object.assign(college, updateCollegeDto);
    await this.collegeRepository.save(college);
    return college;
  }

  async removeCollege(id: string, advisorId: string): Promise<void> {
    const college = await this.findOneById(id); // Check existence and get university info

    // Verify advisor owns the university associated with this college
    if (college.university.advisorId !== advisorId) {
      throw new UnauthorizedException(
        'You do not have permission to delete this college.',
      );
    }

    const result = await this.collegeRepository.delete(id);
    if (result.affected === 0) {
      // This case should ideally not happen due to the findOneById check, but good practice
      throw new NotFoundException(`College with ID ${id} not found`);
    }
  }
}
