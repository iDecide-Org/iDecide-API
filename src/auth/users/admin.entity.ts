import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Add any admin-specific properties here later if needed

  @OneToOne(() => User, (user) => user.admin, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
