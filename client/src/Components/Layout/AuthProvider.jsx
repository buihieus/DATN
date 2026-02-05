import { useEffect } from 'react';
import { useStore } from '../../hooks/useStore';
import tokenManager from '../../utils/tokenManager';

const AuthProvider = ({ children }) => {
  const { isLoadingAuth } = useStore();

  useEffect(() => {
    // Initialize token manager when auth state is loaded
    if (!isLoadingAuth) {
      tokenManager.initialize();

      // Clean up on unmount
      return () => {
        tokenManager.stopMonitoring();
      };
    }
  }, [isLoadingAuth]);

  return children;
};

export default AuthProvider;