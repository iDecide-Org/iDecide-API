import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, Inject, forwardRef } from '@nestjs/common'; // Import Inject and forwardRef
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Specify allowed origins
    credentials: true, // Allow credentials
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // Inject ChatService using forwardRef
  constructor(
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
  ) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // Potentially join a room based on user ID or chat ID here
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string): void {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    client.emit('joinedRoom', room); // Acknowledge joining the room
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string): void {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { room: string; message: CreateMessageDto },
  ): Promise<void> {
    // The service will save the message and then we broadcast
    // We might not need the service to save if the HTTP endpoint already does.
    // Let's assume the HTTP endpoint handles saving for now.
    // We just need to broadcast the message to the room.
    this.logger.log(
      `Message received from ${client.id} for room ${payload.room}: ${payload.message.content}`,
    );
    // Broadcast the message to everyone in the room including the sender
    this.server.to(payload.room).emit('receiveMessage', payload.message);
  }

  // Method to be called by ChatService after a message is saved via HTTP
  broadcastMessage(room: string, message: any) {
    // Ensure senderId and receiverId are included if needed by frontend
    this.server.to(room).emit('receiveMessage', message);
    this.logger.log(`Broadcasting message to room ${room}`);
  }
}
