import {
  Injectable,
  UnauthorizedException,
  NotFoundException, // Import NotFoundException
} from '@nestjs/common';
import { MajorsRepository } from './majors.repository';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { Major } from './entities/major.entity';
import { User } from '../auth/users/user.entity'; // Import User

@Injectable()
export class MajorsService {
  constructor(private readonly majorsRepository: MajorsRepository) {}

  async create(createMajorDto: CreateMajorDto, user: User): Promise<Major> {
    if (user.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can create majors.');
    }

    const college = await this.majorsRepository.findCollegeWithUniversity(
      createMajorDto.collegeId,
    );

    if (!college) {
      throw new NotFoundException(
        `College with ID ${createMajorDto.collegeId} not found.`,
      );
    }

    if (college.university.advisorId !== user.id) {
      throw new UnauthorizedException(
        'You do not own the university associated with this college.',
      );
    }

    // Prepare major data
    const majorData = {
      ...createMajorDto,
      college,
      collegeId: college.id,
    };

    return this.majorsRepository.create(majorData);
  }

  async findAll(): Promise<Major[]> {
    return this.majorsRepository.findAll(['college', 'college.university']);
  }

  async findAllByCollege(collegeId: string): Promise<Major[]> {
    // TODO: Consider if authorization is needed here (e.g., only advisor of parent university can list)
    return this.majorsRepository.findByCollege(collegeId, [
      'college',
      'college.university',
    ]);
  }

  async findOne(id: string): Promise<Major> {
    const major = await this.majorsRepository.findById(id, [
      'college',
      'college.university',
    ]);
    if (!major) {
      throw new NotFoundException(`Major with ID ${id} not found`);
    }
    // TODO: Consider if authorization is needed here (e.g., only advisor of parent university can view)
    return major;
  }

  async update(
    id: string,
    updateMajorDto: UpdateMajorDto,
    user: User,
  ): Promise<Major> {
    if (user.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can update majors.');
    }

    const major = await this.majorsRepository.findById(id, [
      'college',
      'college.university',
    ]);
    if (!major) {
      throw new NotFoundException(`Major with ID ${id} not found`);
    }

    if (major.college.university.advisorId !== user.id) {
      throw new UnauthorizedException(
        'You do not have permission to update this major.',
      );
    }

    return this.majorsRepository.update(id, updateMajorDto);
  }

  async remove(id: string, user: User): Promise<void> {
    if (user.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can delete majors.');
    }

    const major = await this.majorsRepository.findById(id, [
      'college',
      'college.university',
    ]);
    if (!major) {
      throw new NotFoundException(`Major with ID ${id} not found`);
    }

    if (major.college.university.advisorId !== user.id) {
      throw new UnauthorizedException(
        'You do not have permission to delete this major.',
      );
    }
    await this.majorsRepository.delete(id);
  }
}
