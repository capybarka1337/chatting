import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, 
  Search, 
  Settings, 
  Plus, 
  Phone, 
  Video, 
  MoreVertical,
  Smile,
  Paperclip,
  Send,
  Cloud,
  Brain
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiClient } from '../utils/api';
import { MessageList } from '../components/MessageList';
import { DialogList } from '../components/DialogList';
import { ChannelList } from '../components/ChannelList';
import { UserAvatar } from '../components/UserAvatar';
import { TypingIndicator } from '../components/TypingIndicator';
import { toast } from 'react-hot-toast';
import type { Channel, Dialog, Message } from '../types';

export const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'dialogs' | 'channels'>('dialogs');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { 
    dialogs, 
    currentDialog, 
    messages, 
    channels, 
    currentChannel,
    onlineUsers,
    typingUsers,
    setCurrentDialog,
    setMessages,
    clearUnreadCount
  } = useChatStore();
  
  const { sendMessage, sendTyping } = useWebSocket();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialData = async () => {
    try {
      const dialogsResponse = await apiClient.get<Dialog[]>('/dialogs');
      if (dialogsResponse.success) {
        useChatStore.getState().setDialogs(dialogsResponse.data ?? []);
      }

      const channelsResponse = await apiClient.get<Channel[]>('/channels');
      if (channelsResponse.success) {
        useChatStore.getState().setChannels(channelsResponse.data ?? []);
      }
    } catch (error) {
      toast.error('Failed to load chat data');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || (!currentDialog && !currentChannel)) return;

    const messageData = {
      content: message.trim(),
      type: 'text' as const,
      receiverId: currentDialog?.participant.id,
      channelId: currentChannel?.id,
    };

    sendMessage(messageData);
    setMessage('');
    sendTyping(false, currentDialog?.id || currentChannel?.id || '');
  };

  const handleTyping = (isTyping: boolean) => {
    sendTyping(isTyping, currentDialog?.id || currentChannel?.id || '');
  };

  const handleNewDialogClick = () => {
    toast('Direct messages coming soon!');
  };

  const handleNewChannelClick = () => {
    toast('Channel creation coming soon!');
  };

  const currentChat = currentDialog || currentChannel;
  const isTyping = Object.values(typingUsers).some(Boolean);
  const typingUserIds = Object.entries(typingUsers)
    .filter(([_, isTyping]) => isTyping)
    .map(([userId]) => userId);

  return (
    <div className="h-screen flex bg-slate-900">
      {/* Sidebar */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-8 h-8 text-cyan-400" />
              <h1 className="text-xl font-bold text-white">Nebula Chat</h1>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
            <UserAvatar user={user} size="md" />
            <div className="flex-1">
              <p className="text-white font-medium">{user?.username}</p>
              <p className="text-gray-400 text-sm">Online</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('dialogs')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'dialogs'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'channels'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Channels
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dialogs' ? (
            <DialogList 
              dialogs={dialogs.filter(d => 
                d.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              currentDialogId={currentDialog?.id}
              onSelectDialog={(dialog) => {
                setCurrentDialog(dialog);
                useChatStore.getState().setCurrentChannel(null);
                clearUnreadCount(dialog.id);
                loadMessages(dialog.id, 'dialog');
              }}
            />
          ) : (
            <ChannelList 
              channels={channels.filter(c => 
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              currentChannelId={currentChannel?.id}
              onSelectChannel={(channel) => {
                useChatStore.getState().setCurrentChannel(channel);
                setCurrentDialog(null);
                loadMessages(channel.id, 'channel');
              }}
            />
          )}
        </div>

        {/* New Buttons */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex space-x-2">
            <button
              onClick={handleNewDialogClick}
              className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
            <button
              onClick={handleNewChannelClick}
              className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Channel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentDialog ? (
                    <>
                      <UserAvatar user={currentDialog.participant} size="md" />
                      <div>
                        <p className="text-white font-medium">{currentDialog.participant.username}</p>
                        <p className="text-gray-400 text-sm">
                          {onlineUsers.some(u => u.id === currentDialog.participant.id) 
                            ? 'Online' 
                            : 'Offline'
                          }
                        </p>
                      </div>
                    </>
                  ) : currentChannel ? (
                    <>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${currentChannel.colorScheme} flex items-center justify-center`}>
                        {currentChannel.type === 'mental' ? (
                          <Brain className="w-5 h-5 text-white" />
                        ) : (
                          <Cloud className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{currentChannel.name}</p>
                        <p className="text-gray-400 text-sm">
                          {currentChannel.participants.length} members
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <Video className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <MessageList 
                messages={messages}
                currentUserId={user?.id || ''}
              />
              {isTyping && <TypingIndicator userIds={typingUserIds} />}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-slate-800 border-t border-slate-700">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <button
                  type="button"
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => handleTyping(true)}
                  onBlur={() => handleTyping(false)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none text-white placeholder-gray-400"
                />
                <button
                  type="button"
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Nebula Chat</h2>
              <p className="text-gray-400">Select a conversation or channel to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  async function loadMessages(id: string, type: 'dialog' | 'channel') {
    try {
      const endpoint = type === 'dialog' ? `/dialogs/${id}/messages` : `/channels/${id}/messages`;
      const response = await apiClient.get<Message[]>(endpoint);
      if (response.success) {
        setMessages(response.data ?? []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      toast.error('Failed to load messages');
    }
  }
};