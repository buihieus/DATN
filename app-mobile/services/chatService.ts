// import { API_BASE_URL } from './apiConfig';
// import { socketIOService } from './SocketIOService';

// // Get stored tokens
// const getStoredTokens = async () => {
//   try {
//     const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
//     const accessToken = await AsyncStorage.getItem('accessToken');
//     return { accessToken };
//   } catch (error) {
//     console.error('Error getting stored tokens:', error);
//     return { accessToken: null };
//   }
// };

// // Interfaces for chat functionality based on backend models
// export interface BackendMessage {
//   _id: string;
//   senderId: string;
//   receiverId: string;
//   message: string; // Backend uses 'message' instead of 'content'
//   isRead: boolean;
//   createdAt: string; // Backend returns string date
//   updatedAt: string;
// }

// export interface BackendUser {
//   _id: string; // Backend uses _id for MongoDB ObjectId
//   id?: string;
//   username: string;
//   fullName?: string;
//   avatar?: string;
//   status: string;
// }

// export interface Conversation {
//   sender: {
//     id: string;
//     username: string;
//     avatar?: string;
//     status: string; // 'Đang hoạt động' or 'Đang offline'
//   };
//   unreadCount: number;
//   lastMessage?: any; // Can be a message object from either sender or receiver
// }

// export interface Message {
//   _id: string;
//   senderId: string;
//   receiverId: string;
//   content: string;
//   timestamp: Date;
//   isRead: boolean;
//   messageType: 'text' | 'image' | 'file';
// }

// // Chat service API functions connecting to backend with real-time capabilities
// export const chatService = {
//   // Get list of conversations for the current user (messages from other users)
//   getConversations: async (): Promise<{ message: string; metadata: Conversation[] }> => {
//     try {
//       const { accessToken } = await getStoredTokens();
      
//       if (!accessToken) {
//         throw new Error('User not authenticated');
//       }
      
//       const response = await fetch(`${API_BASE_URL}/api/get-messages-by-user-id`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${accessToken}`,
//         },
//       });

