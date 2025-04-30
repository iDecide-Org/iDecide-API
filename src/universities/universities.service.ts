import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException, // Import ConflictException
} from '@nestjs/common';
import { UniversitiesRepository } from './universities.repository';
import { CreateUniversityDto } from './dto/create-university.dto';
import { University } from './university.entity';
import { User, UserType } from '../auth/users/user.entity'; // Import UserType

@Injectable()
export class UniversitiesService {
  constructor(
    private readonly universitiesRepository: UniversitiesRepository,
  ) {}

  async addUniversity(
    createUniversityDto: CreateUniversityDto,
    imagePath: string | null, // Allow null
    advisor: User,
  ): Promise<University> {
    // Ensure the user is an advisor
    if (advisor.type !== UserType.ADVISOR) {
      // Use enum for type check
      throw new UnauthorizedException('Only advisors can add universities.');
    }

    // Check if the advisor already has a university
    const existingUniversityForAdvisor =
      await this.universitiesRepository.findByAdvisorId(advisor.id); // Use findByAdvisorId
    if (existingUniversityForAdvisor) {
      throw new ConflictException('Advisors can only add one university.');
    }

    // Check if a university with the same name already exists (keep this check)
    const existingUniversityWithName =
      await this.universitiesRepository.findByName(createUniversityDto.name);
    if (existingUniversityWithName) {
      throw new ConflictException(
        `University with name "${createUniversityDto.name}" already exists.`,
      );
    }

    return this.universitiesRepository.createUniversity(
      createUniversityDto,
      imagePath,
      advisor,
    );
  }

  async getUniversityById(id: string): Promise<University> {
    // findById throws NotFoundException if not found
    return this.universitiesRepository.findById(id);
  }

  async getUniversitiesByAdvisor(
    advisorId: string,
  ): Promise<University | null> {
    // Update return type
    return this.universitiesRepository.findByAdvisorId(advisorId); // Use findByAdvisorId
  }

  async getAllUniversities(): Promise<University[]> {
    return this.universitiesRepository.findAll();
  }

  async removeUniversity(id: string, advisor: User): Promise<void> {
    if (advisor.type !== UserType.ADVISOR) {
      // Use enum for type check
      throw new UnauthorizedException('Only advisors can delete universities.');
    }
    // Repository method handles ownership check and throws NotFoundException
    await this.universitiesRepository.deleteUniversity(id, advisor.id);
  }

  async updateUniversity(
    id: string,
    updateUniversityDto: Partial<CreateUniversityDto>,
    imagePath: string | null | undefined,
    advisor: User,
  ): Promise<University> {
    if (advisor.type !== UserType.ADVISOR) {
      // Use enum for type check
      throw new UnauthorizedException('Only advisors can update universities.');
    }

    // Repository method handles ownership check and duplicate name check on update
    // It throws NotFoundException or ConflictException
    return this.universitiesRepository.updateUniversity(
      id,
      updateUniversityDto,
      imagePath,
      advisor,
    );
  }
}
