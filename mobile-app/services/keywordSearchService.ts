import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig';
import { getStoredTokens } from '../utils/tokenUtils';

// Interface for keyword search
export interface KeywordSearch {
  _id: string;
  title: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

// Interface for API responses
interface ApiResponse<T> {
  message: string;
  metadata: T;
}

// Keyword search service API functions
export const keywordSearchService = {
  // Get popular/hot searches
  getHotSearches: async (): Promise<ApiResponse<KeywordSearch[]>> => {
    try {
      const { accessToken } = await getStoredTokens();

      // Using the search endpoint without keyword to get hot searches
      const response = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<KeywordSearch[]> = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching hot searches:', error);
      throw error;
    }
  },

  // Search for keyword suggestions
  searchKeywords: async (keyword: string): Promise<ApiResponse<KeywordSearch[]>> => {
    try {
      const { accessToken } = await getStoredTokens();

      const response = await fetch(`${API_BASE_URL}/api/search?keyword=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<KeywordSearch[]> = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching keywords:', error);
      throw error;
    }
  },

  // Save/update a search keyword
  saveSearchKeyword: async (keyword: string): Promise<ApiResponse<any>> => {
    try {
      const { accessToken } = await getStoredTokens();

      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/add-search-keyword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: keyword }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving search keyword:', error);
      throw error;
    }
  },

  // AI-powered search
  aiSearch: async (question: string): Promise<any[]> => {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error with AI search:', error);
      // Fallback to regular search if AI search fails
      try {
        const { accessToken } = await getStoredTokens();

        const fallbackResponse = await fetch(`${API_BASE_URL}/api/search?keyword=${encodeURIComponent(question)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken ? `Bearer ${accessToken}` : '',
          },
        });

        if (!fallbackResponse.ok) {
          throw new Error(`Fallback search HTTP error! status: ${fallbackResponse.status}`);
        }

        const fallbackData: any = await fallbackResponse.json();
        // Return the metadata part for regular search
        return fallbackData.metadata || [];
      } catch (fallbackError) {
        console.error('Both AI and fallback searches failed:', fallbackError);
        throw error; // Return the original error
      }
    }
  },
};