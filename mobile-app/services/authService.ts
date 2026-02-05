import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConstants';
import { storeTokens, getStoredTokens, removeStoredTokens } from '../utils/tokenUtils';

// Interface for user data
export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  avatar?: string;
  typeLogin: string;
  isAdmin?: boolean;
  balance?: number; // Add balance as optional field
  createdAt: string;
  updatedAt: string;
}

// Interface for login response
export interface LoginResponse {
  message: string;
  metadata: {
    token: string;
    refreshToken: string;
  };
}

// Interface for register response
export interface RegisterResponse {
  message: string;
  metadata: {
    token: string;
    refreshToken: string;
  };
}

// Interface for user data response
export interface UserDataResponse {
  message: string;
  metadata: {
    auth: string; // encrypted user data
  };
}

// API service for authentication
export const authService = {
  // Login method
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store tokens for mobile app
        await storeTokens(data.metadata.token, data.metadata.refreshToken);
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  },

  // Google login method
  loginGoogle: async (credential: string): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login-google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store tokens for mobile app
        await storeTokens(data.metadata.token, data.metadata.refreshToken);
        return data;
      } else {
        throw new Error(data.message || 'Google login failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  },

  // Register method
  register: async (
    fullName: string,
    email: string,
    password: string,
    phone: string,
    address?: string
  ): Promise<RegisterResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, password, phone, address }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store tokens for mobile app
        await storeTokens(data.metadata.token, data.metadata.refreshToken);
        return data;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  },

  // Logout method
  logout: async (): Promise<{ message: string }> => {
    try {
      const { accessToken } = await getStoredTokens();
      
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      // Server might return a different status for logout, so check if the request was made successfully
      if (response.ok || response.status === 401) { // 401 might be returned if token is invalid/expired
        // Remove tokens after logout regardless of server response
        await removeStoredTokens();
        
        // If the response has JSON data, return it; otherwise return success message
        try {
          const data = await response.json();
          return data;
        } catch (e) {
          // If response is not JSON (e.g., just text), return default success message
          return { message: 'Đăng xuất thành công' };
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }
    } catch (error: any) {
      // Even if there's an error from the server, clear local tokens
      await removeStoredTokens();
      // Still throw error to let UI know logout didn't complete successfully from server perspective
      throw new Error(error.message || 'Network error during logout');
    }
  },

  // Get user data
  getUserData: async (): Promise<UserDataResponse> => {
    try {
      const { accessToken } = await getStoredTokens();
      console.log('getUserData: Access token exists:', !!accessToken);

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log('getUserData: Response status:', response.status);

      const data = await response.json();
      console.log('getUserData: Response data:', data);

      if (response.ok) {
        return data;
      } else {
        console.error('getUserData: API call failed with status:', response.status, 'and message:', data.message);
        throw new Error(data.message || 'Failed to get user data');
      }
    } catch (error: any) {
      console.error('getUserData: Network or parsing error:', error);
      throw new Error(error.message || 'Network error');
    }
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return data;
      } else {
        throw new Error(data.message || 'Forgot password request failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  },

  // Reset password
  resetPassword: async (
    otp: string,
    password: string
  ): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return data;
      } else {
        throw new Error(data.message || 'Password reset failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  },

  // Update user profile
  updateProfile: async (profileData: Partial<User>): Promise<UserDataResponse> => {
    try {
      const { accessToken } = await getStoredTokens();

      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Process avatar if it's a local file URI (from image picker)
      // For now, we'll send the URI as is, but in a real implementation you might want to upload the image to a server first
      // and then send the server URL instead of the local URI
      const processedProfileData = { ...profileData };

      // If avatar is a local file URI, we might need to handle it differently
      // For now, sending as is, but this might need adjustment based on server expectations
      if (processedProfileData.avatar && processedProfileData.avatar.startsWith('file://')) {
        // This is a local file URI, might need to upload to server first
        // For now, we'll send it as is but server might need to handle this
        console.log('Sending local file URI for avatar:', processedProfileData.avatar);
      }

      const response = await fetch(`${API_BASE_URL}/api/update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(processedProfileData),
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  },

  // Refresh token
  refreshToken: async (): Promise<{ token: string; refreshToken: string }> => {
    try {
      const { refreshToken } = await getStoredTokens();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Update tokens
        if (data.metadata && data.metadata.token && data.metadata.refreshToken) {
          await storeTokens(data.metadata.token, data.metadata.refreshToken);
          return data.metadata;
        } else {
          throw new Error('Invalid refresh token response format');
        }
      } else {
        // If refresh fails, remove stored tokens
        await removeStoredTokens();
        throw new Error(data.message || 'Token refresh failed');
      }
    } catch (error: any) {
      // If there's a network error or any other error, remove stored tokens
      await removeStoredTokens();
      throw new Error(error.message || 'Network error during token refresh');
    }
  },
};