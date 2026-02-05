import cookies from 'js-cookie';
import { requestRefreshToken } from '../config/request';

class TokenManager {
  constructor() {
    this.refreshTimer = null;
    this.checkInterval = 60000; // Check every minute
  }

  // Decode JWT token to get expiration time
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  isTokenExpiringSoon(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true; // If we can't decode or no exp, treat as expired
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;
    
    // Return true if token expires in less than 5 minutes
    return timeUntilExpiry < 300;
  }

  // Refresh token if needed
  async refreshTokenIfNeeded() {
    const token = cookies.get('token');
    const refreshToken = cookies.get('refreshToken');

    if (!token) {
      // No token, can't refresh
      return false;
    }

    if (this.isTokenExpiringSoon(token)) {
      if (refreshToken) {
        try {
          console.log('Refreshing token before expiry...');
          const response = await requestRefreshToken();
          
          if (response.metadata && response.metadata.token) {
            console.log('Token refreshed successfully');
            return true;
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Don't redirect here, let the interceptor handle it
          return false;
        }
      } else {
        console.warn('Token is expiring but no refresh token available');
        return false;
      }
    }
    
    return true; // Token is still valid
  }

  // Start monitoring token expiration
  startMonitoring() {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Set up interval to check token status
    this.refreshTimer = setInterval(async () => {
      await this.refreshTokenIfNeeded();
    }, this.checkInterval);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Initialize token manager
  initialize() {
    // Start monitoring when initialized
    this.startMonitoring();
    
    // Also check immediately
    this.refreshTokenIfNeeded();
  }
}

// Create a singleton instance
const tokenManager = new TokenManager();
export default tokenManager;