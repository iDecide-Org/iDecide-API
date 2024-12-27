import { Injectable } from '@nestjs/common';
import { User, UserType } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto } from './dto/signup.dto';
import { Student } from './student.entity';
import { Advisor } from './advisor.entity';
import { SigninDto } from './dto/signin.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(Advisor)
    private readonly advisorRepository: Repository<Advisor>,
  ) {}

  async createUser(signupDto: SignupDto): Promise<void> {
    const { name, password, email, type } = signupDto;

    // Create a new User instance
    const user = this.userRepository.create({
      name,
      password,
      email,
      type,
    });

    try {
      // Save the User entity first
      const savedUser = await this.userRepository.save(user);

      // If the user type is 'student', create and link the Student entity
      if (type === UserType.STUDENT) {
        const student = this.studentRepository.create({
          user: savedUser, // Establish the relationship
        });

        // Save the Student entity
        await this.studentRepository.save(student);
      } else if (type === UserType.ADVISOR) {
        const advisor = this.advisorRepository.create({
          user: savedUser, // Establish the relationship
        });

        // Save the Advisor entity
        await this.advisorRepository.save(advisor);
      }
    } catch (err) {
      console.log(err.message);
    }
  }
  async validateUser(
    signinDto: SigninDto,
  ): Promise<{ success: boolean; message: string }> {
    const { email, password } = signinDto;

    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (user && user.password === password) {
        return { success: true, message: 'Login successful' };
      } else {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
    } catch (err) {
      // For other errors, throw a generic internal server error
      throw new HttpException(
        err.message || 'Internal server error',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async deleteUser(id: string): Promise<void> {
    try {
      await this.userRepository.delete(id);
    } catch (err) {
      console.log(err.message);
    }
  }
}
