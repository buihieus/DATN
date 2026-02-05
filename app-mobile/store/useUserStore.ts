import { create } from 'zustand';
import { authService, User } from '../services/authService';
import CryptoJS from 'crypto-js';
import { getStoredTokens } from '../utils/tokenUtils';
import { initializeSocketConnection, disconnectSocket } from '../services/SocketIOService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: (credential: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone: string, address?: string) => Promise<void>;
  logout: () => Promise<void>;
  getUserData: () => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false, // Start with false to avoid infinite loading
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const response = await authService.login(email, password);

      // Set as authenticated immediately after successful login API call
      set({ isAuthenticated: true });

      // Initialize socket connection after successful authentication
      const { accessToken } = await getStoredTokens();
      if (accessToken) {
        initializeSocketConnection(accessToken);
      }

      // Get user data after successful login but don't await it to avoid blocking
      // This will run in the background and update the user data when available
      // Use a timeout to prevent hanging if getUserData takes too long
      const userDataPromise = useAuthStore.getState().getUserData();
      // Don't wait for this promise to resolve to avoid blocking login
      userDataPromise.catch(userDataError => {
        console.error('Error getting user data after login:', userDataError);
        // Don't throw here - login should still be successful even if user data fails to load
      });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loginGoogle: async (credential) => {
    set({ loading: true, error: null });

    try {
      const response = await authService.loginGoogle(credential);

      // Set as authenticated immediately after successful login API call
      set({ isAuthenticated: true });

      // Initialize socket connection after successful authentication
      const { accessToken } = await getStoredTokens();
      if (accessToken) {
        initializeSocketConnection(accessToken);
      }

      // Get user data after successful login but don't await it to avoid blocking
      // This will run in the background and update the user data when available
      useAuthStore.getState().getUserData().catch(userDataError => {
        console.error('Error getting user data after Google login:', userDataError);
        // Don't throw here - login should still be successful even if user data fails to load
      });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  register: async (fullName, email, password, phone, address) => {
    set({ loading: true, error: null });

    try {
      const response = await authService.register(fullName, email, password, phone, address);

      // Set as authenticated immediately after successful registration API call
      set({ isAuthenticated: true });

      // Initialize socket connection after successful authentication
      const { accessToken } = await getStoredTokens();
      if (accessToken) {
        initializeSocketConnection(accessToken);
      }

      // Get user data after successful registration but don't await it to avoid blocking
      // This will run in the background and update the user data when available
      useAuthStore.getState().getUserData().catch(userDataError => {
        console.error('Error getting user data after registration:', userDataError);
        // Don't throw here - registration should still be successful even if user data fails to load
      });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      // Call the logout API first
      await authService.logout();
    } catch (error: any) {
      console.warn('Logout API error (proceeding anyway):', error.message);
      // Continue with local logout even if API fails
    } finally {
      // Disconnect socket and clear local state
      disconnectSocket();
      // Always clear local state regardless of API response
      set({ user: null, isAuthenticated: false, loading: false, error: null });
    }
  },

  getUserData: async () => {
    try {
      console.log('getUserData: Starting to fetch user data');
      const response = await authService.getUserData();
      console.log('getUserData: Received response from API:', response);

      // Check if the response contains encrypted data or plain user data
      if (response.metadata && response.metadata.auth) {
        console.log('getUserData: Found encrypted data in response');
        // The backend returns encrypted user data, we need to decrypt it
        // The decryption key should match the one used in the backend
        const secretKey = process.env.EXPO_PUBLIC_SECRET_CRYPTO;

        if (!secretKey) {
          console.warn('No secret key found for decryption, storing encrypted data as-is');
          set({ user: null, isAuthenticated: true }); // Set as authenticated but without user details
        } else {
          console.log('getUserData: Attempting to decrypt data with secret key');
          try {
            // Decrypt in a way that doesn't block the main thread too much
            const decryptedData = CryptoJS.AES.decrypt(response.metadata.auth, secretKey);

            // Convert to string and check if decryption was successful
            const decryptedString = decryptedData.toString(CryptoJS.enc.Utf8);
            console.log('getUserData: Decryption result string length:', decryptedString ? decryptedString.length : 0);

            if (decryptedString) {
              const userData: User = JSON.parse(decryptedString);
              console.log('getUserData: Successfully parsed user data:', userData);
              set({ user: userData, isAuthenticated: true });
            } else {
              // If decryption fails, we might still want to consider the user authenticated
              // since the token is valid but we just couldn't decrypt the user data
              console.warn('Could not decrypt user data, but token is valid');
              set({ user: null, isAuthenticated: true }); // Set as authenticated but without user details
            }
          } catch (decryptionError) {
            console.error('Decryption failed:', decryptionError);
            // If decryption fails, we still consider the user authenticated since the API call succeeded
            set({ user: null, isAuthenticated: true });
          }
        }
      } else {
        // Handle case where the API returns user data directly without encryption
        // This might happen if the backend format has changed
        console.warn('Response format might have changed, no encrypted data found');
        set({ user: null, isAuthenticated: true }); // Set as authenticated but without user details
      }

      // Initialize socket connection with the access token
      const { accessToken } = await getStoredTokens();
      if (accessToken) {
        // Initialize socket connection after we have the user data and are authenticated
        initializeSocketConnection(accessToken);
      }
    } catch (error: any) {
      console.error('Error getting user data:', error);
      // If we get a 401 error, it means the token is invalid, so we should log out
      if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
        // Token is invalid, log out the user
        set({ user: null, isAuthenticated: false });
        await removeStoredTokens();
        disconnectSocket();
      } else {
        // For other errors, we still want to consider the user authenticated if the token is valid
        // since the API call to /api/auth might have succeeded but data parsing failed
        set({ user: null, isAuthenticated: true }); // Mark as authenticated even if user data is not available
      }

      // Initialize socket connection even if there's an error getting user data
      const { accessToken } = await getStoredTokens();
      if (accessToken) {
        initializeSocketConnection(accessToken);
      }
    }
  },

  checkAuthStatus: async () => {
    try {
      // Check if we have stored tokens
      const { accessToken } = await getStoredTokens();

      if (!accessToken) {
        // No tokens stored, user is not authenticated
        set({ user: null, isAuthenticated: false });
        // Disconnect socket if it exists
        disconnectSocket();
        return;
      }

      // Set as authenticated immediately if we have access token
      set({ isAuthenticated: true });

      // We have tokens, try to get user data but don't await it to avoid blocking
      // This will run in the background and update user data when available
      useAuthStore.getState().getUserData().catch(userDataError => {
        console.error('Error getting user data in checkAuthStatus:', userDataError);
        // Don't change authentication status here - user is still authenticated based on token
      });
    } catch (error: any) {
      // If there's an error checking tokens, user is not authenticated
      set({ user: null, isAuthenticated: false });
      // Disconnect socket if there was an error
      disconnectSocket();
    }
  },

  updateProfile: async (profile) => {
    set({ loading: true });
    try {
      // Call the API to update the profile
      const response = await authService.updateProfile(profile);

      // Check if the response contains encrypted data or plain user data
      if (response.metadata && response.metadata.auth) {
        // The backend returns encrypted user data, we need to decrypt it
        const secretKey = process.env.EXPO_PUBLIC_SECRET_CRYPTO;

        if (secretKey) {
          try {
            const decryptedData = CryptoJS.AES.decrypt(response.metadata.auth, secretKey);
            const decryptedString = decryptedData.toString(CryptoJS.enc.Utf8);

            if (decryptedString) {
              const updatedUserData: User = JSON.parse(decryptedString);
              // Update the user profile in the store with the fresh data from the server
              set({ user: updatedUserData });
            } else {
              // If decryption fails, update only the fields that were sent
              set((state) => ({
                user: state.user ? { ...state.user, ...profile } : null,
              }));
            }
          } catch (decryptionError) {
            console.error('Decryption failed:', decryptionError);
            // If decryption fails, update only the fields that were sent
            set((state) => ({
              user: state.user ? { ...state.user, ...profile } : null,
            }));
          }
        } else {
          // If no secret key, update only the fields that were sent
          set((state) => ({
            user: state.user ? { ...state.user, ...profile } : null,
          }));
        }
      } else {
        // If response format is different, update only the fields that were sent
        set((state) => ({
          user: state.user ? { ...state.user, ...profile } : null,
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));