interface WebSocketClient {
  id: string;
  userId: string;
  ws: WebSocket;
  rooms: Set<string>;
}

interface OnlineUser {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
}

export class WebSocketServer {
  private static clients: Map<string, WebSocketClient> = new Map();
  private static userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private static db: D1Database;
  private static env: any;

  static initialize(db: D1Database, env: any) {
    this.db = db;
    this.env = env;
  }

  static async handleUpgrade(c: any): Promise<Response> {
    return new Response('WebSocket upgrade', { status: 101 });
  }

  static async handleWebSocket(ws: WebSocket, request: Request, env: any): Promise<void> {
    this.initialize(env.DB, env);
    
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'Token required');
      return;
    }

    try {
      // Verify JWT token
      const payload = await this.verifyToken(token, env.JWT_SECRET);
      const clientId = crypto.randomUUID();
      
      const client: WebSocketClient = {
        id: clientId,
        userId: payload.userId,
        ws,
        rooms: new Set(),
      };

      this.clients.set(clientId, client);
      
      // Track user's sockets
      if (!this.userSockets.has(payload.userId)) {
        this.userSockets.set(payload.userId, new Set());
      }
      this.userSockets.get(payload.userId)!.add(clientId);

      // Update user status to online
      await this.updateUserStatus(payload.userId, 'online');

      // Send online users list
      await this.broadcastOnlineUsers();

      ws.addEventListener('message', async (event) => {
        try {
          const data = JSON.parse(event.data as string);
          await this.handleMessage(client, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.addEventListener('close', async () => {
        await this.handleDisconnect(client);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        data: { userId: payload.userId, clientId },
      }));

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Invalid token');
    }
  }

  private static async handleMessage(client: WebSocketClient, data: any): Promise<void> {
    const { type, payload } = data;

    switch (type) {
      case 'message':
        await this.handleMessageSend(client, payload);
        break;
      case 'typing':
        await this.handleTyping(client, payload);
        break;
      case 'join_room':
        await this.handleJoinRoom(client, payload);
        break;
      case 'leave_room':
        await this.handleLeaveRoom(client, payload);
        break;
      case 'reaction':
        await this.handleReaction(client, payload);
        break;
      case 'read_receipt':
        await this.handleReadReceipt(client, payload);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  private static async handleMessageSend(client: WebSocketClient, payload: any): Promise<void> {
    try {
      const { content, receiverId, channelId, type = 'text' } = payload;
      
      if (!content && type !== 'image') {
        return;
      }

      const messageId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Save message to database
      await this.db.prepare(`
        INSERT INTO messages (id, content, senderId, receiverId, channelId, type, timestamp, edited)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(messageId, content, client.userId, receiverId, channelId, type, now, false).run();

      // Update dialog's last message if it's a direct message
      if (receiverId) {
        const dialog = await this.db.prepare(`
          SELECT id FROM dialogs 
          WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)
        `).bind(client.userId, receiverId, receiverId, client.userId).first();

        if (dialog) {
          await this.db.prepare(`
            UPDATE dialogs SET lastMessageId = ?, updatedAt = ? WHERE id = ?
          `).bind(messageId, now, dialog.id).run();
        }
      }

      // Get message with sender info
      const messageData = await this.db.prepare(`
        SELECT m.*, u.username as sender_username, u.colorScheme as sender_colorScheme
        FROM messages m
        JOIN users u ON m.senderId = u.id
        WHERE m.id = ?
      `).bind(messageId).first();

      const message = {
        id: messageData.id,
        content: messageData.content,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        channelId: messageData.channelId,
        type: messageData.type,
        timestamp: messageData.timestamp,
        edited: messageData.edited,
        readBy: [],
        reactions: [],
      };

      // Send to recipient(s)
      if (receiverId) {
        await this.sendToUser(receiverId, {
          type: 'message',
          data: message,
        });
      }

      if (channelId) {
        await this.sendToRoom(channelId, {
          type: 'message',
          data: message,
        }, client.userId);
      }

      // Send confirmation to sender
      client.ws.send(JSON.stringify({
        type: 'message_sent',
        data: message,
      }));

    } catch (error) {
      console.error('Handle message send error:', error);
    }
  }

  private static async handleTyping(client: WebSocketClient, payload: any): Promise<void> {
    const { isTyping, dialogId } = payload;
    
    // Send typing indicator to other user in dialog
    if (dialogId) {
      // Get the other user in the dialog
      const dialog = await this.db.prepare(
        'SELECT userId1, userId2 FROM dialogs WHERE id = ?'
      ).bind(dialogId).first();

      if (dialog) {
        const otherUserId = dialog.userId1 === client.userId ? dialog.userId2 : dialog.userId1;
        
        await this.sendToUser(otherUserId, {
          type: 'typing',
          data: { userId: client.userId, isTyping },
        });
      }
    }
  }

  private static async handleJoinRoom(client: WebSocketClient, payload: any): Promise<void> {
    const { roomId } = payload;
    client.rooms.add(roomId);
  }

  private static async handleLeaveRoom(client: WebSocketClient, payload: any): Promise<void> {
    const { roomId } = payload;
    client.rooms.delete(roomId);
  }

  private static async handleReaction(client: WebSocketClient, payload: any): Promise<void> {
    // Handle reaction logic
  }

  private static async handleReadReceipt(client: WebSocketClient, payload: any): Promise<void> {
    // Handle read receipt logic
  }

  private static async handleDisconnect(client: WebSocketClient): Promise<void> {
    this.clients.delete(client.id);
    
    // Remove from user sockets
    const userSockets = this.userSockets.get(client.userId);
    if (userSockets) {
      userSockets.delete(client.id);
      
      // If user has no more active sockets, mark as offline
      if (userSockets.size === 0) {
        await this.updateUserStatus(client.userId, 'offline');
        this.userSockets.delete(client.userId);
      }
    }

    await this.broadcastOnlineUsers();
  }

  private static async sendToUser(userId: string, message: any): Promise<void> {
    const userSockets = this.userSockets.get(userId);
    if (!userSockets) return;

    const messageStr = JSON.stringify(message);
    
    for (const socketId of userSockets) {
      const client = this.clients.get(socketId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    }
  }

  private static async sendToRoom(roomId: string, message: any, excludeUserId?: string): Promise<void> {
    const messageStr = JSON.stringify(message);
    
    for (const client of this.clients.values()) {
      if (client.rooms.has(roomId) && client.userId !== excludeUserId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    }
  }

  private static async broadcastOnlineUsers(): Promise<void> {
    const onlineUsers = await this.getOnlineUsers();
    
    const message = {
      type: 'online_status',
      data: onlineUsers,
    };

    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  private static async getOnlineUsers(): Promise<OnlineUser[]> {
    const onlineUserIds = Array.from(this.userSockets.keys());
    
    if (onlineUserIds.length === 0) return [];

    const placeholders = onlineUserIds.map(() => '?').join(',');
    const users = await this.db.prepare(`
      SELECT id, username, status, lastSeen FROM users WHERE id IN (${placeholders})
    `).bind(...onlineUserIds).all();

    return users.results.map((user: any) => ({
      userId: user.id,
      username: user.username,
      status: 'online',
      lastSeen: user.lastSeen,
    }));
  }

  private static async updateUserStatus(userId: string, status: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare(
      'UPDATE users SET status = ?, lastSeen = ? WHERE id = ?'
    ).bind(status, now, userId).run();
  }

  static async verifyToken(token: string, secret: string): Promise<any> {
    // This is a simplified JWT verification
    // In production, use a proper JWT library
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    try {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}