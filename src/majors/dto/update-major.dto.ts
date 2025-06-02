import { PartialType } from '@nestjs/swagger';
import { CreateMajorDto } from './create-major.dto';

export class UpdateMajorDto extends PartialType(CreateMajorDto) {
  // All fields from CreateMajorDto are now optional with same validation rules
  // Note: collegeId is typically not updated after creation
}
