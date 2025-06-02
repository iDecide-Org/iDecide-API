import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './users/users.repository';
import { User } from './users/user.entity';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class UserEnrichmentService {
  constructor(private userRepository: UserRepository) {}

  async enrichUser(user: User) {
    const transformedUser = instanceToPlain(user);

    if (user.type === 'student') {
      const student = await this.userRepository.findStudentByUserId(user.id);
      if (!student) throw new UnauthorizedException('Student not found');
      return { ...student, ...transformedUser };
    }

    if (user.type === 'advisor') {
      const advisor = await this.userRepository.findAdvisorByUserId(user.id);
      return {
        ...advisor,
        ...transformedUser,
        advisorId: advisor.id,
      };
    }

    if (user.type === 'admin') {
      const admin = await this.userRepository.findAdminByUserId(user.id);
      return { ...transformedUser, ...admin };
    }

    throw new UnauthorizedException('Unknown user type');
  }
}
