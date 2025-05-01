import { User } from '../auth/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Scholarship } from '../scholarships/scholarship.entity'; // Import Scholarship
import { College } from '../colleges/entities/college.entity'; // Import College

export enum UniversityType {
  GOVERNMENTAL = 'حكومية',
  PRIVATE = 'خاصة',
  NATIONAL = 'أهلية', // Ahleya
}

@Entity()
@Unique(['advisorId']) // Add unique constraint for advisorId
export class University {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  location: string;

  @Column({
    type: 'enum',
    enum: UniversityType,
  })
  type: UniversityType;

  @Column({ type: 'int' }) // Use integer for year
  establishment: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  collegesCount: number;

  @Column({ type: 'int' })
  majorsCount: number;

  @Column({ nullable: true }) // Allow null for optional fields
  website: string;

  @Column({ nullable: true }) // Allow null for optional fields
  phone: string;

  @Column({ nullable: true }) // Allow null for optional fields
  email: string;

  @Column({ nullable: true }) // Store image path or URL
  image: string;

  @OneToOne(() => User, (user) => user.createdUniversity, {
    onDelete: 'SET NULL',
    nullable: true,
  }) // Link to the advisor (User), set null on delete
  @JoinColumn({ name: 'advisorId' }) // Explicitly name the foreign key column
  advisor: User;

  @Column({ nullable: true, unique: true }) // Ensure advisorId column itself is marked unique
  advisorId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' }) // Add onDelete: 'CASCADE'
  @JoinColumn({ name: 'addedById' })
  addedBy: User;

  @Column({ nullable: true }) // Allow nulls for existing rows
  addedById: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Scholarship, (scholarship) => scholarship.university) // Add relation to Scholarship
  // return all scholarships related to this university
  scholarships: Scholarship[];

  @OneToMany(() => College, (college) => college.university) // Add relation to College
  colleges: College[];
}
