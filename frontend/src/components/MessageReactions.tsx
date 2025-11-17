import { Reaction } from '../types';
import { UserAvatar } from './UserAvatar';

interface MessageReactionsProps {
  reactions: Reaction[];
}

export const MessageReactions = ({ reactions }: MessageReactionsProps) => {
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as { [emoji: string]: Reaction[] });

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => (
        <div
          key={emoji}
          className="flex items-center space-x-1 bg-slate-700 rounded-full px-2 py-1 text-xs"
        >
          <span>{emoji}</span>
          <span className="text-gray-300">{emojiReactions.length}</span>
        </div>
      ))}
    </div>
  );
};