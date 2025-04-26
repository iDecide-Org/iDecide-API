import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { User } from '../auth/users/user.entity'; // Import User for advisor relation

export enum ScholarshipType {
  FULL = 'كاملة',
  PARTIAL = 'جزئية',
}

export enum ScholarshipCoverage {
    TUITION = 'رسوم دراسية',
    LIVING_EXPENSES = 'مصاريف معيشة',
    TRAVEL = 'سفر',
    OTHER = 'أخرى',
}

@Entity()
export class Scholarship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Name of the scholarship

  @Column()
  provider: string; // Who is providing the scholarship (e.g., university name, organization)

  @Column({
    type: 'enum',
    enum: ScholarshipType,
  })
  type: ScholarshipType; // Full or Partial

  @Column('text')
  description: string;

  @Column('text') // Eligibility criteria
  eligibility: string;

  @Column()
  deadline: Date; // Application deadline

  @Column()
  link: string; // Link to the scholarship application/details page

  @Column({
      type: 'simple-array', // Store coverage options as an array of strings
      nullable: true,
  })
  coverage: ScholarshipCoverage[]; // What the scholarship covers

  @Column({ nullable: true }) // Optional: Target country
  country?: string;

  @Column({ nullable: true }) // Optional: Target field of study
  fieldOfStudy?: string;

  @ManyToOne(() => User, (user) => user.createdScholarships) // Link to the advisor (User) who added it
  @JoinColumn({ name: 'advisorId' })
  advisor: User;

  @Column() // Store the advisor's ID directly
  advisorId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relation for users who favorited this scholarship
  @ManyToMany(() => User, user => user.favoriteScholarshipLinks) // Corrected property name
  favoritedBy: User[];
}

// Add createdScholarships relation to User entity
import { OneToMany } from 'typeorm';

// Add this to User entity in user.entity.ts:
// @OneToMany(() => Scholarship, (scholarship) => scholarship.advisor)
// createdScholarships: Scholarship[];
