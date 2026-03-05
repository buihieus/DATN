// API Configuration Constants
// Smart detection of runtime environment for API and Socket connections
// @ts-ignore - react-native-dotenv types
import { EXPO_PUBLIC_API_URL } from '@env';

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Helper to get API URL based on environment
const getApiUrl = (): string => {
  // Priority 1: Environment variable from .env file (most flexible)
  if (EXPO_PUBLIC_API_URL) {
    console.log('[API] Using .env EXPO_PUBLIC_API_URL:', EXPO_PUBLIC_API_URL);
    return EXPO_PUBLIC_API_URL;
  }
  
  // Priority 2: Auto-detect based on platform and manifest
  // For Android Emulator: use 10.0.2.2 to access host machine's localhost
  // For iOS Simulator: use localhost
  // For Real Device: use LAN IP (must be configured)
  
  if (Platform.OS === 'android') {
    // Check if running in emulator by looking at build properties
    const isEmulator = Constants.platform?.android?.isEmulator ?? false;
    if (isEmulator) {
      console.log('[API] Detected Android Emulator, using 10.0.2.2');
      return 'http://10.0.2.2:3000';
    }
    // Real Android device - use LAN IP (updated IP)
    console.log('[API] Detected Android Real Device, using LAN IP 192.168.16.100');
    return 'http://192.168.16.100:3000';
  }
  
  if (Platform.OS === 'ios') {
    // iOS Simulator can use localhost directly
    const isSimulator = Constants.platform?.ios?.isSimulator ?? false;
    if (isSimulator) {
      console.log('[API] Detected iOS Simulator, using localhost');
      return 'http://localhost:3000';
    }
    // Real iOS device - use LAN IP (updated IP)
    console.log('[API] Detected iOS Real Device, using LAN IP 192.168.16.100');
    return 'http://192.168.16.100:3000';
  }

  // Default fallback
  console.log('[API] Using default fallback URL');
  return 'http://10.0.2.2:3000';
};

const API_BASE_URL = getApiUrl();

console.log('[API] Final API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL };