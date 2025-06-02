import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { College } from './entities/college.entity';
import { University } from '../universities/university.entity';

@Injectable()
export class CollegesRepository {
  constructor(
    @InjectRepository(College)
    private readonly collegeRepository: Repository<College>,
    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
  ) {}

  async create(collegeData: Partial<College>): Promise<College> {
    const college = this.collegeRepository.create(collegeData);
    try {
      return await this.collegeRepository.save(college);
    } catch {
      throw new InternalServerErrorException('Failed to create college');
    }
  }

  async findById(
    id: string,
    relations: string[] = [],
  ): Promise<College | null> {
    return this.collegeRepository.findOne({
      where: { id },
      relations,
    });
  }

  async findAll(relations: string[] = []): Promise<College[]> {
    return this.collegeRepository.find({
      relations,
    });
  }

  async findByUniversity(
    universityId: string,
    relations: string[] = [],
  ): Promise<College[]> {
    return this.collegeRepository.find({
      where: { universityId },
      relations,
    });
  }

  async update(id: string, updateData: Partial<College>): Promise<College> {
    const result = await this.collegeRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`College with ID ${id} not found`);
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.collegeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`College with ID ${id} not found`);
    }
  }

  async findUniversityById(id: string): Promise<University | null> {
    return this.universityRepository.findOne({
      where: { id },
    });
  }
}
