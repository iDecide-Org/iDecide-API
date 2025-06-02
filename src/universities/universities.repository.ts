import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './university.entity';

@Injectable()
export class UniversitiesRepository {
  constructor(
    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
  ) {}

  async create(universityData: Partial<University>): Promise<University> {
    const university = this.universityRepository.create(universityData);
    try {
      return await this.universityRepository.save(university);
    } catch {
      throw new InternalServerErrorException('Failed to create university');
    }
  }

  async findById(
    id: string,
    relations: string[] = [],
  ): Promise<University | null> {
    return this.universityRepository.findOne({
      where: { id },
      relations,
    });
  }

  async findByName(name: string): Promise<University | null> {
    return this.universityRepository.findOne({
      where: { name },
    });
  }

  async findByAdvisorId(
    advisorId: string,
    relations: string[] = [],
  ): Promise<University | null> {
    return this.universityRepository.findOne({
      where: { advisorId },
      relations,
    });
  }

  async findAll(relations: string[] = []): Promise<University[]> {
    return this.universityRepository.find({
      relations,
    });
  }

  async update(
    id: string,
    updateData: Partial<University>,
  ): Promise<University> {
    const result = await this.universityRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.universityRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.universityRepository.count({ where: { id } });
    return count > 0;
  }
}
