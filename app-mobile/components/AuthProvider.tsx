import React, { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { useAuthStore } from '../store/useUserStore';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to check authentication status
        await checkAuthStatus();
      } catch (error) {
        // If there's an error getting user data, user is not authenticated
        // This is handled in the store
      }
    };

    initAuth();
  }, []);

  // If still loading authentication status, show splash
  if (loading) {
    return <SplashScreen />;
  }

  return <>{children}</>;
};

export default AuthProvider;