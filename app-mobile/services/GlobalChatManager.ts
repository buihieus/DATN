import { socketIOService } from './SocketIOService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MessageCallback = (message: any) => void;
type ConversationUpdateCallback = (message: any) => void;

class GlobalChatManager {
  private static instance: GlobalChatManager;
  private subscriptionId: string | null = null;
  private isInitialized = false;
  private messageCallbacks: MessageCallback[] = [];
  private conversationUpdateCallbacks: ConversationUpdateCallback[] = [];

  static getInstance(): GlobalChatManager {
    if (!GlobalChatManager.instance) {
      GlobalChatManager.instance = new GlobalChatManager();
    }
    return GlobalChatManager.instance;
  }

  initialize() {
    if (this.isInitialized) {
      return;
    }

    // Subscribe to global chat events when the app starts
    this.setupGlobalChatListeners();

    this.isInitialized = true;
  }

  // Method to subscribe to new messages
  subscribeToMessages(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  // Method to subscribe to conversation updates (for chat list screen)
  subscribeToConversationUpdates(callback: ConversationUpdateCallback): () => void {
    this.conversationUpdateCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.conversationUpdateCallbacks = this.conversationUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  private setupGlobalChatListeners() {
    // Subscribe to global chat events that should be handled regardless of which screen is active
    this.subscriptionId = socketIOService.subscribe({
      onNewMessage: (data) => {
        console.log('GlobalChatManager: Received new message:', data);

        // Store the message in AsyncStorage so it's available when the chat screen opens
        this.storeIncomingMessage(data);

        // Notify all subscribers about the new message
        this.notifyMessageSubscribers(data);

        // Notify conversation list subscribers about new message
        this.notifyConversationUpdateSubscribers(data);

        // Optionally show a notification
        this.showNotificationForMessage(data);
      },
      onMessageRead: (data) => {
        console.log('GlobalChatManager: Message read event:', data);
      },
      onUserStatusUpdate: (data) => {
        console.log('GlobalChatManager: User status update:', data);
        // Update user status in global state
        this.updateUserStatus(data);
      },
      onConnect: () => {
        console.log('GlobalChatManager: Socket connected');
        // Rejoin any necessary rooms after reconnection
      },
      onDisconnect: (reason) => {
        console.log('GlobalChatManager: Socket disconnected:', reason);
      },
      onError: (error) => {
        console.log('GlobalChatManager: Socket error:', error);
      }
    }, 'global-chat-manager');
  }

  private notifyMessageSubscribers(data: any) {
    // Notify all registered callbacks about the new message
    this.messageCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });
  }

  private notifyConversationUpdateSubscribers(data: any) {
    // Notify all registered callbacks about the new conversation update
    this.conversationUpdateCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in conversation update callback:', error);
      }
    });
  }

  private async storeIncomingMessage(data: any) {
    try {
      if (!data || !data.message) {
        return;
      }

      // Get existing stored messages
      const storedMessagesJson = await AsyncStorage.getItem('incomingChatMessages');
      const storedMessages = storedMessagesJson ? JSON.parse(storedMessagesJson) : [];

      // Add new message
      const newMessage = {
        ...data.message,
        receivedAt: new Date().toISOString()
      };

      // Avoid duplicate messages by checking message ID
      const messageExists = storedMessages.some((msg: any) => msg._id === newMessage._id);
      if (messageExists) {
        return; // Don't store duplicate
      }

      storedMessages.push(newMessage);

      // Store updated messages (limit to last 100 to prevent storage bloat)
      const limitedMessages = storedMessages.slice(-100);

      await AsyncStorage.setItem('incomingChatMessages', JSON.stringify(limitedMessages));
    } catch (error) {
      console.error('Error storing incoming message:', error);
    }
  }

  private showNotificationForMessage(data: any) {
    // In a real implementation, you would use react-native-push-notification or similar
    console.log('Would show notification for message:', data);
  }

  private updateUserStatus(data: any) {
    // Update user status in global state
    // This would typically update Zustand store or similar state management
    console.log('Updating user status:', data);
  }

  cleanup() {
    if (this.subscriptionId) {
      socketIOService.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
    this.isInitialized = false;
  }

  // Method to get stored messages
  async getStoredMessages(): Promise<any[]> {
    try {
      const storedMessagesJson = await AsyncStorage.getItem('incomingChatMessages');
      return storedMessagesJson ? JSON.parse(storedMessagesJson) : [];
    } catch (error) {
      console.error('Error getting stored messages:', error);
      return [];
    }
  }

  // Method to clear stored messages
  async clearStoredMessages() {
    try {
      await AsyncStorage.removeItem('incomingChatMessages');
    } catch (error) {
      console.error('Error clearing stored messages:', error);
    }
  }
}

export const globalChatManager = GlobalChatManager.getInstance();