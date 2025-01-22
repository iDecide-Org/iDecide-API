import { Injectable } from '@nestjs/common';
import { User, UserType } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './student.entity';
import { Advisor } from './advisor.entity';
import * as bcrypt from 'bcrypt';

import { HttpException, HttpStatus } from '@nestjs/common';
import { SignupDto } from '../dto/signup.dto';
import { SigninDto } from '../dto/signin.dto';

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

  async updateChatbotStatus(userId: string, status: boolean): Promise<void> {
    try {
      const student = await this.studentRepository.findOne({
        where: { user: { id: userId } },
      });

      if (!student) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      student.chatbotCompleted = status;

      await this.studentRepository.save(student);
    } catch (err) {
      throw new HttpException(
        err.message || 'Internal server error',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findStudentByUserId(userId: string): Promise<Student> {
    try {
      return await this.studentRepository.findOne({
        where: { user: { id: userId } },
      });
    } catch (err) {
      throw new HttpException(
        err.message || 'Internal server error',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createUser(signupDto: SignupDto): Promise<User> {
    const { name, password, email, type } = signupDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      name,
      password: hashedPassword,
      email,
      type,
    });

    try {
      const savedUser = await this.userRepository.save(user);

      if (type === UserType.STUDENT) {
        const student = this.studentRepository.create({ user: savedUser });
        await this.studentRepository.save(student);
      } else if (type === UserType.ADVISOR) {
        const advisor = this.advisorRepository.create({ user: savedUser });
        await this.advisorRepository.save(advisor);
      } else {
        throw new HttpException('Invalid user type', HttpStatus.BAD_REQUEST);
      }

      return savedUser;
    } catch (err) {
      throw new HttpException(
        err.message || 'Internal server error',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async validateUser(signinDto: SigninDto): Promise<User> {
    const { email, password } = signinDto;

    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      return user; // Return the user object for further processing
    } catch (err) {
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

  async findById(id: string): Promise<User> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (err) {
      throw new HttpException(
        err.message || 'Internal server error',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
