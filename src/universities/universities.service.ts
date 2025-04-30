import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'; // Add NotFoundException
import { UniversitiesRepository } from './universities.repository';
import { CreateUniversityDto } from './dto/create-university.dto';
import { University } from './university.entity';
import { User } from '../auth/users/user.entity';

@Injectable()
export class UniversitiesService {
  constructor(
    private readonly universitiesRepository: UniversitiesRepository,
  ) {}

  async addUniversity(
    createUniversityDto: CreateUniversityDto,
    imagePath: string,
    advisor: User,
  ): Promise<University> {
    // Ensure the user is an advisor
    if (advisor.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can add universities.');
    }
    return this.universitiesRepository.createUniversity(
      createUniversityDto,
      imagePath,
      advisor,
    );
  }

  async getUniversityById(id: string): Promise<University> {
    return this.universitiesRepository.findById(id);
  }

  async getUniversitiesByAdvisor(advisorId: string): Promise<University[]> {
    return this.universitiesRepository.findByAdvisor(advisorId);
  }

  async getAllUniversities(): Promise<University[]> {
    return this.universitiesRepository.findAll();
  }

  async removeUniversity(id: string, advisor: User): Promise<void> {
    if (advisor.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can delete universities.');
    }
    // The repository method already checks if the advisor owns the university
    await this.universitiesRepository.deleteUniversity(id, advisor.id);
  }

  async updateUniversity(
    id: string,
    updateUniversityDto: Partial<CreateUniversityDto>, // Change this to Partial
    imagePath: string | null | undefined, // Allow undefined to signify no change
    advisor: User,
  ): Promise<University> {
    // Ensure the user is an advisor
    if (advisor.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can update universities.');
    }

    // Fetch the existing university first to ensure it exists and belongs to the advisor
    const existingUniversity = await this.universitiesRepository.findByAdvisor(
      advisor.id,
    );
    if (!existingUniversity) {
      throw new NotFoundException(
        `University with ID "${id}" not found or not managed by this advisor.`,
      );
    }

    // Pass the partial DTO and image path to the repository method
    return this.universitiesRepository.updateUniversity(
      id, // Pass the ID to identify the university
      updateUniversityDto,
      imagePath,
      advisor, // Pass advisor for potential ownership checks in repository if needed again
    );
  }
}
