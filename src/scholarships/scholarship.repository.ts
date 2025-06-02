import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scholarship } from './scholarship.entity';

@Injectable()
export class ScholarshipsRepository {
  constructor(
    @InjectRepository(Scholarship)
    private readonly scholarshipRepository: Repository<Scholarship>,
  ) {}

  async create(scholarshipData: Partial<Scholarship>): Promise<Scholarship> {
    const scholarship = this.scholarshipRepository.create(scholarshipData);
    try {
      return await this.scholarshipRepository.save(scholarship);
    } catch {
      throw new InternalServerErrorException('Failed to create scholarship');
    }
  }

  async findById(
    id: string,
    relations: string[] = [],
  ): Promise<Scholarship | null> {
    return this.scholarshipRepository.findOne({
      where: { id },
      relations,
    });
  }

  async findByAdvisor(
    advisorId: string,
    relations: string[] = [],
  ): Promise<Scholarship[]> {
    return this.scholarshipRepository.find({
      where: { advisorId },
      relations,
    });
  }

  async findByUniversity(
    universityId: string,
    relations: string[] = [],
  ): Promise<Scholarship[]> {
    return this.scholarshipRepository.find({
      where: { universityId },
      relations,
    });
  }

  async findAll(relations: string[] = []): Promise<Scholarship[]> {
    return this.scholarshipRepository.find({
      relations,
    });
  }

  async update(
    id: string,
    updateData: Partial<Scholarship>,
  ): Promise<Scholarship> {
    const result = await this.scholarshipRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.scholarshipRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.scholarshipRepository.count({ where: { id } });
    return count > 0;
  }

  async findByAdvisorAndId(
    advisorId: string,
    id: string,
  ): Promise<Scholarship | null> {
    return this.scholarshipRepository.findOne({
      where: { id, advisorId },
    });
  }
}
