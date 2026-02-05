// API Configuration Constants
// Determine the server URL based on environment
let API_BASE_URL: string;

if (process.env.EXPO_PUBLIC_API_URL) {
  API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
} else if (process.env.API_URL) {
  API_BASE_URL = process.env.API_URL;
} else {
  // For development, allow configuration via environment variable or use default
  // Common scenarios:
  // 1. Android emulator: 10.0.2.2 (to reach host machine's localhost)
  // 2. iOS simulator: localhost (already connects to host machine)
  // 3. Real device: device must be on same network as server
  // This will fall back to http://10.0.2.2:3000 if no environment variables are set
  API_BASE_URL = 'http://192.168.109.1:3000';
}

export { API_BASE_URL };