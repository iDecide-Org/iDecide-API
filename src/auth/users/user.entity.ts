import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn, // Import JoinColumn
} from 'typeorm';
import { Student } from './student.entity';
import { Advisor } from './advisor.entity';
import { Message } from '../../chat/message.entity'; // Import Message entity
import { University } from '../../universities/university.entity'; // Import University entity
import { Scholarship } from '../../scholarships/scholarship.entity'; // Import Scholarship entity
import { FavoriteUniversity } from '../../favorites/favorite-university.entity'; // Import FavoriteUniversity
import { FavoriteScholarship } from '../../favorites/favorite-scholarship.entity'; // Import FavoriteScholarship
import { Admin } from './admin.entity'; // Import Admin entity
import { Exclude } from 'class-transformer';

export enum UserType {
  STUDENT = 'student',
  ADVISOR = 'advisor',
  ADMIN = 'admin', // Add ADMIN type
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude() // Exclude password from serialization
  password: string;

  @Column({ nullable: true }) // Allow null for profile pic initially
  ProfilePicid: string;

  @Column({ type: 'enum', enum: UserType, default: UserType.STUDENT })
  type: UserType;

  @Column({ type: 'date', nullable: true }) // Use 'date' type, allow null
  DateOfBirth: Date;

  @Column({ nullable: true })
  Government: string;

  @Column({ nullable: true })
  District: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true }) // Allow null for phone number initially
  phoneNumber: string;

  @Column({ nullable: true }) // Allow null for gender initially
  gender: string; // Consider using an enum: 'male', 'female', 'other'

  @Column({ nullable: true }) // Allow null initially
  preferredCommunication: string; // e.g., 'phone', 'email', 'whatsapp'

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToOne(() => Student, (student) => student.user, { nullable: true })
  @JoinColumn() // Add JoinColumn for clarity, though TypeORM might infer it
  student: Student;

  @OneToOne(() => Advisor, (advisor) => advisor.user, { nullable: true })
  @JoinColumn() // Add JoinColumn
  advisor: Advisor;

  @OneToOne(() => Admin, (admin) => admin.user, { nullable: true }) // Add relation to Admin
  @JoinColumn() // Add JoinColumn
  admin: Admin;

  @OneToMany(() => Message, (message) => message.sender) // Relation for sent messages
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.receiver) // Relation for received messages
  receivedMessages: Message[];

  // --- Favorites --- Use OneToMany with the join entity
  @OneToMany(() => FavoriteUniversity, (fav) => fav.user)
  favoriteUniversityLinks: FavoriteUniversity[]; // Join entity for universities

  @OneToMany(() => FavoriteScholarship, (fav) => fav.user)
  favoriteScholarshipLinks: FavoriteScholarship[]; // Join entity for scholarships

  // --- Created Items (for Advisors) ---
  @OneToOne(() => University, (university) => university.advisor) // Relation for the university created by advisor
  createdUniversity: University; // Rename from createdUniversities

  @OneToMany(() => Scholarship, (scholarship) => scholarship.advisor) // Relation for scholarships created by advisor
  createdScholarships: Scholarship[];
}
