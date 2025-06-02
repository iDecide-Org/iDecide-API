import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common'; // Import Logger and InternalServerErrorException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../auth/users/user.entity';
import { UserRepository } from '../auth/users/users.repository'; // Import UserRepository
import { ChatGateway } from './chat.gateway'; // Import ChatGateway

// Export the interface so it can be used by other modules
export interface FormattedMessage {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  receiverId: string;
  read: boolean;
  // Optional: Include names if needed
  senderName?: string;
  receiverName?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name); // Add logger instance

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private userRepository: UserRepository,
    // Use forwardRef for ChatGateway
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async createMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    this.logger.log(
      `Attempting to create message from ${senderId} to ${receiverId}`,
    );
    let sender: User | null = null;
    let receiver: User | null = null;

    try {
      sender = await this.userRepository.findById(senderId);
      if (!sender) {
        this.logger.error(`Sender with ID ${senderId} not found.`);
        throw new NotFoundException(`Sender with ID ${senderId} not found`);
      }
      this.logger.log(`Found sender: ${sender.name} (${sender.id})`);

      receiver = await this.userRepository.findById(receiverId);
      if (!receiver) {
        this.logger.error(`Receiver with ID ${receiverId} not found.`);
        throw new NotFoundException(`Receiver with ID ${receiverId} not found`);
      }
      this.logger.log(`Found receiver: ${receiver.name} (${receiver.id})`);
    } catch (error) {
      this.logger.error(
        `Error fetching sender or receiver: ${error.message}`,
        error.stack,
      );
      // Re-throw specific errors or a generic one
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to fetch users for message creation.',
      );
    }

    const message = this.messageRepository.create({
      sender, // Use the fetched User entity
      receiver, // Use the fetched User entity
      content,
    });
    this.logger.log(`Message entity created: ${JSON.stringify(message)}`);

    let savedMessage: Message;
    try {
      savedMessage = await this.messageRepository.save(message);
      this.logger.log(`Message successfully saved with ID: ${savedMessage.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to save message: ${error.message}`,
        error.stack,
      );
      // Log potential constraint violations or other DB errors
      this.logger.error(
        `Database error code: ${error.code}, Detail: ${error.detail}`,
      );
      throw new InternalServerErrorException(
        'Failed to save message to database.',
      );
    }

    // --- Broadcasting Logic (remains the same) ---
    const room = [senderId, receiverId].sort().join('-');
    const broadcastPayload = {
      id: savedMessage.id,
      content: savedMessage.content,
      timestamp: savedMessage.timestamp,
      senderId: sender.id,
      receiverId: receiver.id,
      senderName: sender.name,
      receiverName: receiver.name,
      read: savedMessage.read, // Include read status
    };

    try {
      this.chatGateway.broadcastMessage(room, broadcastPayload);
      this.logger.log(`Message ${savedMessage.id} broadcasted to room ${room}`);
    } catch (broadcastError) {
      this.logger.error(
        `Failed to broadcast message ${savedMessage.id}: ${broadcastError.message}`,
        broadcastError.stack,
      );
      // Decide if you should still return the message or throw an error
    }

    return savedMessage; // Return the saved entity
  }

  async getMessages(
    userId1: string,
    userId2: string,
  ): Promise<FormattedMessage[]> {
    const messages = await this.messageRepository.find({
      where: [
        { sender: { id: userId1 }, receiver: { id: userId2 } },
        { sender: { id: userId2 }, receiver: { id: userId1 } },
      ],
      relations: ['sender', 'receiver'], // Load sender/receiver details if needed
      order: { timestamp: 'ASC' }, // Order by timestamp
    });

    // Map the results to the expected frontend structure
    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      read: msg.read,
      senderId: msg.sender.id, // Access nested id
      receiverId: msg.receiver.id, // Access nested id
      senderName: msg.sender.name, // Optional: include name
      receiverName: msg.receiver.name, // Optional: include name
    }));
  }

  async getConversations(userId: string): Promise<any[]> {
    this.logger.log(`Fetching conversations for userId: ${userId}`); // Log entry

    let messages: Message[];
    try {
      messages = await this.messageRepository.find({
        where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
        relations: ['sender', 'receiver'],
        order: { timestamp: 'DESC' },
      });
      this.logger.log(
        `Found ${messages.length} messages involving userId: ${userId}`,
      ); // Log message count
    } catch (error) {
      this.logger.error(
        `Error fetching messages for userId ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw the error
    }

    const conversations = new Map<string, any>();

    for (const message of messages) {
      const otherUser =
        message.sender.id === userId ? message.receiver : message.sender;
      if (!otherUser) {
        this.logger.warn(
          `Message ${message.id} has missing sender or receiver relation.`,
        );
        continue; // Skip if relations are missing
      }

      if (!conversations.has(otherUser.id)) {
        let unreadCount = 0;
        try {
          unreadCount = await this.messageRepository.count({
            where: {
              sender: { id: otherUser.id },
              receiver: { id: userId },
              read: false,
            },
          });
        } catch (error) {
          this.logger.error(
            `Error counting unread messages from ${otherUser.id} for ${userId}: ${error.message}`,
            error.stack,
          );
          // Continue without unread count if it fails
        }

        this.logger.debug(
          `Adding conversation with user: ${otherUser.id} (${otherUser.name}), last message: "${message.content}", unread: ${unreadCount}`,
        ); // Log adding conversation

        conversations.set(otherUser.id, {
          id: otherUser.id,
          name: otherUser.name,
          role: otherUser.type,
          lastMessage: message.content,
          timestamp: message.timestamp,
          unreadCount: unreadCount,
        });
      }
    }

    const result = Array.from(conversations.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    this.logger.log(
      `Returning ${result.length} conversations for userId: ${userId}`,
    ); // Log final count
    return result;
  }

  async markMessagesAsRead(
    userId: string,
    messageIds: string[],
  ): Promise<void> {
    // Ensure the user requesting is the receiver of the messages being marked as read
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ read: true })
      .whereInIds(messageIds)
      .andWhere('receiverId = :userId', { userId }) // Security check
      .execute();
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    return this.messageRepository.count({
      where: {
        receiver: { id: userId },
        read: false,
      },
    });
  }
}
