import { useState, useEffect } from 'react';
import { roomService, Room } from '../services/roomService';
import { getFavorites } from '../services/favoriteService';

interface RoomFilters {
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  amenities?: string[];
}

interface UseRoomsReturn {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  loadRooms: (filters?: RoomFilters) => Promise<void>;
  refreshRooms: () => Promise<void>;
}

export const useRooms = (initialFilters?: RoomFilters): UseRoomsReturn => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = async (filters?: RoomFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch rooms from backend
      const response = await roomService.getRooms(filters || initialFilters);
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
      console.error('Error loading rooms:', err);
      setError(err.message || 'Failed to load rooms');
      // Set empty array when there's an error
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshRooms = async () => {
    await loadRooms();
  };

  // Load rooms on initial mount
  useEffect(() => {
    loadRooms();
  }, []);

  return {
    rooms,
    loading,
    error,
    loadRooms,
    refreshRooms
  };
};