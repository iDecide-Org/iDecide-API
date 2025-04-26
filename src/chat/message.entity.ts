import { User } from '../auth/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sentMessages, { eager: true, onDelete: 'CASCADE' }) // Add onDelete: 'CASCADE'
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedMessages, { eager: true, onDelete: 'CASCADE' }) // Add onDelete: 'CASCADE'
  receiver: User;

  @Column('text')
  content: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ default: false })
  read: boolean;
}
