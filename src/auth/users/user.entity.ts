import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Student } from './student.entity';
import { Advisor } from './advisor.entity';
export enum UserType {
  STUDENT = 'student',
  ADVISOR = 'advisor',
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
  password: string;

  @Column({ nullable: true })
  ProfilePicid: string;

  @Column({ type: 'enum', enum: UserType, default: UserType.STUDENT })
  type: UserType;

  @Column({ nullable: true })
  DateOfBirth: Date;

  @Column({ nullable: true })
  Government: string;

  @Column({ nullable: true })
  District: string;

  @Column({ nullable: true })
  City: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToOne(() => Student, (student) => student.user, { nullable: true })
  student: Student;

  @OneToOne(() => Advisor, (advisor) => advisor.user, { nullable: true })
  advisor: Advisor;
}
