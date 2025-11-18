import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Message, Reaction, User } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const token = useAuthStore.getState().token;
    if (!token) return;

    this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:8787', {
      auth: { token },
      transports: ['websocket'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.handleReconnect();
    });

    this.socket.on('message', (message: Message) => {
      const { currentDialog, addMessage, incrementUnreadCount } = useChatStore.getState();
      addMessage(message);
      
      if (currentDialog?.id !== message.senderId && message.receiverId) {
        incrementUnreadCount(message.senderId);
      }
    });

    this.socket.on('typing', (data: { userId: string; isTyping: boolean }) => {
      useChatStore.getState().setTypingUser(data.userId, data.isTyping);
    });

    this.socket.on('online_status', (users: User[]) => {
      useChatStore.getState().setOnlineUsers(users);
    });

    this.socket.on('reaction', (data: { messageId: string; reaction: Reaction }) => {
      const { updateMessage, messages } = useChatStore.getState();
      const message = messages.find((msg) => msg.id === data.messageId);
      if (!message) {
        return;
      }

      const reactions = [...message.reactions];
      const existingIndex = reactions.findIndex((reaction) => reaction.id === data.reaction.id);

      if (existingIndex >= 0) {
        reactions[existingIndex] = data.reaction;
      } else {
        reactions.push(data.reaction);
      }

      updateMessage(data.messageId, { reactions });
    });

    this.socket.on('read_receipt', (data: { messageId: string; userId: string }) => {
      const { updateMessage, messages } = useChatStore.getState();
      const message = messages.find((msg) => msg.id === data.messageId);
      if (!message) {
        return;
      }

      if (message.readBy.includes(data.userId)) {
        return;
      }

      updateMessage(data.messageId, { readBy: [...message.readBy, data.userId] });
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnect attempt ${this.reconnectAttempts}`);
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  sendMessage(message: Partial<Message>) {
    this.socket?.emit('message', message);
  }

  sendTyping(isTyping: boolean, dialogId: string) {
    this.socket?.emit('typing', { isTyping, dialogId });
  }

  sendReaction(messageId: string, emoji: string) {
    this.socket?.emit('reaction', { messageId, emoji });
  }

  sendReadReceipt(messageId: string) {
    this.socket?.emit('read_receipt', { messageId });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();