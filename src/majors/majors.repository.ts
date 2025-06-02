import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Major } from './entities/major.entity';
import { College } from '../colleges/entities/college.entity';

@Injectable()
export class MajorsRepository {
  private readonly logger = new Logger(MajorsRepository.name);

  constructor(
    @InjectRepository(Major)
    private readonly majorRepository: Repository<Major>,
    @InjectRepository(College)
    private readonly collegeRepository: Repository<College>,
  ) {}

  async create(majorData: Partial<Major>): Promise<Major> {
    const major = this.majorRepository.create(majorData);
    try {
      return await this.majorRepository.save(major);
    } catch (error) {
      this.logger.error(
        `Failed to create major: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create major');
    }
  }

  async findById(id: string, relations: string[] = []): Promise<Major | null> {
    return this.majorRepository.findOne({
      where: { id },
      relations,
    });
  }

  async findAll(relations: string[] = []): Promise<Major[]> {
    return this.majorRepository.find({
      relations,
    });
  }

  async findByCollege(
    collegeId: string,
    relations: string[] = [],
  ): Promise<Major[]> {
    return this.majorRepository.find({
      where: { collegeId },
      relations,
    });
  }

  async update(id: string, updateData: Partial<Major>): Promise<Major> {
    const result = await this.majorRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`Major with ID ${id} not found`);
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.majorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Major with ID ${id} not found`);
    }
  }

  async findCollegeWithUniversity(collegeId: string): Promise<College | null> {
    return this.collegeRepository.findOne({
      where: { id: collegeId },
      relations: ['university'],
    });
  }
}
