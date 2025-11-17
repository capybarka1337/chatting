import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { wsService } from '../utils/websocket';

export const useWebSocket = () => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      wsService.connect();
    } else {
      wsService.disconnect();
    }

    return () => {
      wsService.disconnect();
    };
  }, [isAuthenticated]);

  return {
    sendMessage: wsService.sendMessage.bind(wsService),
    sendTyping: wsService.sendTyping.bind(wsService),
    sendReaction: wsService.sendReaction.bind(wsService),
    sendReadReceipt: wsService.sendReadReceipt.bind(wsService),
    isConnected: wsService.isConnected.bind(wsService),
  };
};