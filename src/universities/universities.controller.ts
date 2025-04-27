import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Req,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ParseUUIDPipe,
  ValidationPipe,
  Logger,
  Patch, // Import Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UniversitiesService } from './universities.service';
import { CreateUniversityDto } from './dto/create-university.dto';
// import { AuthGuard } from '../auth/auth.guard'; // Assuming you have an AuthGuard
import { Request, Express } from 'express'; // Import Express
import { JwtService } from '@nestjs/jwt'; // To verify JWT
import { UserRepository } from '../auth/users/users.repository'; // To get user details

// Configure Multer Storage
const storage = diskStorage({
  destination: './uploads/universities', // Choose your upload directory
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@Controller('universities')
export class UniversitiesController {
  // Add a logger instance
  private readonly logger = new Logger(UniversitiesController.name);

  constructor(
    private readonly universitiesService: UniversitiesService,
    private readonly jwtService: JwtService, // Inject JwtService
    private readonly userRepository: UserRepository, // Inject UserRepository
  ) {}

  // Helper to get user from request
  private async getUserFromRequest(request: Request) {
    // Log headers inside the function that checks for the token
    this.logger.debug(
      'Incoming headers in getUserFromRequest:',
      request.headers,
    );
    this.logger.debug(
      'Incoming cookies in getUserFromRequest:',
      request.cookies,
    );

    let token = request.cookies['jwt'];
    if (!token) {
      const authHeader = request.headers['authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }
    if (!token) {
      throw new UnauthorizedException('JWT not found.');
    }
    try {
      const data = await this.jwtService.verifyAsync(token);
      if (!data || !data['id']) {
        throw new UnauthorizedException('Invalid JWT data.');
      }
      const user = await this.userRepository.findById(data['id']);
      if (!user) {
        throw new UnauthorizedException('User not found.');
      }
      return user;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired JWT.');
    }
  }

  @Post()
  // @UseGuards(AuthGuard) // Protect this route
  @UseInterceptors(FileInterceptor('image', { storage })) // 'image' should match the field name in the form
  async addUniversity(
    @Body(new ValidationPipe()) createUniversityDto: CreateUniversityDto,
    @UploadedFile() file: Express.Multer.File, // Use imported Express type
    @Req() request: Request,
  ) {
    // Log headers when the request first hits the controller method
    this.logger.debug('Incoming headers in addUniversity:', request.headers);
    this.logger.debug('Incoming cookies in addUniversity:', request.cookies);

    // if (!file) {
    //   // Handle case where file is not uploaded, maybe throw BadRequestException
    //   throw new Error('University image is required.');
    // }
    const user = await this.getUserFromRequest(request);
    const imagePath = '/'; // Or construct a URL if serving files statically
    return this.universitiesService.addUniversity(
      createUniversityDto,
      imagePath,
      user,
    );
  }

  @Get('/advisor') // Route specifically for advisors to get their universities
  // @UseGuards(AuthGuard)
  async getAdvisorUniversities(@Req() request: Request) {
    // Add specific logging here to see what this route receives
    this.logger.debug('>>> ENTERING getAdvisorUniversities <<<');
    this.logger.debug('Headers in getAdvisorUniversities:', request.headers);
    this.logger.debug('Cookies in getAdvisorUniversities:', request.cookies); // <-- Check this log output

    const user = await this.getUserFromRequest(request);
    if (user.type !== 'advisor') {
      throw new UnauthorizedException(
        'Only advisors can access this resource.',
      );
    }
    return this.universitiesService.getUniversitiesByAdvisor(user.id);
  }

  @Get() // General route for everyone (e.g., students)
  // No AuthGuard needed if public
  async getAllUniversities() {
    return this.universitiesService.getAllUniversities();
  }

  @Get(':id')
  // No AuthGuard needed if public
  async getUniversity(@Param('id', ParseUUIDPipe) id: string) {
    return this.universitiesService.getUniversityById(id);
  }

  @Delete(':id')
  // @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT) // Return 204 on successful deletion
  async removeUniversity(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = await this.getUserFromRequest(request);
    await this.universitiesService.removeUniversity(id, user);
    // No need to return anything on success (NO_CONTENT)
  }

  // Add Patch or Put methods if needed for updating universities
  @Patch(':id')
  // @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image', { storage })) // 'image' should match the field name in the form
  async updateUniversity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe()) createUniversityDto: CreateUniversityDto,
    @UploadedFile() file: Express.Multer.File, // Use imported Express type
    @Req() request: Request,
  ) {
    const user = await this.getUserFromRequest(request);
    const imagePath = createUniversityDto.image || '/'; // Or construct a URL if serving files statically
    console.log('user');

    return this.universitiesService.updateUniversity(
      id,
      createUniversityDto,
      imagePath,
      user,
    );
  }
}
