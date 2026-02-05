import { useState, useEffect } from 'react';
import { roomService, Room } from '../services/roomService';
import { getFavorites } from '../services/favoriteService';

interface UseFeaturedRoomsReturn {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  refreshRooms: () => Promise<void>;
}

export const useFeaturedRooms = (): UseFeaturedRoomsReturn => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeaturedRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch featured rooms from backend
      const response = await roomService.getFeaturedRooms();
      let backendRooms = response.metadata;

      // Get favorited room IDs
      const favoriteIds = await getFavorites();
      
      // Update rooms with favorite status
      const roomsWithFavorites = backendRooms.map(room => ({
        ...room,
        isFavorite: favoriteIds.includes(room._id)
      }));
      
      setRooms(roomsWithFavorites);
    } catch (err: any) {
      console.error('Error loading featured rooms:', err);
      // Provide a more user-friendly error message
      if (err.message?.includes('404')) {
        setError('Không tìm thấy dữ liệu phòng nổi bật. Vui lòng kiểm tra lại kết nối.');
      } else {
        setError(err.message || 'Không thể tải phòng nổi bật. Vui lòng thử lại sau.');
      }
      // Set empty array when there's an error
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshRooms = async () => {
    await loadFeaturedRooms();
  };

  // Load featured rooms on initial mount
  useEffect(() => {
    loadFeaturedRooms();
  }, []);

  return {
    rooms,
    loading,
    error,
    refreshRooms
  };
};