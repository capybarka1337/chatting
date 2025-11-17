import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Message } from '../types';
import { UserAvatar } from './UserAvatar';
import { MessageReactions } from './MessageReactions';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.timestamp), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="space-y-4">
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-slate-700 px-3 py-1 rounded-full">
              <span className="text-xs text-gray-400">
                {format(new Date(date), 'MMMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-2">
            {dateMessages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const showAvatar = !isOwn && (index === 0 || dateMessages[index - 1].senderId !== message.senderId);
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {showAvatar && (
                      <div className="flex-shrink-0 mb-1">
                        <UserAvatar userId={message.senderId} size="sm" />
                      </div>
                    )}
                    
                    <div className="flex flex-col">
                      <div
                        className={`message-bubble ${
                          isOwn ? 'message-sent' : 'message-received'
                        } ${message.edited ? 'italic' : ''}`}
                      >
                        {message.type === 'text' && (
                          <p className="text-white">{message.content}</p>
                        )}
                        {message.type === 'image' && (
                          <img 
                            src={message.content} 
                            alt="Shared image" 
                            className="rounded-lg max-w-full"
                          />
                        )}
                        {message.type === 'system' && (
                          <p className="text-center text-gray-400 text-sm italic">
                            {message.content}
                          </p>
                        )}
                      </div>
                      
                      <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
                        {message.edited && <span>(edited)</span>}
                        {message.readBy.length > 0 && isOwn && (
                          <span>✓✓</span>
                        )}
                      </div>
                      
                      {message.reactions.length > 0 && (
                        <MessageReactions reactions={message.reactions} />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};