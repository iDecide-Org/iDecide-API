import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UniversitiesRepository } from './universities.repository';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { University } from './university.entity';
import { User, UserType } from '../auth/users/user.entity';

@Injectable()
export class UniversitiesService {
  constructor(
    private readonly universitiesRepository: UniversitiesRepository,
  ) {}

  async addUniversity(
    createUniversityDto: CreateUniversityDto,
    imagePath: string | null,
    advisor: User,
  ): Promise<University> {
    // Authorization check
    if (advisor.type !== UserType.ADVISOR) {
      throw new UnauthorizedException('Only advisors can add universities.');
    }

    // Business logic: Check if advisor already has a university
    const existingUniversityForAdvisor =
      await this.universitiesRepository.findByAdvisorId(advisor.id);
    if (existingUniversityForAdvisor) {
      throw new ConflictException('Advisors can only add one university.');
    }

    // Business logic: Check name uniqueness
    const existingUniversityWithName =
      await this.universitiesRepository.findByName(createUniversityDto.name);
    if (existingUniversityWithName) {
      throw new ConflictException(
        `University with name "${createUniversityDto.name}" already exists.`,
      );
    }

    // Prepare university data
    const universityData = {
      ...createUniversityDto,
      establishment: parseInt(createUniversityDto.establishment, 10),
      collegesCount: parseInt(createUniversityDto.collegesCount, 10),
      majorsCount: parseInt(createUniversityDto.majorsCount, 10),
      image: imagePath,
      advisor,
      advisorId: advisor.id,
      addedBy: advisor,
      addedById: advisor.id,
    };

    return this.universitiesRepository.create(universityData);
  }

  async getUniversityById(id: string): Promise<University> {
    const university = await this.universitiesRepository.findById(id, [
      'advisor',
      'addedBy',
      'scholarships',
      'colleges',
    ]);
    if (!university) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }
    return university;
  }

  async getUniversitiesByAdvisor(
    advisorId: string,
  ): Promise<University | null> {
    return this.universitiesRepository.findByAdvisorId(advisorId, [
      'colleges',
      'scholarships',
    ]);
  }

  async getAllUniversities(): Promise<University[]> {
    return this.universitiesRepository.findAll([
      'advisor',
      'addedBy',
      'scholarships',
    ]);
  }

  async updateUniversity(
    id: string,
    updateUniversityDto: UpdateUniversityDto,
    imagePath: string | null | undefined,
    advisor: User,
  ): Promise<University> {
    // Authorization check
    if (advisor.type !== UserType.ADVISOR) {
      throw new UnauthorizedException('Only advisors can update universities.');
    }

    // Business logic: Verify ownership
    const existingUniversity = await this.universitiesRepository.findById(id);
    if (!existingUniversity) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }
    if (existingUniversity.advisorId !== advisor.id) {
      throw new UnauthorizedException(
        'You can only update your own university.',
      );
    }

    // Business logic: Check name uniqueness if name is being updated
    if (
      updateUniversityDto.name &&
      updateUniversityDto.name !== existingUniversity.name
    ) {
      const existingByName = await this.universitiesRepository.findByName(
        updateUniversityDto.name,
      );
      if (existingByName) {
        throw new ConflictException(
          `University with name "${updateUniversityDto.name}" already exists.`,
        );
      }
    }

    // Prepare update data
    const updateData: Partial<University> = {};
    if (updateUniversityDto.name) updateData.name = updateUniversityDto.name;
    if (updateUniversityDto.location)
      updateData.location = updateUniversityDto.location;
    if (updateUniversityDto.type) updateData.type = updateUniversityDto.type;
    if (updateUniversityDto.establishment)
      updateData.establishment = parseInt(
        updateUniversityDto.establishment,
        10,
      );
    if (updateUniversityDto.description)
      updateData.description = updateUniversityDto.description;
    if (updateUniversityDto.collegesCount)
      updateData.collegesCount = parseInt(
        updateUniversityDto.collegesCount,
        10,
      );
    if (updateUniversityDto.majorsCount)
      updateData.majorsCount = parseInt(updateUniversityDto.majorsCount, 10);
    if (updateUniversityDto.website)
      updateData.website = updateUniversityDto.website;
    if (updateUniversityDto.phone) updateData.phone = updateUniversityDto.phone;
    if (updateUniversityDto.email) updateData.email = updateUniversityDto.email;
    if (imagePath !== undefined) updateData.image = imagePath;

    return this.universitiesRepository.update(id, updateData);
  }

  async removeUniversity(id: string, advisor: User): Promise<void> {
    // Authorization check
    if (advisor.type !== UserType.ADVISOR) {
      throw new UnauthorizedException('Only advisors can delete universities.');
    }

    // Business logic: Verify ownership
    const university = await this.universitiesRepository.findById(id);
    if (!university) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }
    if (university.advisorId !== advisor.id) {
      throw new UnauthorizedException(
        'You can only delete your own university.',
      );
    }

    await this.universitiesRepository.delete(id);
  }
}
