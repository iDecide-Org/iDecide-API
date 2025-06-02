import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Major } from './entities/major.entity';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { College } from '../colleges/entities/college.entity';

@Injectable()
export class MajorsRepository {
  private readonly logger = new Logger(MajorsRepository.name);

  constructor(
    @InjectRepository(Major)
    private readonly majorRepository: Repository<Major>,
    @InjectRepository(College)
    private readonly collegeRepository: Repository<College>, // Keep for service layer checks
  ) {}

  async createMajor(
    createMajorDto: CreateMajorDto,
    college: College, // Expect the validated College object from the service
  ): Promise<Major> {
    const major = this.majorRepository.create({
      ...createMajorDto,
      college: college, // Assign the full college object
    });
    try {
      await this.majorRepository.save(major);
      return major;
    } catch (error) {
      this.logger.error(
        `Failed to create major for college ${college.id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create major.');
    }
  }

  async findAll(): Promise<Major[]> {
    try {
      return await this.majorRepository.find({
        relations: ['college', 'college.university'],
      });
    } catch (error) {
      this.logger.error(
        `Error finding all majors: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve majors.');
    }
  }

  async findAllByCollege(collegeId: string): Promise<Major[]> {
    try {
      return await this.majorRepository.find({
        where: { collegeId },
        relations: ['college'],
      });
    } catch (error) {
      this.logger.error(
        `Error finding majors for college ${collegeId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve majors for the college.',
      );
    }
  }

  async findOneById(id: string): Promise<Major | null> {
    // Return null if not found
    try {
      const major = await this.majorRepository.findOne({
        where: { id },
        relations: ['college', 'college.university'],
      });
      return major; // Can be null if not found
    } catch (error) {
      this.logger.error(
        `Error finding major with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve major.');
    }
  }

  async findCollegeWithUniversity(collegeId: string): Promise<College | null> {
    try {
      return await this.collegeRepository.findOne({
        where: { id: collegeId },
        relations: ['university'],
      });
    } catch (error) {
      this.logger.error(
        `Error finding college with university for ID ${collegeId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve college details.',
      );
    }
  }

  async updateMajor(
    major: Major, // Expect the Major entity from the service
    updateMajorDto: UpdateMajorDto,
  ): Promise<Major> {
    // The major entity is fetched and authorized by the service
    Object.assign(major, updateMajorDto);
    try {
      await this.majorRepository.save(major);
      return major;
    } catch (error) {
      this.logger.error(
        `Failed to update major with ID ${major.id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update major.');
    }
  }

  async removeMajor(id: string): Promise<void> {
    // id is sufficient
    try {
      const result = await this.majorRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(
          `Major with ID ${id} not found for deletion.`,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to remove major with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to remove major.');
    }
  }
}
