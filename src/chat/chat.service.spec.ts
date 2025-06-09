import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Message } from './message.entity';
import { User, UserType } from '../auth/users/user.entity';
import { CertificateType, Student } from '../auth/users/student.entity';
import { Advisor } from '../auth/users/advisor.entity';
import { Admin } from '../auth/users/admin.entity';
import { UserRepository } from '../auth/users/users.repository';
import { ChatGateway } from './chat.gateway';

describe('ChatService', () => {
  let service: ChatService;
  let messageRepository: jest.Mocked<Repository<Message>>;
  let userRepository: jest.Mocked<UserRepository>;
  let chatGateway: jest.Mocked<ChatGateway>;

  // Fix: Remove 'updatedAt' property that doesn't exist in User entity
  const mockUser: User = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed',
    type: UserType.STUDENT,
    createdAt: new Date(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
    DateOfBirth: null,
    Government: null,
    District: null,
    city: null,
    phoneNumber: null,
    gender: null,
    preferredCommunication: null,
    ProfilePicid: null,
    student: {
      id: 'student-profile-1',
      user: null,
      CertificatePic: null,
      certificateType: CertificateType.BACHELOR,
      StudyDivision: 'Science',
      totalScore: 85.5,
      nationality: 'Egyptian',
      isStudentCertified: true,
      isAlumni: false,
      isAlumniCertified: false,
      chatbotCompleted: false,
    },
    advisor: null,
    admin: null,
    sentMessages: [],
    receivedMessages: [],
    favoriteUniversityLinks: [],
    favoriteScholarshipLinks: [],
    createdUniversity: null,
    createdScholarships: [],
  };

  const mockReceiver: User = {
    ...mockUser,
    id: 'receiver-id',
    name: 'Receiver User',
    email: 'receiver@example.com',
  } as User;

  // Fix: Use 'sender' and 'receiver' properties instead of 'senderId' and 'receiverId'
  const mockMessage: Message = {
    id: 'message-id',
    content: 'Test message',
    read: false,
    timestamp: new Date(),
    sender: mockUser, // Fix: Use sender instead of senderId
    receiver: mockReceiver, // Fix: Use receiver instead of receiverId
  };

  beforeEach(async () => {
    const mockMessageRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      })),
    };

    const mockUserRepository = {
      findById: jest.fn(),
    };

    // Fix: Use correct method name 'broadcastMessage' instead of 'notifyConversationUpdate'
    const mockChatGateway = {
      broadcastMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessageRepository,
        },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: ChatGateway, useValue: mockChatGateway },
        { provide: getRepositoryToken(Student), useValue: {} },
        { provide: getRepositoryToken(Advisor), useValue: {} },
        { provide: getRepositoryToken(Admin), useValue: {} },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    messageRepository = module.get(getRepositoryToken(Message));
    userRepository = module.get(UserRepository);
    chatGateway = module.get(ChatGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create message successfully', async () => {
      userRepository.findById
        .mockResolvedValueOnce(mockUser) // sender
        .mockResolvedValueOnce(mockReceiver); // receiver
      messageRepository.create.mockReturnValue(mockMessage);
      messageRepository.save.mockResolvedValue(mockMessage);

      const result = await service.createMessage(
        'user-id',
        'receiver-id',
        'Test message',
      );

      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(userRepository.findById).toHaveBeenCalledWith('receiver-id');
      expect(messageRepository.create).toHaveBeenCalledWith({
        sender: mockUser,
        receiver: mockReceiver,
        content: 'Test message',
      });
      expect(messageRepository.save).toHaveBeenCalledWith(mockMessage);
      expect(chatGateway.broadcastMessage).toHaveBeenCalled();
      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException if sender not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.createMessage('invalid-sender', 'receiver-id', 'Test message'),
      ).rejects.toThrow(NotFoundException);

      expect(userRepository.findById).toHaveBeenCalledWith('invalid-sender');
      expect(messageRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if receiver not found', async () => {
      userRepository.findById
        .mockResolvedValueOnce(mockUser) // sender found
        .mockResolvedValueOnce(null); // receiver not found

      await expect(
        service.createMessage('user-id', 'invalid-receiver', 'Test message'),
      ).rejects.toThrow(NotFoundException);

      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(userRepository.findById).toHaveBeenCalledWith('invalid-receiver');
      expect(messageRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database save errors', async () => {
      userRepository.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockReceiver);
      messageRepository.create.mockReturnValue(mockMessage);
      messageRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createMessage('user-id', 'receiver-id', 'Test message'),
      ).rejects.toThrow(InternalServerErrorException);

      expect(messageRepository.save).toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return messages between two users', async () => {
      const messages = [mockMessage];
      messageRepository.find.mockResolvedValue(messages);

      const result = await service.getMessages('user1-id', 'user2-id');

      expect(messageRepository.find).toHaveBeenCalledWith({
        where: [
          { sender: { id: 'user1-id' }, receiver: { id: 'user2-id' } },
          { sender: { id: 'user2-id' }, receiver: { id: 'user1-id' } },
        ],
        relations: ['sender', 'receiver'],
        order: { timestamp: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockMessage.id,
        content: mockMessage.content,
        timestamp: mockMessage.timestamp,
        read: mockMessage.read,
        senderId: mockUser.id,
        receiverId: mockReceiver.id,
        senderName: mockUser.name,
        receiverName: mockReceiver.name,
      });
    });

    it('should return empty array when no messages exist', async () => {
      messageRepository.find.mockResolvedValue([]);

      const result = await service.getMessages('user1-id', 'user2-id');

      expect(result).toEqual([]);
    });
  });

  describe('getConversations', () => {
    it('should return conversations for a user', async () => {
      const messages = [mockMessage];
      messageRepository.find.mockResolvedValue(messages);
      messageRepository.count.mockResolvedValue(2); // unread count

      const result = await service.getConversations('user-id');

      expect(messageRepository.find).toHaveBeenCalledWith({
        where: [{ sender: { id: 'user-id' } }, { receiver: { id: 'user-id' } }],
        relations: ['sender', 'receiver'],
        order: { timestamp: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockReceiver.id,
        name: mockReceiver.name,
        role: mockReceiver.type,
        lastMessage: mockMessage.content,
        unreadCount: 2,
      });
    });

    it('should handle empty conversations', async () => {
      messageRepository.find.mockResolvedValue([]);

      const result = await service.getConversations('user-id');

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      messageRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getConversations('user-id')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      };

      // Fix: Cast the mock to avoid TypeScript error
      messageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.markMessagesAsRead('user-id', ['msg1', 'msg2']);

      expect(messageRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ read: true });
      expect(mockQueryBuilder.whereInIds).toHaveBeenCalledWith([
        'msg1',
        'msg2',
      ]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'receiverId = :userId',
        { userId: 'user-id' },
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should handle empty message IDs array', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };

      // Fix: Cast the mock to avoid TypeScript error
      messageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.markMessagesAsRead('user-id', []);

      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('getUnreadMessageCount', () => {
    it('should return unread message count for user', async () => {
      messageRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadMessageCount('user-id');

      expect(messageRepository.count).toHaveBeenCalledWith({
        where: {
          receiver: { id: 'user-id' },
          read: false,
        },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when no unread messages', async () => {
      messageRepository.count.mockResolvedValue(0);

      const result = await service.getUnreadMessageCount('user-id');

      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      messageRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getUnreadMessageCount('user-id')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors during message creation', async () => {
      userRepository.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockReceiver);
      messageRepository.create.mockReturnValue(mockMessage);
      messageRepository.save.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        service.createMessage('user-id', 'receiver-id', 'Test message'),
      ).rejects.toThrow(InternalServerErrorException);

      expect(messageRepository.save).toHaveBeenCalled();
    });

    it('should handle invalid user IDs in getMessages', async () => {
      messageRepository.find.mockResolvedValue([]);

      const result = await service.getMessages(
        'invalid-id',
        'another-invalid-id',
      );

      expect(result).toEqual([]);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
