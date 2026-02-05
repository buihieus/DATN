import { API_BASE_URL } from './apiConfig';
import { getStoredTokens } from '../utils/tokenUtils';

// Define the chatbot API URL - similar to web version
// For Android emulator: use 10.0.2.2 to reach host machine
// For iOS simulator: localhost might work
// For real devices: use your computer's IP address on the local network
const CHATBOT_API_URL = 'http://192.168.48.1:8000'; // Use the same IP as your main API

// Interface for room recommendations
export interface RoomRecommendation {
  _id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  location: string;
  images: string[];
  category: string;
  username: string;
  phone: string;
  options: any[];
  status: string;
  userId: string;
  endDate: string;
  typeNews: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    fullName: string;
    avatar: string;
  };
  isFavorite?: boolean;
}

// Interface for recommendation responses
export interface RecommendationResponse {
  type: string;
  message: string;
  rooms: RoomRecommendation[];
}

// Interface for chatbot messages
export interface ChatbotMessage {
  _id: string;
  senderId: string;
  content: string | RecommendationResponse;
  timestamp: Date;
  sender: 'user' | 'assistant';
}

// Chatbot service API functions connecting to backend
export const chatbotService = {
  // Send a message to the chatbot and get a response
  sendMessage: async (question: string): Promise<{ message: string; metadata: string | RecommendationResponse }> => {
    try {
      console.log('Attempting to connect to chatbot at:', `${CHATBOT_API_URL}/chat`);
      console.log('Question:', question);

      // Note: The chatbot service doesn't require authentication like in the web version
      const response = await fetch(`${CHATBOT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          // Optionally include user_id and session_id if needed (similar to web version)
          user_id: 'mobile_user', // Could be replaced with actual user ID if available
          session_id: Date.now().toString() // Simple session ID
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error details:', response.status, errorText);
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      // Handle the response format from the chatbot service (similar to web version)
      // The chatbot service returns: { response, type, rooms, sources }
      if (data.type === 'show_rooms' && data.rooms) {
        // Handle room recommendation responses (same as web version)
        return {
          message: 'Success',
          metadata: {
            type: data.type,
            message: data.response,
            rooms: data.rooms
          }
        };
      } else if (data.response) {
        // Handle text responses
        return {
          message: 'Success',
          metadata: data.response,
        };
      } else {
        // Fallback: try to convert the object to string or return a default message
        const responseText = JSON.stringify(data) || 'Tôi đã hiểu yêu cầu của bạn. Vui lòng thử lại câu hỏi khác.';
        return {
          message: 'Success',
          metadata: responseText,
        };
      }
    } catch (error) {
      console.error('Detailed error sending message to chatbot:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  // Alternative endpoint for AI search
  performAISearch: async (question: string): Promise<{ message: string; metadata: any }> => {
    try {
      const { accessToken } = await getStoredTokens();
      
      const response = await fetch(`${API_BASE_URL}/ai-search?question=${encodeURIComponent(question)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        message: data.message || 'Success',
        metadata: data,
      };
    } catch (error) {
      console.error('Error performing AI search:', error);
      throw error;
    }
  },
};