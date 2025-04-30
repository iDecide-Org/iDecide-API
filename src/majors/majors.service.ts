import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    // Repository method handles checking if advisor owns the parent university/college
    return this.majorsRepository.createMajor(createMajorDto, user.id);
  }

  async findAllByCollege(collegeId: string): Promise<Major[]> {
    // Public access? Or check ownership?
    return this.majorsRepository.findAllByCollege(collegeId);
  }

  async findOne(id: string): Promise<Major> {
    // Public access? Or check ownership?
    return this.majorsRepository.findOneById(id);
  }

  async update(
    id: string,
    updateMajorDto: UpdateMajorDto,
    user: User,
  ): Promise<Major> {
    if (user.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can update majors.');
    }
    // Repository method handles checking ownership
    return this.majorsRepository.updateMajor(id, updateMajorDto, user.id);
  }

  async remove(id: string, user: User): Promise<void> {
    if (user.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can delete majors.');
    }
    // Repository method handles checking ownership
    await this.majorsRepository.removeMajor(id, user.id);
  }
}
