import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  HttpException, // Keep for generic cases if needed, but prefer specifics
  HttpStatus,
  Logger, // Import Logger
} from '@nestjs/common';
import { User, UserType } from './user.entity';
import { MoreThan, Repository } from 'typeorm'; // Import MoreThan for date comparison
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './student.entity';
import { Advisor } from './advisor.entity';
import { Admin } from './admin.entity'; // Import Admin
import * as bcrypt from 'bcrypt';

import { SignupDto } from '../dto/signup.dto';
import { SigninDto } from '../dto/signin.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name); // Add logger instance

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(Advisor)
    private readonly advisorRepository: Repository<Advisor>,

    @InjectRepository(Admin) // Inject Admin repository
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async updateChatbotStatus(userId: string, status: boolean): Promise<void> {
    let student: Student;
    try {
      student = await this.studentRepository.findOne({
        where: { user: { id: userId } },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Database error checking for student.',
      );
    }

    if (!student) {
      throw new NotFoundException(
        `Student associated with user ID ${userId} not found`,
      );
    }

    try {
      student.chatbotCompleted = status;
      await this.studentRepository.save(student);
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to update chatbot status.',
      );
    }
  }

  async findStudentByUserId(userId: string): Promise<Student | null> {
    try {
      return await this.studentRepository.findOne({
        where: { user: { id: userId } },
      });
    } catch (err) {
      throw new InternalServerErrorException('Database error finding student.');
    }
  }

  async findAdvisorByUserId(userId: string): Promise<Advisor | null> {
    try {
      return await this.advisorRepository.findOne({
        where: { user: { id: userId } },
      });
    } catch (err) {
      throw new InternalServerErrorException('Database error finding advisor.');
    }
  }

  async findAdminByUserId(userId: string): Promise<Admin | null> {
    // Add findAdminByUserId
    try {
      return await this.adminRepository.findOne({
        where: { user: { id: userId } },
      });
    } catch (err) {
      throw new InternalServerErrorException('Database error finding admin.');
    }
  }

  async createUser(signupDto: SignupDto): Promise<User> {
    const { name, password, email, type } = signupDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const existingUserName = await this.userRepository.findOne({
      where: { name },
    });
    if (existingUserName) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      name,
      password: hashedPassword,
      email,
      type,
    });

    let savedUser: User;
    try {
      savedUser = await this.userRepository.save(user);
    } catch (err) {
      if (err.code === '23505') {
        if (err.detail?.includes('email')) {
          throw new ConflictException('Email already exists');
        }
        if (err.detail?.includes('name')) {
          throw new ConflictException('Username already exists');
        }
      }
      throw new InternalServerErrorException('Failed to save user.');
    }

    try {
      if (type === UserType.STUDENT) {
        const student = this.studentRepository.create({ user: savedUser });
        await this.studentRepository.save(student);
      } else if (type === UserType.ADVISOR) {
        const advisor = this.advisorRepository.create({ user: savedUser });
        await this.advisorRepository.save(advisor);
      } else if (type === UserType.ADMIN) {
        // Handle ADMIN type
        const admin = this.adminRepository.create({ user: savedUser });
        await this.adminRepository.save(admin);
      } else {
        throw new BadRequestException('Invalid user type specified.');
      }
      return savedUser;
    } catch (err) {
      // Consider more specific error handling if needed
      throw new InternalServerErrorException(
        'Failed to create associated student/advisor/admin profile.',
      );
    }
  }

  async validateUser(signinDto: SigninDto): Promise<User> {
    const { email, password } = signinDto;
    let user: User;
    try {
      user = await this.userRepository.findOne({ where: { email } });
    } catch (err) {
      throw new InternalServerErrorException('Database error during sign-in.');
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const result = await this.userRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      console.error(`Failed to delete user ${id}:`, err);
      throw new InternalServerErrorException('Failed to delete user.');
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      console.log('user is ', user);

      return user;
    } catch (err) {
      throw new InternalServerErrorException(
        'Database error finding user by ID.',
      );
    }
  }

  async updateUserProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    console.log(updateProfileDto);

    try {
      await this.userRepository.update(
        { id: userId },
        {
          name: updateProfileDto.name,
          email: updateProfileDto.email,
          DateOfBirth: updateProfileDto.dateOfBirth,
          Government: updateProfileDto.government,
          District: updateProfileDto.district,
          city: updateProfileDto.city,
          phoneNumber: updateProfileDto.phoneNumber,
          gender: updateProfileDto.gender,
          preferredCommunication: updateProfileDto.preferredCommunication,
        },
      );
    } catch (error) {
      this.logger.error(
        `Error updating user profile for user ${userId}: ${error.message}`,
        error.stack,
      );
      // Handle potential unique constraint errors (e.g., email already exists)
      if (error.code === '23505') {
        throw new ConflictException('Email or Username already exists');
      }
      throw new InternalServerErrorException('Failed to update user profile.');
    }

    try {
      if (user.type === UserType.STUDENT) {
        const student = await this.findStudentByUserId(userId);
        if (!student) {
          // This case might indicate inconsistent data, but we handle it
          this.logger.warn(
            `Student profile not found for user ${userId} during profile update.`,
          );
          // Optionally create the student profile here if it makes sense in your logic
          // throw new NotFoundException(`Student associated with user ID ${userId} not found`);
        } else {
          await this.studentRepository.update(
            { id: student.id },
            {
              certificateType: updateProfileDto.certificateType || null,
              totalScore: updateProfileDto.totalScore || null,
              nationality: updateProfileDto.nationality || null,
            },
          );
        }
      } else if (user.type === UserType.ADMIN) {
        const admin = await this.findAdminByUserId(userId);
        if (!admin) {
          this.logger.warn(
            `Admin profile not found for user ${userId} during profile update.`,
          );
          // Optionally create the admin profile here if it makes sense
          // throw new NotFoundException(`Admin associated with user ID ${userId} not found`);
        } else {
          // Update admin-specific fields if any are included in UpdateProfileDto
          // await this.adminRepository.update({ id: admin.id }, { /* admin fields */ });
        }
      }
      // Add else if for Advisor if they have specific fields to update
    } catch (error) {
      this.logger.error(
        `Error updating associated profile (student/admin) for user ${userId}: ${error.message}`,
        error.stack,
      );
      // Avoid throwing InternalServerError if the primary user update succeeded.
      // Maybe just log the error or handle it based on business logic.
      // Consider if this part failing should roll back the user update (requires transactions).
    }
  }

  // --- Methods for Password Reset ---

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      return user; // Returns null if not found, which is handled in AuthService
    } catch (error) {
      this.logger.error(
        `Database error finding user by email ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Database error finding user by email.',
      );
    }
  }

  async updateResetToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    try {
      const result = await this.userRepository.update(
        { id: userId },
        {
          resetPasswordToken: token,
          resetPasswordExpires: expires,
        },
      );

      if (result.affected === 0) {
        // This shouldn't happen if findByEmail succeeded, but good practice to check
        throw new NotFoundException(
          `User with ID ${userId} not found for reset token update.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Database error updating reset token for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to update password reset token.',
      );
    }
  }

  async findByResetToken(hashedToken: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: MoreThan(new Date()), // Check if expiry is in the future
        },
      });
      return user; // Returns null if not found or expired
    } catch (error) {
      this.logger.error(
        `Database error finding user by reset token: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Database error finding user by reset token.',
      );
    }
  }

  async updatePasswordAndClearResetToken(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    try {
      const result = await this.userRepository.update(
        { id: userId },
        {
          password: hashedPassword,
          resetPasswordToken: null, // Clear the token
          resetPasswordExpires: null, // Clear the expiry
        },
      );

      if (result.affected === 0) {
        throw new NotFoundException(
          `User with ID ${userId} not found for password update.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Database error updating password for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update password.');
    }
  }
  // --------------------------------
}
