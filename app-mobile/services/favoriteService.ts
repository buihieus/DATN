import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig';
import { getStoredTokens } from '../utils/tokenUtils';

const FAVORITES_STORAGE_KEY = '@post_favorites';

// Get favorites from storage
export const getFavorites = async (): Promise<string[]> => {
  try {
    const favorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

// Add post to favorites via backend
export const addToFavorites = async (postId: string): Promise<boolean> => {
  try {
    const { accessToken } = await getStoredTokens();

    if (!accessToken) {
      console.error('No access token available');
      // Fallback to local storage if not authenticated
      const favorites = await getFavorites();
      if (!favorites.includes(postId)) {
        const updatedFavorites = [...favorites, postId];
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
      }
      return true;
    }

    // Note: Token logging removed for security

    // Call backend API to add favorite
    const response = await fetch(`${API_BASE_URL}/api/create-favourite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        postId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error adding to favorites (backend):', response.status, errorData);

      // Check if it's because already favorited
      if (response.status === 400) {
        // Already favorited, this is not an error for toggle operation
        console.log('Post already favorited');
        return true;
      }

      // For 500 errors or other server errors, fallback to local storage
      const favorites = await getFavorites();
      if (!favorites.includes(postId)) {
        const updatedFavorites = [...favorites, postId];
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
      }
      // Return true for 500 errors as well since we've stored locally
      return response.status === 500 ? true : false;
    }

    // Update local storage as well
    const favorites = await getFavorites();
    if (!favorites.includes(postId)) {
      const updatedFavorites = [...favorites, postId];
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    }

    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    // Fallback to local storage in case of network error
    const favorites = await getFavorites();
    if (!favorites.includes(postId)) {
      const updatedFavorites = [...favorites, postId];
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    }
    return true; // Return true since we stored locally
  }
};

// Remove post from favorites via backend
export const removeFromFavorites = async (postId: string): Promise<boolean> => {
  try {
    const { accessToken } = await getStoredTokens();

    if (!accessToken) {
      console.error('No access token available');
      // Fallback to local storage if not authenticated
      const favorites = await getFavorites();
      const updatedFavorites = favorites.filter(id => id !== postId);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
      return true;
    }

    // Note: Token logging removed for security

    // Call backend API to remove favorite
    const response = await fetch(`${API_BASE_URL}/api/delete-favourite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        postId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Chỉ log lỗi thực sự (không phải lỗi 403 do bài không được yêu thích)

      // Check if it's because not favorited yet (403 error)
      if (response.status === 403) {
        // Post is not favorited, so we want to remove it from local storage
        // và hành động này vẫn thành công theo mục tiêu người dùng (loại bỏ khỏi danh sách yêu thích)
        const favorites = await getFavorites();
        const updatedFavorites = favorites.filter(id => id !== postId);
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
        return true; // Return true because user's goal is achieved (post is not in favorites anymore)
      } else if (response.status === 400) {
        // Not favorited yet, this is not an error for toggle operation
        console.log('Post not favorited yet');
        const favorites = await getFavorites();
        const updatedFavorites = favorites.filter(id => id !== postId);
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
        return true;
      }

      // For 500 errors or other server errors, fallback to local storage
      const favorites = await getFavorites();
      const updatedFavorites = favorites.filter(id => id !== postId);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
      // Return true for 500 errors as well since we've stored locally
      return response.status === 500 ? true : false;
    }

    // Update local storage as well
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(id => id !== postId);
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));

    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    // Fallback to local storage in case of network error
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(id => id !== postId);
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    return true; // Return true since we stored locally
  }
};

// Toggle favorite status - this function properly implements toggle logic
export const toggleFavorite = async (postId: string): Promise<boolean> => {
  try {
    const { accessToken } = await getStoredTokens();

    if (!accessToken) {
      console.error('No access token available');
      return false;
    }

    // Try to determine current status from local storage first as fallback
    const localFavorites = await getFavorites();
    const isCurrentlyFavoritedLocally = localFavorites.includes(postId);

    // Try to get the most accurate status from backend, but handle server errors gracefully
    let isCurrentlyFavorited = isCurrentlyFavoritedLocally;
    try {
      isCurrentlyFavorited = await isFavoritedFromBackend(postId);
    } catch (error) {
      console.log('Could not get backend favorite status, using local status:', isCurrentlyFavoritedLocally);
    }

    if (isCurrentlyFavorited) {
      // Currently favorited, so remove it
      const removeSuccess = await removeFromFavorites(postId);
      return removeSuccess;
    } else {
      // Currently not favorited, so add it
      const addSuccess = await addToFavorites(postId);
      return addSuccess;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    // In case of error, return the current local status as fallback
    const localFavorites = await getFavorites();
    return localFavorites.includes(postId);
  }
};

// Check if post is favorited from backend API
export const isFavoritedFromBackend = async (postId: string): Promise<boolean> => {
  try {
    const { accessToken } = await getStoredTokens();

    if (!accessToken) {
      console.error('No access token available');
      return false;
    }

    // Get user's favorites from backend to check if this post is in the list
    const response = await fetch(`${API_BASE_URL}/api/get-favourite`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Error getting user favorite posts (for checking status):', response.status);
      // For 500 errors and other server errors, fallback to checking local storage
      const favorites = await getFavorites();
      return favorites.includes(postId);
    }

    const data = await response.json();
    const favoritePosts = data.metadata || [];
    // Check if the post ID exists in the favorite posts list
    return favoritePosts.some((post: any) => post._id === postId);
  } catch (error) {
    console.error('Error checking favorite status from backend:', error);
    // Fallback to checking local storage in case of network error
    const favorites = await getFavorites();
    return favorites.includes(postId);
  }
};

// Check if post is favorited (defaults to checking local storage, but can check backend if needed)
export const isFavorited = async (postId: string, checkBackend: boolean = false): Promise<boolean> => {
  try {
    if (checkBackend) {
      return await isFavoritedFromBackend(postId);
    } else {
      const favorites = await getFavorites();
      return favorites.includes(postId);
    }
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

// Get number of favorites
export const getFavoritesCount = async (): Promise<number> => {
  try {
    const favorites = await getFavorites();
    return favorites.length;
  } catch (error) {
    console.error('Error getting favorites count:', error);
    return 0;
  }
};

// Get user's favorite posts from backend
export const getUserFavoritePosts = async (): Promise<any[]> => {
  try {
    const { accessToken } = await getStoredTokens();

    if (!accessToken) {
      console.error('No access token available');
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/api/get-favourite`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Error getting user favorite posts:', response.status);
      // For server errors, try to return locally stored favorites as fallback
      const favoriteIds = await getFavorites();
      // Since we only have IDs locally, we can't return full post objects
      // but we'll still return an empty array to indicate the error
      return [];
    }

    const data = await response.json();
    return data.metadata || [];
  } catch (error) {
    console.error('Error getting user favorite posts:', error);
    return [];
  }
};

// Sync local storage with backend favorites (useful for initializing or refreshing)
export const syncFavoritesWithBackend = async (): Promise<void> => {
  try {
    const { accessToken } = await getStoredTokens();

    if (!accessToken) {
      console.error('No access token available for sync');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/get-favourite`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Error syncing favorites with backend:', response.status);
      // For 500 errors, we don't want to clear local favorites, so return without changing local storage
      return;
    }

    const data = await response.json();
    const favoritePostIds = (data.metadata || []).map((post: any) => post._id);

    // Update local storage with current backend favorites
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritePostIds));
  } catch (error) {
    console.error('Error syncing favorites with backend:', error);
  }
};