import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scholarship } from './scholarship.entity';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { User } from '../auth/users/user.entity';

@Injectable()
export class ScholarshipsRepository {
  constructor(
    @InjectRepository(Scholarship)
    private readonly scholarshipRepository: Repository<Scholarship>,
  ) {}

  async createScholarship(
    createScholarshipDto: CreateScholarshipDto,
    advisor: User,
  ): Promise<Scholarship> {
    const {
      name,
      provider,
      type,
      description,
      eligibility,
      deadline,
      link,
      coverage,
      country,
      fieldOfStudy,
      universityId, // Destructure universityId
    } = createScholarshipDto;

    const scholarship = this.scholarshipRepository.create({
      name,
      provider,
      type,
      description,
      eligibility,
      deadline: new Date(deadline), // Convert string date to Date object
      link,
      coverage,
      country,
      fieldOfStudy,
      advisor: advisor,
      advisorId: advisor.id,
      universityId: universityId, // Assign universityId
    });

    try {
      await this.scholarshipRepository.save(scholarship);
      return scholarship;
    } catch (error) {
      console.error('Error saving scholarship:', error);
      throw new InternalServerErrorException('Failed to create scholarship.');
    }
  }

  async findById(id: string): Promise<Scholarship> {
    const scholarship = await this.scholarshipRepository.findOne({
      where: { id },
      relations: ['university'], // Optionally load university relation
    });
    if (!scholarship) {
      throw new NotFoundException(`Scholarship with ID ${id} not found.`);
    }
    return scholarship;
  }

  async findByAdvisor(advisorId: string): Promise<Scholarship[]> {
    try {
      return await this.scholarshipRepository.find({
        where: { advisorId },
        relations: ['university'], // Optionally load university relation
      });
    } catch (error) {
      console.error('Error finding scholarships by advisor:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve scholarships.',
      );
    }
  }

  async findAll(): Promise<Scholarship[]> {
    try {
      // Consider adding relations if needed, e.g., advisor details, university
      return await this.scholarshipRepository.find({
        relations: ['university'],
      });
    } catch (error) {
      console.error('Error finding all scholarships:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve scholarships.',
      );
    }
  }

  async updateScholarship(
    id: string,
    advisorId: string,
    updateScholarshipDto: UpdateScholarshipDto,
  ): Promise<Scholarship> {
    const scholarship = await this.scholarshipRepository.findOne({
      where: { id, advisorId },
    });

    if (!scholarship) {
      throw new NotFoundException(
        `Scholarship with ID ${id} not found or you don't have permission to update it.`,
      );
    }

    // Prepare data for merging, ensuring correct types for the entity
    const dataToMerge: Partial<Scholarship> = {};

    // Iterate over DTO properties and assign to dataToMerge, handling type conversion
    for (const key in updateScholarshipDto) {
      if (updateScholarshipDto[key] !== undefined) {
        if (key === 'deadline') {
          // Convert deadline string from DTO to Date for the entity
          dataToMerge.deadline = new Date(updateScholarshipDto.deadline);
        } else {
          // Assign other properties directly (assuming types match or are compatible)
          dataToMerge[key] = updateScholarshipDto[key];
        }
      }
    }

    // Merge the prepared data into the existing scholarship entity
    this.scholarshipRepository.merge(scholarship, dataToMerge);

    try {
      await this.scholarshipRepository.save(scholarship);
      return scholarship;
    } catch (error) {
      console.error('Error updating scholarship:', error);
      throw new InternalServerErrorException('Failed to update scholarship.');
    }
  }

  async deleteScholarship(id: string, advisorId: string): Promise<void> {
    // Find the scholarship first to ensure it belongs to the advisor
    const scholarship = await this.scholarshipRepository.findOne({
      where: { id, advisorId },
    });
    if (!scholarship) {
      throw new NotFoundException(
        `Scholarship with ID ${id} not found or you don't have permission to delete it.`,
      );
    }

    const result = await this.scholarshipRepository.delete({ id, advisorId }); // Ensure advisorId matches

    if (result.affected === 0) {
      // This case should ideally be caught by the findOne check above
      throw new NotFoundException(`Scholarship with ID ${id} not found.`);
    }
  }
}
