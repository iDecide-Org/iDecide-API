import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet'; // Import helmet
import { ValidationPipe } from '@nestjs/common'; // Import ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Middleware
  app.use(helmet()); // Apply helmet middleware
  app.use(cookieParser());

  // CORS Configuration
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Add the new origin
    credentials: true,
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow basic type conversions (e.g., string to number for path params)
      },
    }),
  );

  // Global Prefix
  app.setGlobalPrefix('api');

  // Start Listening
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`); // Log the running URL
}
bootstrap();
