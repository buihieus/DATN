import io, { Socket } from 'socket.io-client';
import { Message } from './chatService';
import { API_BASE_URL } from './apiConfig';

// Extract base URL without path for socket connection
let SOCKET_URL = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash if any

// For mobile development, we need to adjust the URL for proper connection
let originalURL = SOCKET_URL;

// Create optimized fallback URLs prioritizing the most likely to work
const createFallbackURLs = (baseUrl: string): string[] => {
  const urls: string[] = [];

  // First, add the Android emulator fallback since mobile app will likely use this
  if (baseUrl.includes('192.168.')) {
    // For mobile devices on local network, first try 10.0.2.2 (Android emulator)
    urls.push(baseUrl.replace(/https?:\/\/[\d.]+/, 'http://10.0.2.2'));
  } else if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    // For local development, also add Android emulator address
    urls.push(baseUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2'));
  }

  // Add original base URL
  urls.push(baseUrl);

  // Add websocket protocol variants
  const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  if (!urls.includes(wsUrl)) {
    urls.push(wsUrl);
  }

  // Add common development addresses as last resort
  const commonLocalAddresses = [
    'http://10.0.2.2:3000',  // Android emulator
    'http://10.0.3.2:3000',  // Genymotion
  ];

  commonLocalAddresses.forEach(addr => {
    if (!urls.includes(addr)) {
      urls.push(addr);
    }
  });

  return urls;
};

const FALLBACK_URLS = createFallbackURLs(SOCKET_URL);

interface SocketIOServiceEventHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: any) => void;
  onNewMessage?: (message: any) => void;
  onMessageRead?: (data: any) => void;
  onUserStatusUpdate?: (data: any) => void;
}

interface Subscriber {
  id: string;
  handlers: SocketIOServiceEventHandlers;
}

class SocketIOService {
  private socket: Socket | null = null;
  private subscribers: Subscriber[] = [];
  private pendingMessages: any[] = []; // Store pending messages that arrived before handlers were registered
  private isConnected: boolean = false;
  private token: string | null = null;
  private isConnecting: boolean = false; // Flag to prevent multiple connections
  private connectionCheckInterval: NodeJS.Timeout | null = null; // Interval to check connection status

