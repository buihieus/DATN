import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, makeAuthenticatedRequest } from './apiConfig';
import { getStoredTokens } from '../utils/tokenUtils';

// Define address interface based on the backend model
export interface Address {
  provinceCode: string;
  wardCode: string;
  street: string;
  fullAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Define post interfaces based on the backend model
export interface Post {
  _id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  location: string; // Kept for backward compatibility
  address?: Address; // New address structure
  images: string[]; // Array of image URLs
  category: string;
  username: string; // Changed from owner to username
  phone: string;
  options: any[]; // Amenity-like options
  status: string; // 'active', 'inactive', 'cancel'
  userId: string;
  endDate: string;
  typeNews: string; // 'normal' or 'vip'
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    fullName: string;
    avatar: string;
  }; // User info if included in the response
  isFavorite?: boolean;
}

export interface PostFilters {
  category?: string;
  priceRange?: string; // 'duoi-1-trieu', 'tu-1-2-trieu', etc.
  areaRange?: string; // 'duoi-20', 'tu-20-30', etc.
  typeNews?: string; // 'normal' or 'vip'
  provinceCode?: string;
  wardCode?: string;
  selectedAmenities?: string[];
  // Advanced filter parameters
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
}

// Interface for API responses
interface ApiResponse<T> {
  message: string;
  metadata: T;
}

