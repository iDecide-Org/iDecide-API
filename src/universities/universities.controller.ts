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
  Patch,
  BadRequestException, // Import BadRequestException
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
import { HttpService } from '@nestjs/axios'; // Import HttpService
import { firstValueFrom } from 'rxjs'; // Import firstValueFrom

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
    private readonly httpService: HttpService, // Inject HttpService
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

  // Helper function to validate university name against Wikidata
  private async isValidUniversityName(name: string): Promise<boolean> {
    const sparqlQuery = `
      SELECT ?univ ?enLabel ?arLabel WHERE {
        ?univ wdt:P31 wd:Q3918;         # instance of University
               wdt:P17 wd:Q79.          # country = Egypt

        OPTIONAL {
          ?univ rdfs:label ?enLabel .
          FILTER(LANG(?enLabel) = "en")
        }

        OPTIONAL {
          ?univ rdfs:label ?arLabel .
          FILTER(LANG(?arLabel) = "ar")
        }
      }
    `;
    const endpointUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(
      sparqlQuery,
    )}&format=json`;

    try {
      this.logger.debug(`Querying Wikidata for university: ${name}`);
      const response = await firstValueFrom(
        this.httpService.get(endpointUrl, {
          headers: { Accept: 'application/sparql-results+json' },
        }),
      );

      const bindings = response.data?.results?.bindings;
      if (!bindings) {
        this.logger.warn('No bindings found in Wikidata response.');
        return false; // Or handle as an error depending on requirements
      }

      // Check if any result has a matching Arabic label (case-insensitive)
      const isValid = bindings.some(
        (binding: any) =>
          binding.arLabel?.value?.toLowerCase() === name.toLowerCase(),
      );

      this.logger.debug(`Wikidata validation result for "${name}": ${isValid}`);
      return isValid;
    } catch (error) {
      this.logger.error(
        `Error querying Wikidata SPARQL endpoint: ${error.message}`,
        error.stack,
      );
      // Decide how to handle errors - fail validation or allow if Wikidata is down?
      // For now, let's consider it invalid if the check fails.
      return false;
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

    const user = await this.getUserFromRequest(request);

    // --- Validation Step ---
    const isValidName = await this.isValidUniversityName(
      createUniversityDto.name,
    );
    if (!isValidName) {
      throw new BadRequestException(
        `University name "${createUniversityDto.name}" is not a recognized university in Egypt according to Wikidata.`,
      );
    }
    // --- End Validation Step ---

    const imagePath = file ? `/uploads/universities/${file.filename}` : null; // Correctly use file path if uploaded

    return this.universitiesService.addUniversity(
      createUniversityDto,
      imagePath, // Pass the actual path or null
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

  @Patch(':id')
  // @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image', { storage })) // 'image' should match the field name in the form
  async updateUniversity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe())
    updateUniversityDto: Partial<CreateUniversityDto>, // Use Partial for updates
    @UploadedFile() file: Express.Multer.File, // Use imported Express type
    @Req() request: Request,
  ) {
    const user = await this.getUserFromRequest(request);

    // --- Optional: Add validation for name change during update ---
    if (updateUniversityDto.name) {
      const isValidName = await this.isValidUniversityName(
        updateUniversityDto.name,
      );
      if (!isValidName) {
        throw new BadRequestException(
          `University name "${updateUniversityDto.name}" is not a recognized university in Egypt according to Wikidata.`,
        );
      }
    }
    // --- End Validation Step ---

    // Determine image path: use new file if uploaded, otherwise keep existing or use DTO value
    let imagePath: string | null | undefined = undefined; // undefined means don't update image path
    if (file) {
      imagePath = `/uploads/universities/${file.filename}`;
    } else if (updateUniversityDto.image !== undefined) {
      // Allow explicitly setting image path via DTO (e.g., to null or a different path)
      imagePath = updateUniversityDto.image;
    }

    return this.universitiesService.updateUniversity(
      id,
      updateUniversityDto,
      imagePath, // Pass the determined path
      user,
    );
  }
}
