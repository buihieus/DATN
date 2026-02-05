import { useState, useEffect } from 'react';
import { chatService, Message, BackendMessage, Conversation } from '../services/chatService';
import { useAuthStore } from '../store/useUserStore';
import { socketIOService } from '../services/SocketIOService';
import { globalChatManager } from '../services/GlobalChatManager';

export const useChat = (conversationId?: string) => {
  const { user, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // 🟢 Load messages with proper error handling
  const loadMessages = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const response = await chatService.getMessages(conversationId);

      // Check if response and metadata exist before mapping
      if (!response || !response.metadata) {
        console.warn('No messages found for conversation:', conversationId);
        setMessages([]);
        return;
      }

      // Ensure metadata is an array before mapping
      const messageData = Array.isArray(response.metadata) ? response.metadata : [];

      const mapped = messageData.map((m: BackendMessage) => ({
        _id: m._id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.message,
        timestamp: new Date(m.createdAt),
        isRead: m.isRead,
        messageType: 'text',
      }));

      // 🧹 Remove duplicate messages by _id
      const uniqueMessages = Array.from(new Map(mapped.map(m => [m._id, m])).values());

      setMessages(uniqueMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Load conversations with proper error handling
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversations();

      // Check if response and metadata exist before setting
      if (!response || !response.metadata) {
        console.warn('No conversations found');
        setConversations([]);
        return;
      }

      // Ensure metadata is an array before setting
      const conversationData = Array.isArray(response.metadata) ? response.metadata : [];
      setConversations(conversationData);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Send message
  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) return;

    try {
      const backendMessage = await chatService.sendMessage(conversationId, content);

      const msg: Message = {
        _id: backendMessage._id,
        senderId: backendMessage.senderId,
        receiverId: backendMessage.receiverId,
        content: backendMessage.message,
        timestamp: new Date(backendMessage.createdAt),
        isRead: backendMessage.isRead,
        messageType: 'text',
      };

      // ✅ Add message if not already present (deduplication)
      setMessages(prev => {
        const exists = prev.some(m => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // 🟢 Create conversation
  const createConversation = async (receiverId: string) => {
    try {
      const response = await chatService.createConversation(receiverId);
      setConversations(prev => [response.metadata, ...prev]);
      return response.metadata;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  // 🟢 Mark messages as read
  const markAsRead = async () => {
    if (!conversationId) return;

    try {
      await chatService.markAsRead(conversationId);
      // Update local state to reflect messages are read
      setMessages(prev =>
        prev.map(msg => ({ ...msg, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // 🟢 Effect to initialize global chat manager
  useEffect(() => {
    if (accessToken) {
      globalChatManager.initialize();
    }
  }, [accessToken]);

  // 🟢 Socket subscription for real-time messages
  useEffect(() => {
    if (!user?._id) {
      console.log('useChat: Missing user ID', { user: !!user });
      return;
    }

    console.log('useChat: Setting up socket subscription for conversation:', conversationId);

    // Try to get access token if not provided
    const tokenToUse = accessToken || useAuthStore.getState()?.accessToken;
    if (!tokenToUse) {
      console.log('useChat: Missing access token, but continuing with message handling');
    } else {
      // Connect to Socket.IO server if not already connected
      if (!socketIOService.isConnectedToServer()) {
        socketIOService.connect(tokenToUse);
      }
    }

    // Generate room name based on user IDs (same logic as server)
    const getRoomName = (userId1: string, userId2: string): string => {
      return [userId1, userId2].sort().join('_');
    };

    // Join conversation room when conversationId is available
    if (conversationId && user._id) {
      const roomName = getRoomName(user._id, conversationId);
      socketIOService.joinRoom(roomName);
      console.log('useChat: Joined room:', roomName);
    }

    const handleNewMessage = (data: any) => {
      console.log('useChat: Handling new message:', data);

      // Ensure data and data.message exist before processing
      if (!data || !data.message) {
        console.warn('Invalid message data received:', data);
        return;
      }

      const m: BackendMessage = data.message;
      const msg: Message = {
        _id: m._id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.message,
        timestamp: new Date(m.createdAt),
        isRead: m.isRead,
        messageType: 'text',
      };

      // ✅ Only add new message if not already present
      if (!conversationId || msg.senderId === conversationId || msg.receiverId === conversationId) {
        setMessages(prev => {
          const exists = prev.some(existing => existing._id === msg._id);
          if (exists) {
            console.log('useChat: Message already exists, skipping:', msg._id);
            return prev;
          }
          console.log('useChat: Adding new message to UI:', msg._id);
          return [...prev, msg];
        });
      }

      // ✅ Update conversation list (lastMessage + unreadCount)
      setConversations(prev => {
        const convIndex = prev.findIndex(
          conv => conv.sender.id === msg.senderId || conv.sender.id === msg.receiverId
        );

        if (convIndex !== -1) {
          const conv = { ...prev[convIndex] };
          conv.lastMessage = m;
          if (msg.senderId !== user._id) conv.unreadCount += 1;
          const updated = [...prev];
          updated[convIndex] = conv;
          return updated;
        }
        return prev;
      });
    };

    // Subscribe to Socket.IO events with a unique ID for this hook instance
    // Only subscribe if we have a token
    let subscriptionId: string | null = null;
    if (tokenToUse) {
      subscriptionId = socketIOService.subscribe({
        onNewMessage: handleNewMessage,
        onConnect: () => {
          console.log('Socket.IO connected successfully for chat');
          // Rejoin room if we reconnect
          if (conversationId && user._id) {
            const roomName = getRoomName(user._id, conversationId);
            socketIOService.joinRoom(roomName);
          }
        },
        onDisconnect: (reason) => {
          console.log('Socket.IO disconnected:', reason);
        },
        onError: (error) => {
          console.log('Socket.IO error:', error);
        },
        onMessageRead: (data) => {
          console.log('Message read event received:', data);
        },
        onUserStatusUpdate: (data) => {
          console.log('User status update received:', data);
        }
      }, `useChat_${user._id}_${conversationId || 'global'}`);

      console.log('useChat: Subscribed to socket events with ID:', subscriptionId);
    } else {
      console.log('useChat: Skipping socket subscription due to missing token');
    }

    // Subscribe to global messages (for when app is in background) - this works regardless of token
    const unsubscribeGlobalMessages = globalChatManager.subscribeToMessages(handleNewMessage);
    console.log('useChat: Subscribed to global messages');

    // Check for any stored messages from the global manager
    const processStoredMessages = async () => {
      const storedMessages = await globalChatManager.getStoredMessages();
      if (storedMessages.length > 0) {
        console.log('useChat: Processing stored messages:', storedMessages.length);
        storedMessages.forEach((storedMsg: any) => {
          // Process each stored message as if it just arrived
          handleNewMessage({ message: storedMsg });
        });

        // Clear the stored messages after processing
        await globalChatManager.clearStoredMessages();
      }
    };

    // Process any stored messages when the chat screen opens
    processStoredMessages();

    // Cleanup function
    return () => {
      console.log('useChat: Cleaning up subscription');

      // Unsubscribe from global messages
      unsubscribeGlobalMessages();

      // Leave room when component unmounts
      if (conversationId && user?._id) {
        const roomName = getRoomName(user._id, conversationId);
        socketIOService.leaveRoom(roomName);
        console.log('useChat: Left room:', roomName);
      }

      if (subscriptionId) {
        socketIOService.unsubscribe(subscriptionId);
      }
    };
  }, [conversationId, user?._id, accessToken]);

  // 🟢 Load initial data
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      loadConversations();
    }
  }, [conversationId]);

  return {
    messages,
    conversations,
    loading,
    user,
    sendMessage,
    loadMessages,
    loadConversations,
    createConversation,
    markAsRead,
  };
};