// Post service API functions
export const postService = {
  // Get all posts with optional filters
  getPosts: async (filters?: PostFilters): Promise<ApiResponse<Post[]>> => {
    try {
      // Check if we have advanced filters (minPrice, maxPrice, minArea, maxArea) that require the advanced-search endpoint
      const hasAdvancedFilters = filters && (
        filters.hasOwnProperty('minPrice') ||
        filters.hasOwnProperty('maxPrice') ||
        filters.hasOwnProperty('minArea') ||
        filters.hasOwnProperty('maxArea') ||
        (filters.selectedAmenities && filters.selectedAmenities.length > 0)
      );

      if (hasAdvancedFilters) {
        // Use the advanced search endpoint for more precise filtering
        const queryParams = new URLSearchParams();

        if (filters) {
          if (filters.category) queryParams.append('category', filters.category);
          if (filters.hasOwnProperty('minPrice') && filters.minPrice !== undefined) queryParams.append('gia_tu', filters.minPrice.toString());
          if (filters.hasOwnProperty('maxPrice') && filters.maxPrice !== undefined) queryParams.append('gia_den', filters.maxPrice.toString());
          if (filters.hasOwnProperty('minArea') && filters.minArea !== undefined) queryParams.append('dien_tich_tu', filters.minArea.toString());
          if (filters.hasOwnProperty('maxArea') && filters.maxArea !== undefined) queryParams.append('dien_tich_den', filters.maxArea.toString());
          if (filters.typeNews) queryParams.append('typeNews', filters.typeNews);
          if (filters.provinceCode) queryParams.append('cityCode', filters.provinceCode);
          if (filters.wardCode) queryParams.append('wardCode', filters.wardCode);

          // Handle amenities as an array using JSON format for selectedAmenities parameter
          if (filters.selectedAmenities && filters.selectedAmenities.length > 0) {
            queryParams.append('selectedAmenities', JSON.stringify(filters.selectedAmenities));
          }
        }

        const queryString = queryParams.toString();
        let url = `${API_BASE_URL}/api/advanced-search`;
        if (queryString) {
          url += `?${queryString}`;
        }

        const response = await makeAuthenticatedRequest(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse<Post[]> = await response.json();
        return data;
      } else {
        // For all other cases, use the advanced-search endpoint for consistency with web
        // We need to convert priceRange and areaRange to the format expected by advanced-search
        const queryParams = new URLSearchParams();

        if (filters) {
          if (filters.category) queryParams.append('category', filters.category);

          // Convert priceRange to gia_tu/gia_den format
          if (filters.priceRange) {
            let minPrice, maxPrice;
            switch (filters.priceRange) {
              case 'duoi-1-trieu':
                maxPrice = 1000000;
                break;
              case 'tu-1-2-trieu':
                minPrice = 1000000;
                maxPrice = 2000000;
                break;
              case 'tu-2-3-trieu':
                minPrice = 2000000;
                maxPrice = 3000000;
                break;
              case 'tu-3-5-trieu':
                minPrice = 3000000;
                maxPrice = 5000000;
                break;
              case 'tu-5-7-trieu':
                minPrice = 5000000;
                maxPrice = 7000000;
                break;
              case 'tu-7-10-trieu':
                minPrice = 7000000;
                maxPrice = 10000000;
                break;
              case 'tu-10-15-trieu':
                minPrice = 10000000;
                maxPrice = 15000000;
                break;
              case 'tren-15-trieu':
                minPrice = 15000000;
                break;
            }

            if (minPrice !== undefined) queryParams.append('gia_tu', minPrice.toString());
            if (maxPrice !== undefined) queryParams.append('gia_den', maxPrice.toString());
          }

          // Convert areaRange to dien_tich_tu/dien_tich_den format
          if (filters.areaRange) {
            let minArea, maxArea;
            switch (filters.areaRange) {
              case 'duoi-20':
                maxArea = 20;
                break;
              case 'tu-20-30':
                minArea = 20;
                maxArea = 30;
                break;
              case 'tu-30-50':
                minArea = 30;
                maxArea = 50;
                break;
              case 'tu-50-70':
                minArea = 50;
                maxArea = 70;
                break;
              case 'tu-70-90':
                minArea = 70;
                maxArea = 90;
                break;
              case 'tren-90':
                minArea = 90;
                break;
            }

            if (minArea !== undefined) queryParams.append('dien_tich_tu', minArea.toString());
            if (maxArea !== undefined) queryParams.append('dien_tich_den', maxArea.toString());
          }

          if (filters.typeNews) queryParams.append('typeNews', filters.typeNews);
          if (filters.provinceCode) queryParams.append('cityCode', filters.provinceCode);
          if (filters.wardCode) queryParams.append('wardCode', filters.wardCode);

          // Handle amenities as an array using JSON format for selectedAmenities parameter
          if (filters.selectedAmenities && filters.selectedAmenities.length > 0) {
            queryParams.append('selectedAmenities', JSON.stringify(filters.selectedAmenities));
          }
        }

        const queryString = queryParams.toString();
        let url = `${API_BASE_URL}/api/advanced-search`;
        if (queryString) {
          url += `?${queryString}`;
        }

        const response = await makeAuthenticatedRequest(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse<Post[]> = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Get post by ID (returns detailed post info with owner data)
  getPostById: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/get-post-by-id?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // Get new posts (posts created in the last 3 days)
  getNewPosts: async (): Promise<ApiResponse<Post[]>> => {
    try {
      const { accessToken } = await getStoredTokens();

      const response = await fetch(`${API_BASE_URL}/api/get-new-post`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Post[]> = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching new posts:', error);
      throw error;
    }
  },

  // Get featured posts (previously VIP posts, now just posts with special highlighting)
  getFeaturedPosts: async (): Promise<ApiResponse<Post[]>> => {
    try {
      const { accessToken } = await getStoredTokens();

      // Since we no longer distinguish between VIP and normal posts,
      // we'll fetch regular posts instead
      const response = await fetch(`${API_BASE_URL}/api/get-new-post`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Post[]> = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching featured posts:', error);
      throw error;
    }
  },

  // Search posts using the backend search endpoint
  searchPosts: async (keyword: string): Promise<ApiResponse<Post[]>> => {
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

      const data: ApiResponse<Post[]> = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  },

  // AI-powered search for posts
  aiSearchPosts: async (question: string): Promise<any[]> => {
    try {
      const { accessToken } = await getStoredTokens();

      // Use the AI search endpoint
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
      console.error('Error with AI search posts:', error);
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
        return fallbackData.metadata || [];
      } catch (fallbackError) {
        console.error('Both AI and fallback searches failed:', fallbackError);
        throw error; // Return the original error
      }
    }
  },

  // Create a new post
  createPost: async (postData: Omit<Post, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'userId' | 'user'>): Promise<ApiResponse<Post>> => {
    try {
      // Ensure typeNews is always 'normal' since we no longer have VIP posts
      const postPayload = {
        ...postData,
        typeNews: 'normal'  // Always set to 'normal' since we no longer differentiate
      };

      // Use the correct endpoint as defined in the backend routes
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/create-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Post> = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Get posts created by the current user
  getMyPosts: async (): Promise<ApiResponse<Post[]>> => {
    try {
      const { accessToken } = await getStoredTokens();

      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      // Use the correct endpoint as defined in the backend routes
      const response = await fetch(`${API_BASE_URL}/api/get-post-by-user-id`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Post[]> = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching my posts:', error);
      throw error;
    }
  },

  // Update a post
  updatePost: async (id: string, postData: Partial<Post>): Promise<ApiResponse<Post>> => {
    try {
      const { accessToken } = await getStoredTokens();

      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/update-post/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Post> = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Renew a post (extend its duration)
  renewPost: async (id: string, durationInDays: number): Promise<ApiResponse<Post>> => {
    try {
      const { accessToken } = await getStoredTokens();

      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/renew-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          postId: id,
          dateEnd: durationInDays // Server expects 'dateEnd' not 'durationInDays'
          // No longer support changing post type during renewal
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Post> = await response.json();
      return data;
    } catch (error) {
      console.error('Error renewing post:', error);
      throw error;
    }
  },

  // Delete a post
  deletePost: async (id: string): Promise<ApiResponse<Post>> => {
    try {
      const { accessToken } = await getStoredTokens();

      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/delete-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Post> = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Get locations (provinces, districts, wards)
  getLocations: async (provinceCode?: string, districtCode?: string): Promise<ApiResponse<any>> => {
    try {
      let url = `${API_BASE_URL}/api/get-locations`;

      // Add query parameters if provided
      const params = new URLSearchParams();
      if (provinceCode) params.append('province', provinceCode);
      if (districtCode) params.append('district', districtCode);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await makeAuthenticatedRequest(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },

  // Get filtered posts based on advanced search criteria - using the same endpoint as web implementation
  getFilteredPosts: async (filters: {
    category?: string;
    provinceCode?: string;
    wardCode?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    selectedAmenities?: string[];
  }): Promise<ApiResponse<Post[]>> => {
    try {
      const params = new URLSearchParams();

      if (filters.category) params.append('category', filters.category);
      if (filters.provinceCode) params.append('cityCode', filters.provinceCode);
      if (filters.wardCode) params.append('wardCode', filters.wardCode);
      if (filters.minPrice !== undefined) params.append('gia_tu', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('gia_den', filters.maxPrice.toString());
      if (filters.minArea !== undefined) params.append('dien_tich_tu', filters.minArea.toString());
      if (filters.maxArea !== undefined) params.append('dien_tich_den', filters.maxArea.toString());

      // Handle amenities as an array
      if (filters.selectedAmenities && filters.selectedAmenities.length > 0) {
        // The backend expects selectedAmenities as a JSON string or as individual features[] parameters
        // Using features[] approach for compatibility with the backend controller
        filters.selectedAmenities.forEach(amenity => {
          params.append('features[]', amenity);
        });
      }

      const queryString = params.toString();
      let url = `${API_BASE_URL}/api/advanced-search`;  // Changed to use the correct endpoint
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await makeAuthenticatedRequest(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Post[]> = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching filtered posts:', error);
      throw error;
    }
  },
};