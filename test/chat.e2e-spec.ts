import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { testHelper, TestUser } from './test-utils';
import { UserType } from '../src/auth/users/user.entity';
import { DataSource } from 'typeorm';
import { Message } from '../src/chat/message.entity';

describe('Chat Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let studentUser1: TestUser;
  let studentUser2: TestUser;
  let advisorUser: TestUser;

  beforeAll(async () => {
    app = await testHelper.setupTestApp();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await testHelper.cleanDatabase();

    // Create test users
    studentUser1 = await testHelper.createTestUser({
      name: 'Test Student 1',
      email: 'student1@test.com',
      type: UserType.STUDENT,
    });

    studentUser2 = await testHelper.createTestUser({
      name: 'Test Student 2',
      email: 'student2@test.com',
      type: UserType.STUDENT,
    });

    advisorUser = await testHelper.createTestUser({
      name: 'Test Advisor',
      email: 'advisor@test.com',
      type: UserType.ADVISOR,
    });

    // Create profiles
    await testHelper.createStudentProfile(studentUser1.id);
    await testHelper.createStudentProfile(studentUser2.id);
    await testHelper.createAdvisorProfile(advisorUser.id);
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('POST /api/chat/send', () => {
    it('should send message successfully between students', async () => {
      const messageData = {
        receiverId: studentUser2.id,
        content: 'Hello from student 1!',
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', 'Hello from student 1!');
      expect(response.body).toHaveProperty('read', false);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('sender');
      expect(response.body.sender).toHaveProperty('id', studentUser1.id);
      expect(response.body).toHaveProperty('receiver');
      expect(response.body.receiver).toHaveProperty('id', studentUser2.id);
    });

    it('should send message from student to advisor', async () => {
      const messageData = {
        receiverId: advisorUser.id,
        content: 'Question about university applications',
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty(
        'content',
        'Question about university applications',
      );
      expect(response.body.sender).toHaveProperty('id', studentUser1.id);
      expect(response.body.receiver).toHaveProperty('id', advisorUser.id);
    });

    it('should send message from advisor to student', async () => {
      const messageData = {
        receiverId: studentUser1.id,
        content: 'Here is the information you requested',
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty(
        'content',
        'Here is the information you requested',
      );
      expect(response.body.sender).toHaveProperty('id', advisorUser.id);
      expect(response.body.receiver).toHaveProperty('id', studentUser1.id);
    });

    it('should fail without authentication', async () => {
      const messageData = {
        receiverId: studentUser2.id,
        content: 'Unauthorized message',
      };

      await request(app.getHttpServer())
        .post('/api/chat/send')
        .send(messageData)
        .expect(401);
    });

    it('should fail with invalid receiver ID', async () => {
      const messageData = {
        receiverId: 'invalid-uuid',
        content: 'Test message',
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(messageData)
        .expect(400);

      expect(response.body.message).toContain('UUID');
    });

    it('should fail with non-existent receiver', async () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';
      const messageData = {
        receiverId: fakeUuid,
        content: 'Test message',
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(messageData)
        .expect(404);

      expect(response.body.message).toContain('Receiver not found');
    });

    it('should fail with empty content', async () => {
      const messageData = {
        receiverId: studentUser2.id,
        content: '',
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(messageData)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(
        response.body.message.some((msg: string) => msg.includes('content')),
      ).toBe(true);
    });

    it('should fail when trying to send message to self', async () => {
      const messageData = {
        receiverId: studentUser1.id,
        content: 'Message to myself',
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(messageData)
        .expect(400);

      expect(response.body.message).toContain(
        'cannot send message to yourself',
      );
    });
  });

  describe('GET /api/chat/messages/:userId', () => {
    beforeEach(async () => {
      // Create some test messages
      const messageRepository = dataSource.getRepository(Message);
      const userRepository = dataSource.getRepository('User');

      const sender = await userRepository.findOne({
        where: { id: studentUser1.id },
      });
      const receiver = await userRepository.findOne({
        where: { id: studentUser2.id },
      });

      // Message from user1 to user2
      const message1 = messageRepository.create({
        content: 'First message',
        read: false,
        timestamp: new Date('2024-01-01T10:00:00'),
        sender,
        receiver,
      });
      await messageRepository.save(message1);

      // Message from user2 to user1
      const message2 = messageRepository.create({
        content: 'Reply message',
        read: false,
        timestamp: new Date('2024-01-01T10:05:00'),
        sender: receiver,
        receiver: sender,
      });
      await messageRepository.save(message2);

      // Another message from user1 to user2
      const message3 = messageRepository.create({
        content: 'Third message',
        read: true,
        timestamp: new Date('2024-01-01T10:10:00'),
        sender,
        receiver,
      });
      await messageRepository.save(message3);
    });

    it('should get conversation messages between two users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/chat/messages/${studentUser2.id}`)
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);

      // Messages should be ordered by timestamp
      expect(response.body[0]).toHaveProperty('content', 'First message');
      expect(response.body[1]).toHaveProperty('content', 'Reply message');
      expect(response.body[2]).toHaveProperty('content', 'Third message');

      // Check message properties
      response.body.forEach((message: any) => {
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('content');
        expect(message).toHaveProperty('read');
        expect(message).toHaveProperty('timestamp');
        expect(message).toHaveProperty('sender');
        expect(message).toHaveProperty('receiver');
      });
    });

    it('should return empty array when no messages exist', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/chat/messages/${advisorUser.id}`)
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/chat/messages/${studentUser2.id}`)
        .expect(401);
    });

    it('should fail with invalid user ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/chat/messages/invalid-uuid')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .expect(400);

      expect(response.body.message).toContain('UUID');
    });
  });

  describe('GET /api/chat/conversations', () => {
    beforeEach(async () => {
      // Create messages with multiple users to test conversations
      const messageRepository = dataSource.getRepository(Message);
      const userRepository = dataSource.getRepository('User');

      const user1 = await userRepository.findOne({
        where: { id: studentUser1.id },
      });
      const user2 = await userRepository.findOne({
        where: { id: studentUser2.id },
      });
      const advisor = await userRepository.findOne({
        where: { id: advisorUser.id },
      });

      // Conversation with student2
      const msg1 = messageRepository.create({
        content: 'Hello student 2',
        read: false,
        timestamp: new Date('2024-01-01T10:00:00'),
        sender: user1,
        receiver: user2,
      });
      await messageRepository.save(msg1);

      // Conversation with advisor
      const msg2 = messageRepository.create({
        content: 'Hello advisor',
        read: false,
        timestamp: new Date('2024-01-01T11:00:00'),
        sender: user1,
        receiver: advisor,
      });
      await messageRepository.save(msg2);

      // Reply from advisor (more recent)
      const msg3 = messageRepository.create({
        content: 'Hello student',
        read: false,
        timestamp: new Date('2024-01-01T11:30:00'),
        sender: advisor,
        receiver: user1,
      });
      await messageRepository.save(msg3);
    });

    it('should get user conversations ordered by most recent', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/chat/conversations')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);

      // Should be ordered by most recent message
      expect(response.body[0]).toHaveProperty('otherUser');
      expect(response.body[0].otherUser).toHaveProperty('id', advisorUser.id);
      expect(response.body[0]).toHaveProperty('lastMessage');
      expect(response.body[0].lastMessage).toHaveProperty(
        'content',
        'Hello student',
      );

      expect(response.body[1]).toHaveProperty('otherUser');
      expect(response.body[1].otherUser).toHaveProperty('id', studentUser2.id);
      expect(response.body[1]).toHaveProperty('lastMessage');
      expect(response.body[1].lastMessage).toHaveProperty(
        'content',
        'Hello student 2',
      );
    });

    it('should return empty array when user has no conversations', async () => {
      const anotherStudent = await testHelper.createTestUser({
        name: 'Isolated Student',
        email: 'isolated@test.com',
        type: UserType.STUDENT,
      });

      const response = await request(app.getHttpServer())
        .get('/api/chat/conversations')
        .set(testHelper.getAuthHeader(anotherStudent.token!))
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/chat/conversations')
        .expect(401);
    });
  });

  describe('POST /api/chat/mark-read', () => {
    let messageIds: string[];

    beforeEach(async () => {
      // Create unread messages
      const messageRepository = dataSource.getRepository(Message);
      const userRepository = dataSource.getRepository('User');

      const sender = await userRepository.findOne({
        where: { id: studentUser2.id },
      });
      const receiver = await userRepository.findOne({
        where: { id: studentUser1.id },
      });

      const message1 = messageRepository.create({
        content: 'Unread message 1',
        read: false,
        timestamp: new Date(),
        sender,
        receiver,
      });
      await messageRepository.save(message1);

      const message2 = messageRepository.create({
        content: 'Unread message 2',
        read: false,
        timestamp: new Date(),
        sender,
        receiver,
      });
      await messageRepository.save(message2);

      messageIds = [message1.id, message2.id];
    });

    it('should mark messages as read successfully', async () => {
      const markReadData = {
        messageIds,
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/mark-read')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(markReadData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('marked as read');
      expect(response.body).toHaveProperty('markedCount', 2);

      // Verify messages are actually marked as read
      const messageRepository = dataSource.getRepository(Message);
      for (const messageId of messageIds) {
        const message = await messageRepository.findOne({
          where: { id: messageId },
        });
        expect(message?.read).toBe(true);
      }
    });

    it('should fail without authentication', async () => {
      const markReadData = {
        messageIds,
      };

      await request(app.getHttpServer())
        .post('/api/chat/mark-read')
        .send(markReadData)
        .expect(401);
    });

    it('should fail with invalid message IDs', async () => {
      const markReadData = {
        messageIds: ['invalid-uuid'],
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/mark-read')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(markReadData)
        .expect(400);

      expect(response.body.message).toContain('UUID');
    });

    it('should handle empty message IDs array', async () => {
      const markReadData = {
        messageIds: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/mark-read')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(markReadData)
        .expect(200);

      expect(response.body).toHaveProperty('markedCount', 0);
    });
  });

  describe('GET /api/chat/unread-count', () => {
    beforeEach(async () => {
      // Create some read and unread messages
      const messageRepository = dataSource.getRepository(Message);
      const userRepository = dataSource.getRepository('User');

      const sender = await userRepository.findOne({
        where: { id: studentUser2.id },
      });
      const receiver = await userRepository.findOne({
        where: { id: studentUser1.id },
      });

      // Create 3 unread messages
      for (let i = 0; i < 3; i++) {
        const message = messageRepository.create({
          content: `Unread message ${i + 1}`,
          read: false,
          timestamp: new Date(),
          sender,
          receiver,
        });
        await messageRepository.save(message);
      }

      // Create 2 read messages
      for (let i = 0; i < 2; i++) {
        const message = messageRepository.create({
          content: `Read message ${i + 1}`,
          read: true,
          timestamp: new Date(),
          sender,
          receiver,
        });
        await messageRepository.save(message);
      }
    });

    it('should get unread message count', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/chat/unread-count')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .expect(200);

      expect(response.body).toHaveProperty('unreadCount', 3);
    });

    it('should return 0 when no unread messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/chat/unread-count')
        .set(testHelper.getAuthHeader(studentUser2.token!))
        .expect(200);

      expect(response.body).toHaveProperty('unreadCount', 0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/chat/unread-count')
        .expect(401);
    });
  });

  describe('Message Content Validation', () => {
    it('should handle long messages', async () => {
      const longContent = 'A'.repeat(1000); // 1000 character message
      const messageData = {
        receiverId: studentUser2.id,
        content: longContent,
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty('content', longContent);
    });

    it('should handle messages with special characters', async () => {
      const specialContent = '🎓 مرحبا! Hello 你好 Здравствуйте @#$%^&*()';
      const messageData = {
        receiverId: studentUser2.id,
        content: specialContent,
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty('content', specialContent);
    });

    it('should trim whitespace from message content', async () => {
      const messageData = {
        receiverId: studentUser2.id,
        content: '  Trimmed message  ',
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty('content', 'Trimmed message');
    });

    it('should reject extremely long messages', async () => {
      const extremelyLongContent = 'A'.repeat(10000); // 10000 character message
      const messageData = {
        receiverId: studentUser2.id,
        content: extremelyLongContent,
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat/send')
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .send(messageData)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(
        response.body.message.some((msg: string) => msg.includes('too long')),
      ).toBe(true);
    });
  });

  describe('Real-time Messaging Simulation', () => {
    it('should handle rapid message sending', async () => {
      const messages = [
        'First message',
        'Second message',
        'Third message',
        'Fourth message',
        'Fifth message',
      ];

      const responses = [];

      // Send multiple messages rapidly
      for (const content of messages) {
        const messageData = {
          receiverId: studentUser2.id,
          content,
        };

        const response = await request(app.getHttpServer())
          .post('/api/chat/send')
          .set(testHelper.getAuthHeader(studentUser1.token!))
          .send(messageData)
          .expect(201);

        responses.push(response.body);
      }

      // Verify all messages were sent successfully
      expect(responses).toHaveLength(5);
      responses.forEach((response, index) => {
        expect(response).toHaveProperty('content', messages[index]);
        expect(response).toHaveProperty('id');
      });

      // Verify conversation contains all messages
      const conversationResponse = await request(app.getHttpServer())
        .get(`/api/chat/messages/${studentUser2.id}`)
        .set(testHelper.getAuthHeader(studentUser1.token!))
        .expect(200);

      expect(conversationResponse.body).toHaveLength(5);
    });
  });
});
