import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule if you use it for env vars
import { EmailService } from './email.service';

@Module({
  imports: [
    ConfigModule, // Import ConfigModule if you use it to load environment variables
  ],
  providers: [EmailService],
  exports: [EmailService], // Export EmailService so other modules can use it
})
export class EmailModule {}
