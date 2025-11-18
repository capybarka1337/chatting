export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  colorScheme: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  channelId?: string;
  type: 'text' | 'image' | 'system';
  timestamp: Date;
  edited: boolean;
  reactions: Reaction[];
  readBy: string[];
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface Channel {
  id: string;
  name: string;
  type: 'mental' | 'cloud' | 'direct';
  description?: string;
  participants: string[];
  createdBy: string;
  createdAt: Date;
  isPrivate: boolean;
  colorScheme: string;
}

export interface Dialog {
  id: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
  isTyping: boolean;
  lastActivity: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ChatState {
  dialogs: Dialog[];
  currentDialog: Dialog | null;
  messages: Message[];
  channels: Channel[];
  currentChannel: Channel | null;
  onlineUsers: User[];
  typingUsers: { [userId: string]: boolean };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'online_status' | 'reaction' | 'read_receipt';
  data: any;
  timestamp: Date;
}