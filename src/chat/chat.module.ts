import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './message.entity';
import { User } from '../auth/users/user.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule
// Import potentially missing entities if ChatService needs their repositories
import { Student } from '../auth/users/student.entity';
import { Advisor } from '../auth/users/advisor.entity';
import { Admin } from '../auth/users/admin.entity';

@Module({
  imports: [
    // Add Student, Advisor, Admin if ChatService needs direct access to their repositories
    TypeOrmModule.forFeature([Message, User, Student, Advisor, Admin]),
    AuthModule, // Provides UserRepository, AuthService, JwtService
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService], // Export ChatService if needed by other modules
})
export class ChatModule {}
