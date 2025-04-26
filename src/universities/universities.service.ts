import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UniversitiesRepository } from './universities.repository';
import { CreateUniversityDto } from './dto/create-university.dto';
import { University } from './university.entity';
import { User } from '../auth/users/user.entity';

@Injectable()
export class UniversitiesService {
  constructor(private readonly universitiesRepository: UniversitiesRepository) {}

  async addUniversity(
    createUniversityDto: CreateUniversityDto,
    imagePath: string,
    advisor: User,
  ): Promise<University> {
    // Ensure the user is an advisor
    if (advisor.type !== 'advisor') {
        throw new UnauthorizedException('Only advisors can add universities.');
    }
    return this.universitiesRepository.createUniversity(createUniversityDto, imagePath, advisor);
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

  // Add update service method later
}
