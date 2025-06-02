import { PartialType } from '@nestjs/swagger';
import { CreateCollegeDto } from './create-college.dto';

export class UpdateCollegeDto extends PartialType(CreateCollegeDto) {
  // All fields from CreateCollegeDto are now optional with same validation rules
  // This approach is more maintainable than duplicating validation rules
}