  connect(token: string) {
    // Check if token has changed, if so, we need to reconnect
    if (this.token && this.token !== token) {
      console.log('Token changed, disconnecting existing connection');
      this.disconnect();
    }

    // Prevent multiple simultaneous connections
    if (this.isConnecting || (this.socket && this.isConnected)) {
      console.log('Already connecting or connected, skipping duplicate connection attempt');
      // Update token if it's different
      if (this.token !== token) {
        this.token = token;
      }
      return;
    }

    this.token = token;
    this.isConnecting = true;

    // Close existing connection if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('Attempting to connect Socket.IO to:', SOCKET_URL);
    // Note: Token logging removed for security

    // Try to connect using fallback URLs
    this.attemptConnectionWithFallback(FALLBACK_URLS, token, 0);

    this.socket.on('connect', () => {
      console.log('Socket.IO connected with ID:', this.socket?.id);
      this.isConnected = true;
      this.isConnecting = false; // Reset connecting flag
      console.log(`SocketIOService: Connected with ${this.subscribers.length} subscribers`);

      // Start connection health check after successful connection
      this.startConnectionHealthCheck();

      // Notify all subscribers of connection
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onConnect) {
          subscriber.handlers.onConnect();
        }
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false; // Reset connecting flag
      // Notify all subscribers of disconnection
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onDisconnect) {
          subscriber.handlers.onDisconnect(reason);
        }
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      console.error('Error details:', error.message, (error as any).data);
      this.isConnecting = false; // Reset connecting flag
      // Notify all subscribers of connection error
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onError) {
          subscriber.handlers.onError(error);
        }
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket.IO attempting to reconnect (#', attemptNumber, ')');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket.IO reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed');
      this.isConnected = false;
      this.isConnecting = false;
      // Try to reconnect after a delay
      setTimeout(() => {
        if (this.token) {
          this.connect(this.token);
        }
      }, 5000);
    });

    // Add error listener for individual errors
    this.socket.on('error', (error) => {
      console.error('Socket.IO general error:', error);
      // Notify all subscribers of error
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onError) {
          subscriber.handlers.onError(error);
        }
      });
    });

    // Listen for new messages
    this.socket.on('new-message', (data) => {
      console.log('Received new-message via Socket.IO:', data);
      console.log('SocketIOService: Available subscribers:', this.subscribers.length);

      // Notify all subscribers with new message handlers
      let handlersFound = false;
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onNewMessage) {
          handlersFound = true;
          console.log('SocketIOService: Calling onNewMessage handler for subscriber', subscriber.id);
          subscriber.handlers.onNewMessage(data);
        }
      });

      if (!handlersFound) {
        console.log('SocketIOService: No onNewMessage handler found! Storing message for later processing.');
        // Store the message to be processed when handler is available
        this.pendingMessages.push({ type: 'new-message', data });
      }
    });

    // Listen for new user messages
    this.socket.on('new-user-message', (data) => {
      console.log('Received new-user-message via Socket.IO:', data);
      // Notify all subscribers with new message handlers
      let handlersFound = false;
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onNewMessage) {
          handlersFound = true;
          subscriber.handlers.onNewMessage(data);
        }
      });

      if (!handlersFound) {
        console.log('SocketIOService: No onNewMessage handler found for new-user-message! Storing message for later processing.');
        // Store the message to be processed when handler is available
        this.pendingMessages.push({ type: 'new-user-message', data });
      }
    });

    // Listen for conversation updates
    this.socket.on('new-conversation', (data) => {
      console.log('Received new-conversation via Socket.IO:', data);
      // Notify all subscribers with new message handlers
      let handlersFound = false;
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onNewMessage) {
          handlersFound = true;
          subscriber.handlers.onNewMessage(data);
        }
      });

      if (!handlersFound) {
        console.log('SocketIOService: No onNewMessage handler found for new-conversation! Storing message for later processing.');
        // Store the message to be processed when handler is available
        this.pendingMessages.push({ type: 'new-conversation', data });
      }
    });

    // Listen for message read events
    this.socket.on('messages-read', (data) => {
      console.log('Received messages-read via Socket.IO:', data);
      // Notify all subscribers with message read handlers
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onMessageRead) {
          subscriber.handlers.onMessageRead(data);
        }
      });
    });

    // Listen for favorite events
    this.socket.on('new-favourite', (data) => {
      console.log('Received new-favourite via Socket.IO:', data);
    });

    // Listen for user status updates
    this.socket.on('user-status-update', (data) => {
      console.log('Received user status update via Socket.IO:', data);
      // Notify all subscribers with user status handlers
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onUserStatusUpdate) {
          subscriber.handlers.onUserStatusUpdate(data);
        }
      });
    });

    // Listen for join/leave room responses if needed
    this.socket.on('room-joined', (data) => {
      console.log('Successfully joined room:', data);
    });

    this.socket.on('room-left', (data) => {
      console.log('Successfully left room:', data);
    });
  }

  private attemptConnectionWithFallback(urls: string[], token: string, currentIndex: number) {
    if (currentIndex >= urls.length) {
      console.error('All Socket.IO connection attempts failed');
      this.isConnecting = false;
      // Notify subscribers of connection failure
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onError) {
          subscriber.handlers.onError(new Error('All connection attempts failed'));
        }
      });
      return;
    }

    const currentUrl = urls[currentIndex];
    console.log(`Attempting Socket.IO connection to: ${currentUrl} (attempt ${currentIndex + 1}/${urls.length})`);
    // Note: Token logging removed for security

    // Create new socket connection with current URL
    this.socket = io(currentUrl, {
      transports: ['websocket', 'polling'], // Use both websocket and polling for better mobile compatibility
      auth: {
        token: token  // Send token in auth object
      },
      withCredentials: false, // Disable credentials/cookies to prevent auto-sending
      extraHeaders: {
        'client-type': 'mobile'
      },
      // Prevent any automatic cookie handling
      forceNew: true,
      // Enable automatic reconnection with exponential backoff
      reconnection: true,
      reconnectionAttempts: Infinity, // Retry indefinitely
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5, // Add randomness to reconnection delays
      // Enable automatic reconnection after disconnect
      timeout: 20000, // Increase timeout to handle slower mobile connections
      // Ping/pong settings for mobile
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Set up all the same handlers as the original connection
    this.socket.on('connect', () => {
      console.log('Socket.IO connected with ID:', this.socket?.id);
      this.isConnected = true;
      this.isConnecting = false; // Reset connecting flag
      console.log(`SocketIOService: Connected with ${this.subscribers.length} subscribers`);

      // Notify all subscribers of connection
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onConnect) {
          subscriber.handlers.onConnect();
        }
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false; // Reset connecting flag

      // Notify all subscribers of disconnection
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onDisconnect) {
          subscriber.handlers.onDisconnect(reason);
        }
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error to', currentUrl + ':', error);
      console.error('Error details:', error.message, (error as any).data);

      // Try next URL in the fallback list
      const nextIndex = currentIndex + 1;
      if (nextIndex < urls.length) {
        console.log(`Trying next fallback URL: ${urls[nextIndex]}`);
        // Clean up current socket before trying next one
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        // Attempt connection with next URL after a short delay
        setTimeout(() => {
          this.attemptConnectionWithFallback(urls, token, nextIndex);
        }, 1000);
      } else {
        // All fallback URLs exhausted
        console.error('All Socket.IO connection attempts failed');
        this.isConnecting = false;
        // Notify all subscribers of connection error
        this.subscribers.forEach(subscriber => {
          if (subscriber.handlers.onError) {
            subscriber.handlers.onError(error);
          }
        });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
      // Notify all subscribers of reconnection
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onConnect) {
          subscriber.handlers.onConnect();
        }
      });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket.IO attempting to reconnect (#', attemptNumber, ')');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket.IO reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed');
      this.isConnected = false;
      this.isConnecting = false;
      // Try to reconnect with fallback mechanism after a delay
      setTimeout(() => {
        if (this.token) {
          this.connect(this.token);
        }
      }, 5000);
    });

    // Add error listener for individual errors
    this.socket.on('error', (error) => {
      console.error('Socket.IO general error:', error);
      // Notify all subscribers of error
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onError) {
          subscriber.handlers.onError(error);
        }
      });
    });

    // Listen for new messages
    this.socket.on('new-message', (data) => {
      console.log('Received new-message via Socket.IO:', data);
      console.log('SocketIOService: Available subscribers:', this.subscribers.length);

      // Notify all subscribers with new message handlers
      let handlersFound = false;
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onNewMessage) {
          handlersFound = true;
          console.log('SocketIOService: Calling onNewMessage handler for subscriber', subscriber.id);
          subscriber.handlers.onNewMessage(data);
        }
      });

      if (!handlersFound) {
        console.log('SocketIOService: No onNewMessage handler found! Storing message for later processing.');
        // Store the message to be processed when handler is available
        this.pendingMessages.push({ type: 'new-message', data });
      }
    });

    // Listen for new user messages
    this.socket.on('new-user-message', (data) => {
      console.log('Received new-user-message via Socket.IO:', data);
      // Notify all subscribers with new message handlers
      let handlersFound = false;
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onNewMessage) {
          handlersFound = true;
          subscriber.handlers.onNewMessage(data);
        }
      });

      if (!handlersFound) {
        console.log('SocketIOService: No onNewMessage handler found for new-user-message! Storing message for later processing.');
        // Store the message to be processed when handler is available
        this.pendingMessages.push({ type: 'new-user-message', data });
      }
    });

    // Listen for conversation updates
    this.socket.on('new-conversation', (data) => {
      console.log('Received new-conversation via Socket.IO:', data);
      // Notify all subscribers with new message handlers
      let handlersFound = false;
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onNewMessage) {
          handlersFound = true;
          subscriber.handlers.onNewMessage(data);
        }
      });

      if (!handlersFound) {
        console.log('SocketIOService: No onNewMessage handler found for new-conversation! Storing message for later processing.');
        // Store the message to be processed when handler is available
        this.pendingMessages.push({ type: 'new-conversation', data });
      }
    });

    // Listen for message read events
    this.socket.on('messages-read', (data) => {
      console.log('Received messages-read via Socket.IO:', data);
      // Notify all subscribers with message read handlers
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onMessageRead) {
          subscriber.handlers.onMessageRead(data);
        }
      });
    });

    // Listen for favorite events
    this.socket.on('new-favourite', (data) => {
      console.log('Received new-favourite via Socket.IO:', data);
    });

    // Listen for user status updates
    this.socket.on('user-status-update', (data) => {
      console.log('Received user status update via Socket.IO:', data);
      // Notify all subscribers with user status handlers
      this.subscribers.forEach(subscriber => {
        if (subscriber.handlers.onUserStatusUpdate) {
          subscriber.handlers.onUserStatusUpdate(data);
        }
      });
    });

    // Listen for join/leave room responses if needed
    this.socket.on('room-joined', (data) => {
      console.log('Successfully joined room:', data);
    });

    this.socket.on('room-left', (data) => {
      console.log('Successfully left room:', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
    }

    // Clear connection check interval
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  isConnectedToServer(): boolean {
    return this.isConnected && this.socket !== null && this.socket.connected;
  }

  // Method to start connection health check
  private startConnectionHealthCheck() {
    // Clear any existing interval
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    // Set up periodic check
    this.connectionCheckInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        // Check if socket is still connected
        if (!this.socket.connected) {
          console.log('Socket connection lost, attempting to reconnect...');
          if (this.token) {
            this.connect(this.token);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Subscribe to events with a unique ID
  subscribe(eventHandlers: SocketIOServiceEventHandlers, subscriberId?: string): string {
    const id = subscriberId || `subscriber_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    console.log('SocketIOService: Subscribing new subscriber with ID:', id);
    console.log('SocketIOService: Subscriber handlers:', Object.keys(eventHandlers));

    // Remove any existing subscriber with the same ID to prevent duplicates
    this.subscribers = this.subscribers.filter(subscriber => subscriber.id !== id);

    // Add to subscribers list
    this.subscribers.push({ id, handlers: eventHandlers });

    // Process any pending messages if we have new message handlers
    if (eventHandlers.onNewMessage && this.pendingMessages.length > 0) {
      console.log('SocketIOService: Processing', this.pendingMessages.length, 'pending messages for new subscriber');
      const messagesToProcess = [...this.pendingMessages]; // Copy the array
      this.pendingMessages = []; // Clear pending messages

      // Process all pending messages
      messagesToProcess.forEach(({ type, data }) => {
        console.log('SocketIOService: Processing pending', type, 'message:', data);
        eventHandlers.onNewMessage?.(data);
      });
    }

    return id;
  }

  // Unsubscribe from events by ID
  unsubscribe(subscriberId: string) {
    console.log('SocketIOService: Unsubscribing subscriber with ID:', subscriberId);
    this.subscribers = this.subscribers.filter(subscriber => subscriber.id !== subscriberId);
    console.log('SocketIOService: Remaining subscribers:', this.subscribers.length);
  }

  // Send a message (if needed)
  emit(event: string, data: any) {
    if (this.socket && this.isConnected && this.socket.connected) {
      console.log('SocketIOService: Emitting event', event, 'with data:', data);
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected (socket exists: ${!!this.socket}, isConnected: ${this.isConnected}, connected: ${this.socket?.connected}). Cannot emit event: ${event}`);
    }
  }

  // Join a specific room for a conversation
  joinRoom(roomName: string) {
    if (this.socket && this.isConnected && this.socket.connected) {
      console.log('SocketIOService: Joining room', roomName);
      this.socket.emit('join-room', roomName);
    } else {
      console.warn(`Socket not connected (socket exists: ${!!this.socket}, isConnected: ${this.isConnected}, connected: ${this.socket?.connected}). Cannot join room: ${roomName}`);
    }
  }

  // Leave a specific room for a conversation
  leaveRoom(roomName: string) {
    if (this.socket && this.isConnected && this.socket.connected) {
      console.log('SocketIOService: Leaving room', roomName);
      this.socket.emit('leave-room', roomName);
    } else {
      console.warn(`Socket not connected (socket exists: ${!!this.socket}, isConnected: ${this.isConnected}, connected: ${this.socket?.connected}). Cannot leave room: ${roomName}`);
    }
  }

  // Reconnect with a new token (useful when token is refreshed)
  reconnectWithNewToken(newToken: string) {
    this.disconnect();
    this.connect(newToken);
  }
}

// Create a singleton instance
export const socketIOService = new SocketIOService();

// Export additional methods for managing the socket connection lifecycle
export const initializeSocketConnection = (token: string) => {
  socketIOService.connect(token);
};

export const disconnectSocket = () => {
  socketIOService.disconnect();
};

export const isSocketConnected = (): boolean => {
  return socketIOService.isConnectedToServer();
};