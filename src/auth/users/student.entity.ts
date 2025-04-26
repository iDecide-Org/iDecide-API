import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum CertificateType {
  EGYPTIAN_HIGH_SCHOOL = 'egyptian_high_school', // More specific
  // Add other certificate types as needed (IGCSE, American Diploma, etc.)
  BACHELOR = 'bachelor',
  MASTER = 'master',
  PHD = 'phd',
}

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CertificateType,
    nullable: true,
  })
  certificateType: CertificateType; // Renamed for clarity

  @Column({ nullable: true })
  CertificatePic: string;

  @Column({ nullable: true })
  StudyDivision: string;

  @Column({ type: 'float', nullable: true })
  totalScore: number; // Renamed for clarity

  @Column({ nullable: true }) // Add nationality field
  nationality: string;

  @Column({ default: false })
  isStudentCertified: boolean;

  @Column({ default: false })
  isAlumni: boolean;

  @Column({ default: false })
  isAlumniCertified: boolean;

  @Column({ default: false })
  chatbotCompleted: boolean;

  @OneToOne(() => User, (user) => user.student, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
