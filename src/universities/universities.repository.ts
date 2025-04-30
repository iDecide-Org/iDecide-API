import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './university.entity';
import { CreateUniversityDto } from './dto/create-university.dto';
import { User } from '../auth/users/user.entity';

@Injectable()
export class UniversitiesRepository {
  constructor(
    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
  ) {}

  async createUniversity(
    createUniversityDto: CreateUniversityDto,
    imagePath: string,
    advisor: User, // Changed parameter name to reflect the user adding the university
  ): Promise<University> {
    const {
      name,
      location,
      type,
      establishment,
      description,
      collegesCount,
      majorsCount,
    } = createUniversityDto;

    const university = this.universityRepository.create({
      name,
      location,
      type,
      establishment: parseInt(establishment, 10), // Convert string to number
      description,
      collegesCount: parseInt(collegesCount, 10), // Convert string to number
      majorsCount: parseInt(majorsCount, 10), // Convert string to number
      image: imagePath, // Save the path/URL from upload
      advisor: advisor, // Keep the original advisor relationship if needed
      advisorId: advisor.id, // Keep the original advisorId if needed
      addedBy: advisor, // Set the user who added the university
      addedById: advisor.id, // Set the ID of the user who added the university
    });

    try {
      await this.universityRepository.save(university);
      return university;
    } catch (error) {
      console.error('Error saving university:', error);
      throw new InternalServerErrorException('Failed to create university.');
    }
  }

  async findById(id: string): Promise<University> {
    // Use relations to fetch the advisor along with the university
    const university = await this.universityRepository.findOne({
      where: { id },
      relations: ['advisor', 'addedBy'], // Load the related advisor and addedBy entities
    });
    if (!university) {
      throw new NotFoundException(`University with ID ${id} not found.`);
    }
    // Optionally remove sensitive advisor data if needed before returning
    // delete university.advisor.password;
    // delete university.addedBy.password;
    return university;
  }

  async findByAdvisor(advisorId: string): Promise<University[]> {
    try {
      return await this.universityRepository.find({ where: { advisorId } });
    } catch (error) {
      console.error('Error finding universities by advisor:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve universities.',
      );
    }
  }

  async findAll(): Promise<University[]> {
    try {
      // Include advisor and addedBy relation when finding all universities as well
      return await this.universityRepository.find({
        relations: ['advisor', 'addedBy', 'scholarships'], // Load the related advisor and addedBy entities
      });
    } catch (error) {
      console.error('Error finding all universities:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve universities.',
      );
    }
  }

  async deleteUniversity(id: string, advisorId: string): Promise<void> {
    // Find the university first to ensure it belongs to the advisor
    const university = await this.universityRepository.findOne({
      where: { id, advisorId },
    });
    if (!university) {
      throw new NotFoundException(
        `University with ID ${id} not found or you don't have permission to delete it.`,
      );
    }

    const result = await this.universityRepository.delete({ id, advisorId }); // Ensure advisorId matches

    if (result.affected === 0) {
      // This case should ideally be caught by the findOne check above
      throw new NotFoundException(`University with ID ${id} not found.`);
    }
  }

  async updateUniversity(
    id: string,
    updateUniversityDto: Partial<CreateUniversityDto>, // Change to Partial
    imagePath: string | null | undefined, // Allow undefined/null
    advisor: User,
  ): Promise<University> {
    const university = await this.findById(id); // findById already includes advisor check logic implicitly via service/controller

    // Explicitly check ownership again for safety, although service layer should handle this
    if (university.advisorId !== advisor.id) {
      throw new NotFoundException( // Or UnauthorizedException
        `You do not have permission to update this university.`,
      );
    }

    // Prepare updates, converting numeric fields if present
    const updates: Partial<University> = {};
    if (updateUniversityDto.name !== undefined)
      updates.name = updateUniversityDto.name;
    if (updateUniversityDto.location !== undefined)
      updates.location = updateUniversityDto.location;
    if (updateUniversityDto.type !== undefined)
      updates.type = updateUniversityDto.type;
    if (updateUniversityDto.establishment !== undefined)
      updates.establishment = parseInt(updateUniversityDto.establishment, 10);
    if (updateUniversityDto.description !== undefined)
      updates.description = updateUniversityDto.description;
    if (updateUniversityDto.collegesCount !== undefined)
      updates.collegesCount = parseInt(updateUniversityDto.collegesCount, 10);
    if (updateUniversityDto.majorsCount !== undefined)
      updates.majorsCount = parseInt(updateUniversityDto.majorsCount, 10);

    // Handle image update:
    // - If imagePath is provided (string or null), update the image field.
    // - If imagePath is undefined, do not update the image field.
    if (imagePath !== undefined) {
      updates.image = imagePath;
    }

    // Merge the updates into the existing university entity
    Object.assign(university, updates);

    try {
      await this.universityRepository.save(university);
      // Refetch to ensure relations are loaded correctly after save if needed,
      // or ensure save returns the updated entity with relations.
      // For simplicity, returning the modified object directly here.
      return university;
    } catch (error) {
      console.error('Error updating university:', error);
      throw new InternalServerErrorException('Failed to update university.');
    }
  }
}
