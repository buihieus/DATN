import React, { useEffect, ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../store/useUserStore';
import { initializeSocketConnection, disconnectSocket } from '../services/SocketIOService';
import { globalChatManager } from '../services/GlobalChatManager';

interface SocketProviderProps {
  children: ReactNode;
}

const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Check authentication status when app starts
    const initializeAuth = async () => {
      await checkAuthStatus();
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        // When app comes back to foreground, check auth status and reconnect if needed
        await checkAuthStatus();
      } else if (nextAppState === 'background') {
        // Optionally handle background state
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [checkAuthStatus]);

  // Setup socket connection when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      const initializeSocket = async () => {
        try {
          // Get token and initialize socket connection
          const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
          const token = await AsyncStorage.getItem('accessToken');

          if (token) {
            console.log('Initializing socket connection with token...');
            initializeSocketConnection(token);

            // Initialize global chat manager to handle messages when chat screens aren't active
            globalChatManager.initialize();
          } else {
            console.log('No token found for socket connection');
          }
        } catch (error) {
          console.error('Error initializing socket connection:', error);
        }
      };

      initializeSocket();
    } else {
      // Disconnect socket when not authenticated
      disconnectSocket();

      // Cleanup global chat manager when not authenticated
      globalChatManager.cleanup();
    }
  }, [isAuthenticated]);

  // Disconnect socket when user logs out
  useEffect(() => {
    return () => {
      // Clean up socket connection when component unmounts
      disconnectSocket();
    };
  }, []);

  return <>{children}</>;
};

export default SocketProvider;