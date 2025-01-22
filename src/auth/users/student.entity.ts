import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum CertificateType {
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
  CertificateType: CertificateType;

  @Column({ nullable: true })
  CertificatePic: string;

  @Column({ nullable: true })
  StudyDivision: string;

  @Column({ type: 'float', nullable: true })
  TotalScore: number;

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
