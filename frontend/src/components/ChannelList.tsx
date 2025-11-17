import { motion } from 'framer-motion';
import { Channel } from '../types';
import { Users, Brain, Cloud } from 'lucide-react';

interface ChannelListProps {
  channels: Channel[];
  currentChannelId?: string;
  onSelectChannel: (channel: Channel) => void;
}

export const ChannelList = ({ channels, currentChannelId, onSelectChannel }: ChannelListProps) => {
  const getChannelIcon = (type: Channel['type']) => {
    switch (type) {
      case 'mental':
        return <Brain className="w-5 h-5" />;
      case 'cloud':
        return <Cloud className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-1">
      {channels.map((channel) => (
        <motion.div
          key={channel.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectChannel(channel)}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${
            currentChannelId === channel.id
              ? 'bg-slate-700'
              : 'hover:bg-slate-700/50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${channel.colorScheme} flex items-center justify-center`}>
              {getChannelIcon(channel.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium truncate">
                  {channel.name}
                </p>
                <span className="text-xs text-gray-400">
                  {channel.participants.length}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm truncate">
                {channel.description || `${channel.type} channel`}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
      
      {channels.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No channels yet</p>
          <p className="text-gray-500 text-sm mt-1">Create your first channel to start group messaging</p>
        </div>
      )}
    </div>
  );
};