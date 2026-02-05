import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConstants';

// Store tokens in AsyncStorage
export const storeTokens = async (accessToken: string, refreshToken: string) => {
  try {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

// Get stored tokens
export const getStoredTokens = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
};

// Remove stored tokens
export const removeStoredTokens = async () => {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  } catch (error) {
    console.error('Error removing tokens:', error);
  }
};

// Refresh token function - this will be passed as a parameter to avoid circular dependency
export const refreshTokenRequest = async (): Promise<{ token: string; refreshToken: string }> => {
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
      // Update tokens in storage with new tokens
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
};