import { create } from 'zustand';

interface OnlineStatusState {
  onlineUsers: Record<string, boolean>; // userId -> isOnline
  setOnlineStatus: (userId: string, isOnline: boolean) => void;
  getOnlineStatus: (userId: string) => boolean;
  setBulkOnlineStatus: (statuses: Record<string, boolean>) => void;
}

export const useOnlineStatusStore = create<OnlineStatusState>((set, get) => ({
  onlineUsers: {},
  
  setOnlineStatus: (userId, isOnline) => set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      [userId]: isOnline,
    }
  })),
  
  getOnlineStatus: (userId) => {
    return get().onlineUsers[userId] || false;
  },
  
  setBulkOnlineStatus: (statuses) => set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      ...statuses
    }
  }))
}));