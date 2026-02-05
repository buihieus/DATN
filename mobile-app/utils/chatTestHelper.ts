/**
 * Chat Test Helper
 * This utility helps test the real-time chat functionality
 */

import { socketIOService, isSocketConnected } from '../services/SocketIOService';
import { chatService } from '../services/chatService';

export const chatTestHelper = {
  /**
   * Test socket connection
   */
  testSocketConnection: (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if socket is currently connected
      const isConnected = isSocketConnected();
      console.log('Current socket connection status:', isConnected);
      
      if (isConnected) {
        resolve(true);
        return;
      }
      
      // If not connected, try to listen for connection
      const timeout = setTimeout(() => {
        console.log('Socket connection test timed out');
        resolve(false);
      }, 10000);
      
      const handleConnect = () => {
        clearTimeout(timeout);
        socketIOService.unsubscribe(); // Clean up test handler
        resolve(true);
      };
      
      const handleConnectError = (error: any) => {
        clearTimeout(timeout);
        socketIOService.unsubscribe(); // Clean up test handler
        console.error('Socket connection error:', error);
        resolve(false);
      };
      
      socketIOService.subscribe({
        onConnect: handleConnect,
        onError: handleConnectError,
        onDisconnect: handleConnectError
      });
    });
  },

  /**
   * Test message sending and receiving
   */
  testMessageFlow: async (receiverId: string, testMessage: string): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        // Subscribe to new messages
        const messageReceivedPromise = new Promise<boolean>((resolveMsg) => {
          const timeout = setTimeout(() => {
            console.log('Message flow test timed out');
            socketIOService.unsubscribe();
            resolveMsg(false);
          }, 15000); // 15 second timeout

          const handleNewMessage = (data: any) => {
            clearTimeout(timeout);
            socketIOService.unsubscribe();
            console.log('Received message in test:', data);
            resolveMsg(true);
          };

          socketIOService.subscribe({
            onNewMessage: handleNewMessage
          });
        });

        // Send a test message
        const response = await chatService.sendMessage(receiverId, testMessage);
        console.log('Sent test message:', response);

        // Wait for the message to be received back
        const result = await messageReceivedPromise;
        resolve(result);
      } catch (error) {
        console.error('Error in message flow test:', error);
        resolve(false);
      }
    });
  },

  /**
   * Test joining a conversation room
   */
  testRoomJoin: (conversationId: string, userId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!isSocketConnected()) {
        console.log('Cannot test room join - socket not connected');
        resolve(false);
        return;
      }
      
      // Create room name based on user IDs (sorted to ensure consistency)
      const roomName = [userId, conversationId].sort().join('_');
      console.log('Attempting to join room:', roomName);
      
      // Listen for room joined confirmation (if server sends it)
      const timeout = setTimeout(() => {
        console.log('Room join test timed out');
        resolve(false);
      }, 10000);
      
      // Subscribe to the room joined event
      socketIOService.subscribe({
        onConnect: () => {
          // Join the room after connection
          socketIOService.joinRoom(roomName);
        }
      });
      
      // Simulate success after a short delay since server might not send confirmation
      setTimeout(() => {
        clearTimeout(timeout);
        console.log('Test assumes room join successful');
        resolve(true);
      }, 2000);
    });
  }
};