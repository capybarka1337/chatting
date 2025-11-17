export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  colorScheme: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  channelId?: string;
  type: 'text' | 'image' | 'system';
  timestamp: string;
  edited: boolean;
  readBy: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'mental' | 'cloud' | 'direct';
  description?: string;
  participants: string[];
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
  colorScheme: string;
}

export interface Dialog {
  id: string;
  userId1: string;
  userId2: string;
  lastMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}