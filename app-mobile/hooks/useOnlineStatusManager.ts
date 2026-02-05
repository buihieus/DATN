import { useEffect } from 'react';
import { chatService } from '../services/chatService';
import { useOnlineStatusStore } from '../store/useOnlineStatusStore';

export const useOnlineStatusManager = () => {
  useEffect(() => {
    let subscriptionId: string | null = null;

    const setupStatusListener = async () => {
      // Subscribe to user status updates
      subscriptionId = chatService.subscribeToUserStatusUpdates((data) => {
        const { userId, isOnline } = data;
        if (userId) {
          useOnlineStatusStore.getState().setOnlineStatus(userId, isOnline);
        }
      });

      // Update own status to online when component mounts
      chatService.updateUserStatus(true);

      // Clean up on unmount
      return () => {
        if (subscriptionId) {
          chatService.unsubscribeFromUserStatusUpdates(subscriptionId);
        }
        
        // Update own status to offline when component unmounts
        chatService.updateUserStatus(false);
      };
    };

    setupStatusListener();

    // Clean up on unmount
    return () => {
      chatService.updateUserStatus(false);
    };
  }, []);
};