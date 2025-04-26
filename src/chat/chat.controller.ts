import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    type: string;
  };
}

@Controller('chat')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const senderId = req.user.id;
    const { receiverId, content } = createMessageDto;
    const message = await this.chatService.createMessage(senderId, receiverId, content);
    // Note: Emitting via WebSocket might be better handled within the service after saving
    // or triggered via an event emitter if complex logic is needed.
    return message;
  }

  // Add GET endpoints corresponding to chatService methods

  @Get('contacts')
  async getChatContacts(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.chatService.getConversations(userId); // Assuming getConversations provides the contact list data
  }

  @Get('messages/:otherUserId')
  async getChatHistory(
    @Param('otherUserId') otherUserId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.chatService.getMessages(userId, otherUserId);
  }

  @Post('messages/read')
  @HttpCode(HttpStatus.OK)
  async markMessagesAsRead(
    @Body() body: { messageIds: string[] },
    @Req() req: AuthenticatedRequest,
  ) {
    // Optional: Add validation to ensure user can only mark their received messages as read
    await this.chatService.markMessagesAsRead(req.user.id, body.messageIds);
    return { message: 'Messages marked as read' };
  }

  @Get('messages/unread/count')
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    const count = await this.chatService.getUnreadMessageCount(userId);
    return { count };
  }
}