//       if (!response.ok) {
//         if (response.status === 401) {
//           throw new Error('Authentication failed. Please log in again.');
//         }
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return {
//         message: data.message,
//         metadata: data.metadata,
//       };
//     } catch (error) {
//       console.error('Error fetching conversations:', error);
//       throw error;
//     }
//   },

//   // Get messages for a specific conversation (between current user and another user)
//   getMessages: async (receiverId: string): Promise<{ message: string; metadata: BackendMessage[] }> => {
//     try {
//       const { accessToken } = await getStoredTokens();
      
//       if (!accessToken) {
//         throw new Error('User not authenticated');
//       }
      
//       const response = await fetch(`${API_BASE_URL}/api/get-messages?receiverId=${receiverId}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${accessToken}`,
//         },
//       });

//       if (!response.ok) {
//         if (response.status === 401) {
//           throw new Error('Authentication failed. Please log in again.');
//         }
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return {
//         message: data.message,
//         metadata: data.metadata,
//       };
//     } catch (error) {
//       console.error('Error fetching messages:', error);
//       throw error;
//     }
//   },

//   // Send a message to another user
//   sendMessage: async (receiverId: string, content: string): Promise<{ message: string; metadata: BackendMessage }> => {
//     try {
//       const { accessToken } = await getStoredTokens();
      
//       if (!accessToken) {
//         throw new Error('User not authenticated');
//       }
      
//       const response = await fetch(`${API_BASE_URL}/api/create-message`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${accessToken}`,
//         },
//         body: JSON.stringify({
//           receiverId,
//           message: content
//         }),
//       });

//       if (!response.ok) {
//         if (response.status === 401) {
//           throw new Error('Authentication failed. Please log in again.');
//         }
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
      
//       // Emit real-time message to socket if available
//       if (socketIOService.isConnectedToServer()) {
//         socketIOService.emit('new-user-message', {
//           receiverId,
//           message: data.metadata
//         });
//       }
      
//       return {
//         message: data.message,
//         metadata: data.metadata,
//       };
//     } catch (error) {
//       console.error('Error sending message:', error);
//       throw error;
//     }
//   },

//   // Mark messages as read
//   markAsRead: async (receiverId: string): Promise<{ message: string }> => {
//     try {
//       const { accessToken } = await getStoredTokens();
      
//       if (!accessToken) {
//         throw new Error('User not authenticated');
//       }
      
//       const response = await fetch(`${API_BASE_URL}/api/mark-all-messages-read`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${accessToken}`,
//         },
//         body: JSON.stringify({
//           senderId: receiverId
//         }),
//       });

//       if (!response.ok) {
//         if (response.status === 401) {
//           throw new Error('Authentication failed. Please log in again.');
//         }
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return {
//         message: data.message,
//       };
//     } catch (error) {
//       console.error('Error marking messages as read:', error);
//       throw error;
//     }
//   },

//   // Subscribe to real-time message events
//   subscribeToMessages: (onNewMessage: (data: any) => void) => {
//     // Use the exported function to manage subscriptions
//     subscribeToMessages(onNewMessage);
//   },

//   // Unsubscribe from real-time message events
//   unsubscribeFromMessages: () => {
//     // Use the exported function to manage subscriptions
//     unsubscribeFromMessages();
//   },

//   // Emit a message via Socket.IO
//   emitMessage: (receiverId: string, message: any) => {
//     if (socketIOService.isConnectedToServer()) {
//       socketIOService.emit('new-user-message', {
//         receiverId,
//         message
//       });
//     }
//   },
// };

// // Store the subscription ID to manage real-time listeners
// let currentSubscriptionId: string | null = null;

// // Subscribe to real-time message events
// export const subscribeToMessages = (onNewMessage: (data: any) => void) => {
//   // First unsubscribe if there's an existing subscription
//   if (currentSubscriptionId) {
//     socketIOService.unsubscribe(currentSubscriptionId);
//   }
  
//   // Subscribe with the new handler and store the ID
//   currentSubscriptionId = socketIOService.subscribe({
//     onNewMessage
//   });
// };

// // Unsubscribe from real-time message events
// export const unsubscribeFromMessages = () => {
//   if (currentSubscriptionId) {
//     socketIOService.unsubscribe(currentSubscriptionId);
//     currentSubscriptionId = null;
//   }
// };






// 2
// import { API_BASE_URL } from './apiConfig';
// import { socketIOService } from './SocketIOService';

// // Lấy token từ AsyncStorage
// const getStoredTokens = async () => {
//   try {
//     const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
//     const accessToken = await AsyncStorage.getItem('accessToken');
//     return { accessToken };
//   } catch (error) {
//     console.error('Error getting stored tokens:', error);
//     return { accessToken: null };
//   }
// };

// // ===== Interfaces =====
// export interface BackendMessage {
//   _id: string;
//   senderId: string;
//   receiverId: string;
//   message: string;
//   isRead: boolean;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface BackendUser {
//   _id: string;
//   id?: string;
//   username: string;
//   fullName?: string;
//   avatar?: string;
//   status: string;
// }

// export interface Conversation {
//   sender: {
//     id: string;
//     username: string;
//     avatar?: string;
//     status: string;
//   };
//   unreadCount: number;
//   lastMessage?: {
//     message: string;
//     createdAt: string;
//   };
// }

// export interface Message {
//   _id: string;
//   senderId: string;
//   receiverId: string;
//   content: string;
//   timestamp: Date;
//   isRead: boolean;
//   messageType: 'text' | 'image' | 'file';
// }

// // ===== Chat Service =====
// export const chatService = {
//   // Lấy danh sách cuộc trò chuyện
//   getConversations: async (): Promise<{ message: string; metadata: Conversation[] }> => {
//     const { accessToken } = await getStoredTokens();
//     if (!accessToken) throw new Error('User not authenticated');

//     const response = await fetch(`${API_BASE_URL}/api/get-messages-by-user-id`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//     });

//     if (!response.ok) {
//       if (response.status === 401) throw new Error('Authentication failed. Please log in again.');
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     return { message: data.message, metadata: data.metadata };
//   },

//   // Lấy tin nhắn cho 1 conversation
//   getMessages: async (receiverId: string): Promise<{ message: string; metadata: BackendMessage[] }> => {
//     const { accessToken } = await getStoredTokens();
//     if (!accessToken) throw new Error('User not authenticated');

//     const response = await fetch(`${API_BASE_URL}/api/get-messages?receiverId=${receiverId}`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//     });

//     if (!response.ok) {
//       if (response.status === 401) throw new Error('Authentication failed. Please log in again.');
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     return { message: data.message, metadata: data.metadata };
//   },

//   // Gửi tin nhắn
//   sendMessage: async (receiverId: string, content: string): Promise<{ message: string; metadata: BackendMessage }> => {
//     const { accessToken } = await getStoredTokens();
//     if (!accessToken) throw new Error('User not authenticated');

//     const response = await fetch(`${API_BASE_URL}/api/create-message`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//       body: JSON.stringify({ receiverId, message: content }),
//     });

//     if (!response.ok) {
//       if (response.status === 401) throw new Error('Authentication failed. Please log in again.');
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();

//     // Emit real-time message qua socket
//     if (socketIOService.isConnectedToServer()) {
//       socketIOService.emit('new-user-message', { receiverId, message: data.metadata });
//     }

//     return { message: data.message, metadata: data.metadata };
//   },

//   // Đánh dấu tin nhắn đã đọc
//   markAsRead: async (receiverId: string): Promise<{ message: string }> => {
//     const { accessToken } = await getStoredTokens();
//     if (!accessToken) throw new Error('User not authenticated');

//     const response = await fetch(`${API_BASE_URL}/api/mark-all-messages-read`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//       body: JSON.stringify({ senderId: receiverId }),
//     });

//     if (!response.ok) {
//       if (response.status === 401) throw new Error('Authentication failed. Please log in again.');
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     return { message: data.message };
//   },

//   // Subscribe/unsubscribe tin nhắn realtime
//   subscribeToMessages: (onNewMessage: (data: any) => void) => {
//     if (currentSubscriptionId) {
//       socketIOService.unsubscribe(currentSubscriptionId);
//     }
//     currentSubscriptionId = socketIOService.subscribe({ onNewMessage });
//   },

//   unsubscribeFromMessages: () => {
//     if (currentSubscriptionId) {
//       socketIOService.unsubscribe(currentSubscriptionId);
//       currentSubscriptionId = null;
//     }
//   },

//   // Emit tin nhắn
//   emitMessage: (receiverId: string, message: any) => {
//     if (socketIOService.isConnectedToServer()) {
//       socketIOService.emit('new-user-message', { receiverId, message });
//     }
//   },
// };

// // ===== Subscription quản lý =====
// let currentSubscriptionId: string | null = null;


import { API_BASE_URL } from './apiConfig';
import { socketIOService } from './SocketIOService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredTokens } from '../utils/tokenUtils';
import { globalChatManager } from './GlobalChatManager';

export interface BackendMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  sender: { id: string; username: string; avatar?: string; status: string };
  unreadCount: number;
  lastMessage?: BackendMessage;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  messageType: 'text' | 'image' | 'file';
}

// Store the subscription ID to manage real-time listeners
let currentSubscriptionId: (() => void) | null = null;

export const chatService = {
  getConversations: async (): Promise<{ message: string; metadata: Conversation[] }> => {
    const { accessToken } = await getStoredTokens();
    if (!accessToken) throw new Error('User not authenticated');

    const res = await fetch(`${API_BASE_URL}/api/get-messages-by-user-id`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return { message: data.message, metadata: data.metadata };
  },

  getMessages: async (receiverId: string): Promise<{ message: string; metadata: BackendMessage[] }> => {
    const { accessToken } = await getStoredTokens();
    if (!accessToken) throw new Error('User not authenticated');

    const res = await fetch(`${API_BASE_URL}/api/get-messages?receiverId=${receiverId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return { message: data.message, metadata: data.metadata };
  },

  sendMessage: async (receiverId: string, content: string): Promise<BackendMessage> => {
    const { accessToken } = await getStoredTokens();
    if (!accessToken) throw new Error('User not authenticated');

    const res = await fetch(`${API_BASE_URL}/api/create-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ receiverId, message: content }),
    });
    const data = await res.json();

    if (socketIOService.isConnectedToServer()) {
      socketIOService.emit('new-user-message', { receiverId, message: data.metadata });
    }

    return data.metadata;
  },

  markAsRead: async (receiverId: string) => {
    const { accessToken } = await getStoredTokens();
    if (!accessToken) throw new Error('User not authenticated');

    const res = await fetch(`${API_BASE_URL}/api/mark-all-messages-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ senderId: receiverId }),
    });
    const data = await res.json();
    return data;
  },

  // New methods for online status
  updateUserStatus: (isOnline: boolean) => {
    if (socketIOService.isConnectedToServer()) {
      socketIOService.emit('update-user-status', { isOnline });
    }
  },

  subscribeToUserStatusUpdates: (onStatusUpdate: (data: any) => void) => {
    socketIOService.subscribe({ onUserStatusUpdate: onStatusUpdate });
  },

  unsubscribeFromUserStatusUpdates: (subscriptionId: string) => {
    socketIOService.unsubscribe(subscriptionId);
  },

  // Subscribe to real-time message events
  subscribeToMessages: (onNewMessage: (data: any) => void) => {
    // First unsubscribe if there's an existing subscription
    if (currentSubscriptionId) {
      currentSubscriptionId();
    }

    // Subscribe with the new handler and store the unsubscribe function
    currentSubscriptionId = globalChatManager.subscribeToMessages(onNewMessage);
  },

  // Unsubscribe from real-time message events
  unsubscribeFromMessages: (subscriptionId?: string) => {
    if (currentSubscriptionId) {
      currentSubscriptionId();
      currentSubscriptionId = null;
    }
  },

  // Subscribe to conversation updates (for chat list screen)
  subscribeToConversationUpdates: (onConversationUpdate: (data: any) => void) => {
    // First unsubscribe if there's an existing subscription
    if (currentSubscriptionId) {
      currentSubscriptionId();
    }

    // Subscribe with the new handler and store the unsubscribe function
    currentSubscriptionId = globalChatManager.subscribeToConversationUpdates(onConversationUpdate);
  },
};

