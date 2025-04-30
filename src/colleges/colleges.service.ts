import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CollegesRepository } from './colleges.repository';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { College } from './entities/college.entity';
import { User } from '../auth/users/user.entity';

@Injectable()
export class CollegesService {
  constructor(private readonly collegesRepository: CollegesRepository) {}

  async create(
    createCollegeDto: CreateCollegeDto,
    user: User,
  ): Promise<College> {
    if (user.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can create colleges.');
    }
    // Repository method handles checking if advisor owns the university
    return this.collegesRepository.createCollege(createCollegeDto, user.id);
  }

  async findAll(): Promise<College[]> {
    return this.collegesRepository.findAll();
  }

  async findAllByUniversity(universityId: string): Promise<College[]> {
    // Public access? Or check ownership?
    return this.collegesRepository.findAllByUniversity(universityId);
  }

  async findOne(id: string): Promise<College> {
    // Public access? Or check ownership?
    return this.collegesRepository.findOneById(id);
  }

  async update(
    id: string,
    updateCollegeDto: UpdateCollegeDto,
    user: User,
  ): Promise<College> {
    if (user.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can update colleges.');
    }
    // Repository method handles checking ownership
    return this.collegesRepository.updateCollege(id, updateCollegeDto, user.id);
  }

  async remove(id: string, user: User): Promise<void> {
    if (user.type !== 'advisor') {
      throw new UnauthorizedException('Only advisors can delete colleges.');
    }
    // Repository method handles checking ownership
    await this.collegesRepository.removeCollege(id, user.id);
  }
}
