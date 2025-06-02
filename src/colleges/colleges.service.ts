import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CollegesRepository } from './colleges.repository';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { College } from './entities/college.entity';
import { User, UserType } from '../auth/users/user.entity';

@Injectable()
export class CollegesService {
  constructor(private readonly collegesRepository: CollegesRepository) {}

  async create(
    createCollegeDto: CreateCollegeDto,
    user: User,
  ): Promise<College> {
    // Authorization check
    if (user.type !== UserType.ADVISOR) {
      throw new UnauthorizedException('Only advisors can create colleges.');
    }

    // Business logic: Verify university ownership
    const university = await this.collegesRepository.findUniversityById(
      createCollegeDto.universityId,
    );
    if (!university) {
      throw new NotFoundException('University not found');
    }
    if (university.advisorId !== user.id) {
      throw new UnauthorizedException(
        'You do not own the specified university.',
      );
    }

    // Prepare college data
    const collegeData = {
      ...createCollegeDto,
      university,
    };

    return this.collegesRepository.create(collegeData);
  }

  async findAll(): Promise<College[]> {
    return this.collegesRepository.findAll(['university', 'majors']);
  }

  async findAllByUniversity(universityId: string): Promise<College[]> {
    return this.collegesRepository.findByUniversity(universityId, [
      'university',
      'majors',
    ]);
  }

  async findOne(id: string): Promise<College> {
    const college = await this.collegesRepository.findById(id, [
      'university',
      'majors',
    ]);
    if (!college) {
      throw new NotFoundException(`College with ID ${id} not found`);
    }
    return college;
  }

  async update(
    id: string,
    updateCollegeDto: UpdateCollegeDto,
    user: User,
  ): Promise<College> {
    // Authorization check
    if (user.type !== UserType.ADVISOR) {
      throw new UnauthorizedException('Only advisors can update colleges.');
    }

    // Business logic: Verify ownership
    const college = await this.collegesRepository.findById(id, ['university']);
    if (!college) {
      throw new NotFoundException(`College with ID ${id} not found`);
    }
    if (college.university.advisorId !== user.id) {
      throw new UnauthorizedException(
        'You do not have permission to update this college.',
      );
    }

    return this.collegesRepository.update(id, updateCollegeDto);
  }

  async remove(id: string, user: User): Promise<void> {
    // Authorization check
    if (user.type !== UserType.ADVISOR) {
      throw new UnauthorizedException('Only advisors can delete colleges.');
    }

    // Business logic: Verify ownership
    const college = await this.collegesRepository.findById(id, ['university']);
    if (!college) {
      throw new NotFoundException(`College with ID ${id} not found`);
    }
    if (college.university.advisorId !== user.id) {
      throw new UnauthorizedException(
        'You do not have permission to delete this college.',
      );
    }

    await this.collegesRepository.delete(id);
  }
}
