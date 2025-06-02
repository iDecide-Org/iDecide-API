import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ScholarshipsRepository } from './scholarship.repository';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { Scholarship } from './scholarship.entity';
import { User, UserType } from '../auth/users/user.entity';
import { UniversitiesRepository } from '../universities/universities.repository';

@Injectable()
export class ScholarshipsService {
  constructor(
    private readonly scholarshipsRepository: ScholarshipsRepository,
    private readonly universitiesRepository: UniversitiesRepository,
  ) {}

  async createScholarship(
    createScholarshipDto: CreateScholarshipDto,
    advisor: User,
  ): Promise<Scholarship> {
    // Authorization check
    if (advisor.type !== UserType.ADVISOR) {
      throw new UnauthorizedException('Only advisors can create scholarships');
    }

    // Business logic: Verify university ownership
    const university = await this.universitiesRepository.findById(
      createScholarshipDto.universityId,
    );
    if (!university) {
      throw new NotFoundException('University not found');
    }
    if (university.advisorId !== advisor.id) {
      throw new UnauthorizedException(
        'You can only add scholarships to your own university',
      );
    }

    // Prepare scholarship data with proper type conversion
    const scholarshipData = {
      ...createScholarshipDto,
      deadline: new Date(createScholarshipDto.deadline), // Convert string to Date
      advisor,
      advisorId: advisor.id,
    };

    return this.scholarshipsRepository.create(scholarshipData);
  }

  async findById(id: string): Promise<Scholarship> {
    const scholarship = await this.scholarshipsRepository.findById(id, [
      'university',
    ]);
    if (!scholarship) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }
    return scholarship;
  }

  async findByAdvisor(advisorId: string): Promise<Scholarship[]> {
    return this.scholarshipsRepository.findByAdvisor(advisorId, ['university']);
  }

  async findByUniversity(universityId: string): Promise<Scholarship[]> {
    return this.scholarshipsRepository.findByUniversity(universityId, [
      'university',
    ]);
  }

  async findAll(): Promise<Scholarship[]> {
    return this.scholarshipsRepository.findAll(['university']);
  }

  private prepareScholarshipUpdateData(
    updateDto: UpdateScholarshipDto,
  ): Partial<Scholarship> {
    const updateData: Partial<Scholarship> = {};

    // Copy all properties except deadline
    const { deadline, ...otherProps } = updateDto;
    Object.assign(updateData, otherProps);

    // Handle deadline conversion
    if (deadline !== undefined) {
      updateData.deadline = new Date(deadline);
    }

    return updateData;
  }

  async updateScholarship(
    id: string,
    updateScholarshipDto: UpdateScholarshipDto,
    advisor: User,
  ): Promise<Scholarship> {
    // Authorization check
    if (advisor.type !== UserType.ADVISOR) {
      throw new UnauthorizedException('Only advisors can update scholarships');
    }

    // Business logic: Verify ownership
    const scholarship = await this.scholarshipsRepository.findByAdvisorAndId(
      advisor.id,
      id,
    );
    if (!scholarship) {
      throw new NotFoundException(
        'Scholarship not found or you do not have permission to update it',
      );
    }

    // Prepare update data with proper type conversion
    const updateData = this.prepareScholarshipUpdateData(updateScholarshipDto);

    return this.scholarshipsRepository.update(id, updateData);
  }

  async deleteScholarship(id: string, advisor: User): Promise<void> {
    // Authorization check
    if (advisor.type !== UserType.ADVISOR) {
      throw new UnauthorizedException('Only advisors can delete scholarships');
    }

    // Business logic: Verify ownership
    const scholarship = await this.scholarshipsRepository.findByAdvisorAndId(
      advisor.id,
      id,
    );
    if (!scholarship) {
      throw new NotFoundException(
        'Scholarship not found or you do not have permission to delete it',
      );
    }

    await this.scholarshipsRepository.delete(id);
  }
}
