import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'; // Add NotFoundException
import { ScholarshipsRepository } from './scholarship.repository';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto'; // Import Update DTO
import { Scholarship } from './scholarship.entity';
import { User } from '../auth/users/user.entity';
import { UniversitiesRepository } from '../universities/universities.repository'; // Import UniversitiesRepository

@Injectable()
export class ScholarshipsService {
  constructor(
    private readonly scholarshipsRepository: ScholarshipsRepository,
    private readonly universitiesRepository: UniversitiesRepository, // Inject UniversitiesRepository
  ) {}

  async addScholarship(
    createScholarshipDto: CreateScholarshipDto,
    advisor: User,
  ): Promise<Scholarship> {
    // Ensure the user is an advisor
    if (advisor.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can add scholarships.');
    }

    // If a universityId is provided, validate it and advisor ownership
    if (createScholarshipDto.universityId) {
      const university = await this.universitiesRepository.findById(
        createScholarshipDto.universityId,
      );
      if (!university) {
        throw new NotFoundException(
          `University with ID ${createScholarshipDto.universityId} not found.`,
        );
      }
      // Ensure the advisor adding the scholarship owns the university it's being added to
      if (university.advisorId !== advisor.id) {
        throw new UnauthorizedException(
          `You do not have permission to add scholarships to university ${createScholarshipDto.universityId}.`,
        );
      }
    }

    return this.scholarshipsRepository.createScholarship(
      createScholarshipDto,
      advisor,
    );
  }

  async getScholarshipById(id: string): Promise<Scholarship> {
    return this.scholarshipsRepository.findById(id);
  }

  async getScholarshipsByAdvisor(advisorId: string): Promise<Scholarship[]> {
    return this.scholarshipsRepository.findByAdvisor(advisorId);
  }

  async getAllScholarships(): Promise<Scholarship[]> {
    return this.scholarshipsRepository.findAll();
  }

  async updateScholarship(
    id: string,
    advisor: User,
    updateScholarshipDto: UpdateScholarshipDto,
  ): Promise<Scholarship> {
    if (advisor.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can update scholarships.');
    }
    // Repository method handles checking ownership and updating
    return this.scholarshipsRepository.updateScholarship(
      id,
      advisor.id,
      updateScholarshipDto,
    );
  }

  async removeScholarship(id: string, advisor: User): Promise<void> {
    if (advisor.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can delete scholarships.');
    }
    // The repository method already checks if the advisor owns the scholarship
    await this.scholarshipsRepository.deleteScholarship(id, advisor.id);
  }
}
