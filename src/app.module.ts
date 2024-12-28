import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // Correct IP of the PostgreSQL container
      port: 5432,
      username: 'mohamed', // Correct username
      password: 'asd', // Correct password
      database: 'idecide', // Correct database name
      autoLoadEntities: true,
      synchronize: true,
    }),

    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
