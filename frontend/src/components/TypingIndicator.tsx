import { motion } from 'framer-motion';
import { useChatStore } from '../store/chatStore';

interface TypingIndicatorProps {
  userIds: string[];
}

export const TypingIndicator = ({ userIds }: TypingIndicatorProps) => {
  const { onlineUsers } = useChatStore();
  
  const typingUsers = userIds.map(userId => 
    onlineUsers.find(user => user.id === userId)
  ).filter(Boolean);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]?.username} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]?.username} and ${typingUsers[1]?.username} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-2 px-4 py-2"
    >
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-gray-400 text-sm italic">{getTypingText()}</span>
    </motion.div>
  );
};