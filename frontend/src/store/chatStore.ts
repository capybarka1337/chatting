import { create } from 'zustand';
import { ChatState, Dialog, Message, Channel, User } from '../types';

interface ChatStore extends ChatState {
  setDialogs: (dialogs: Dialog[]) => void;
  setCurrentDialog: (dialog: Dialog | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setOnlineUsers: (users: User[]) => void;
  setTypingUser: (userId: string, isTyping: boolean) => void;
  incrementUnreadCount: (dialogId: string) => void;
  clearUnreadCount: (dialogId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  dialogs: [],
  currentDialog: null,
  messages: [],
  channels: [],
  currentChannel: null,
  onlineUsers: [],
  typingUsers: {},

  setDialogs: (dialogs) => set({ dialogs }),

  setCurrentDialog: (dialog) => set({ currentDialog: dialog }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    )
  })),

  setChannels: (channels) => set({ channels }),

  setCurrentChannel: (channel) => set({ currentChannel: channel }),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  setTypingUser: (userId, isTyping) => set((state) => ({
    typingUsers: { ...state.typingUsers, [userId]: isTyping }
  })),

  incrementUnreadCount: (dialogId) => set((state) => ({
    dialogs: state.dialogs.map(dialog =>
      dialog.id === dialogId
        ? { ...dialog, unreadCount: dialog.unreadCount + 1 }
        : dialog
    )
  })),

  clearUnreadCount: (dialogId) => set((state) => ({
    dialogs: state.dialogs.map(dialog =>
      dialog.id === dialogId
        ? { ...dialog, unreadCount: 0 }
        : dialog
    )
  })),
}));