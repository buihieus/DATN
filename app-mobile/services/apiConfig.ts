// API Configuration
// Determine the server URL based on environment
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredTokens, refreshTokenRequest } from '../utils/tokenUtils';
import { API_BASE_URL } from '../constants/apiConstants';

// Global flag to prevent multiple simultaneous token refresh attempts
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error?: any, token?: string) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

// Function to make authenticated API requests with automatic token refresh
export const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const { accessToken } = await getStoredTokens();

  const requestWithToken = (token: string) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
  };

  // Make the initial request
  let response = await requestWithToken(accessToken || '');

  // If the response is 401, try to refresh the token
  if (response.status === 401) {
    const { refreshToken } = await getStoredTokens();

    if (!refreshToken) {
      // If no refresh token, the user needs to log in again
      throw new Error('Authentication failed. Please log in again.');
    }

    // Check if another request is already refreshing the token
    if (isRefreshing) {
      // Wait for the ongoing refresh to complete
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => requestWithToken(token as string));
    }

    isRefreshing = true;

    try {
      // Refresh the token
      const refreshedTokens = await refreshTokenRequest();
      const newAccessToken = refreshedTokens.token;

      // Process the queue
      processQueue(null, newAccessToken);

      // Make the original request with the new token
      response = await requestWithToken(newAccessToken);
    } catch (refreshError) {
      // If token refresh fails, reject all pending requests
      processQueue(refreshError, null);

      // Clear tokens to force re-login
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');

      throw new Error('Session expired. Please log in again.');
    } finally {
      isRefreshing = false;
    }
  }

  return response;
};

export { API_BASE_URL };