import { motion } from 'framer-motion';
import { Dialog } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from './UserAvatar';

interface DialogListProps {
  dialogs: Dialog[];
  currentDialogId?: string;
  onSelectDialog: (dialog: Dialog) => void;
}

export const DialogList = ({ dialogs, currentDialogId, onSelectDialog }: DialogListProps) => {
  return (
    <div className="space-y-1">
      {dialogs.map((dialog) => (
        <motion.div
          key={dialog.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectDialog(dialog)}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${
            currentDialogId === dialog.id
              ? 'bg-slate-700'
              : 'hover:bg-slate-700/50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <UserAvatar user={dialog.participant} size="md" />
              {/* Online indicator would go here if we had online status */}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium truncate">
                  {dialog.participant.username}
                </p>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(dialog.lastActivity), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm truncate">
                  {dialog.lastMessage 
                    ? (dialog.lastMessage.type === 'text' 
                        ? dialog.lastMessage.content 
                        : dialog.lastMessage.type === 'image'
                        ? '📷 Image'
                        : 'System message')
                    : 'No messages yet'
                  }
                </p>
                {dialog.unreadCount > 0 && (
                  <span className="bg-cyan-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {dialog.unreadCount}
                  </span>
                )}
              </div>
              
              {dialog.isTyping && (
                <div className="flex items-center space-x-1 mt-1">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot" style={{ animationDelay: '0.1s' }}></div>
                    <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-400">typing...</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
      
      {dialogs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No conversations yet</p>
          <p className="text-gray-500 text-sm mt-1">Start a new chat to begin messaging</p>
        </div>
      )}
    </div>
  );
};