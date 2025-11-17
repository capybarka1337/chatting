import { User } from '../types';

interface UserAvatarProps {
  user?: User | null;
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar = ({ user, userId, size = 'md', className = '' }: UserAvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarContent = () => {
    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.username}
          className="w-full h-full rounded-full object-cover"
        />
      );
    }

    const username = user?.username || `User${userId?.slice(-4) || ''}`;
    const colorScheme = user?.colorScheme || 'from-blue-400 to-blue-600';

    return (
      <div className={`w-full h-full rounded-full bg-gradient-to-br ${colorScheme} flex items-center justify-center`}>
        <span className={`${textSizes[size]} text-white font-semibold`}>
          {getInitials(username)}
        </span>
      </div>
    );
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      {getAvatarContent()}
    </div>
  );
};