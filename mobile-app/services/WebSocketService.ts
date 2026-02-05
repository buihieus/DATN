import { Message } from './chatService';

// DEPRECATED: This WebSocket service is being replaced by SocketIOService
// for better real-time communication with socket.io backend
// WebSocket service for real-time chat updates
class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: { [event: string]: Function[] } = {};
  private url: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private token: string | null = null;

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for online/offline events
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', () => {
        if (!this.isConnected()) {
          this.connect(this.url!, this.token!);
        }
      });
    }
  }

  connect(url: string, token: string) {
    this.url = url;
    this.token = token;

    // Close existing connection if any
    if (this.ws) {
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(`${url}?token=${token}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0; // Reset on successful connection
        this.emit('connect');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket received:', data.type, data.payload); // Debug log
          this.emit(data.type, data.payload);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.emit('disconnect', event);
        
        // Attempt to reconnect if not a manual disconnect
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(url, token);
          }, this.reconnectInterval);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.emit('error', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  send(event: string, data: any) {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({ type: event, payload: data }));
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index !== -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Specific methods for chat events
  subscribeToConversation(conversationId: string) {
    this.send('subscribe', { conversationId });
  }

  unsubscribeFromConversation(conversationId: string) {
    this.send('unsubscribe', { conversationId });
  }

  // Handle incoming message events
  onNewMessage(callback: (message: Message) => void) {
    this.on('NEW_MESSAGE', callback);
  }

  onMessageSent(callback: (message: Message) => void) {
    this.on('MESSAGE_SENT', callback);
  }

  onMessageDelivered(callback: (messageId: string) => void) {
    this.on('MESSAGE_DELIVERED', callback);
  }

  onMessageRead(callback: (messageId: string) => void) {
    this.on('MESSAGE_READ', callback);
  }

  onUserTyping(callback: (userId: string, isTyping: boolean) => void) {
    this.on('USER_TYPING', callback);
  }

  offNewMessage(callback: (message: Message) => void) {
    this.off('NEW_MESSAGE', callback);
  }

  offMessageSent(callback: (message: Message) => void) {
    this.off('MESSAGE_SENT', callback);
  }

  offMessageDelivered(callback: (messageId: string) => void) {
    this.off('MESSAGE_DELIVERED', callback);
  }

  offMessageRead(callback: (messageId: string) => void) {
    this.off('MESSAGE_READ', callback);
  }

  offUserTyping(callback: (userId: string, isTyping: boolean) => void) {
    this.off('USER_TYPING', callback);
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();