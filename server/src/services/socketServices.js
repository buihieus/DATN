
// Change usersMap to store an array of sockets for each user (support multiple connections per user)
const usersMap = new Map(); // Key: userId, Value: array of sockets
global.usersMap = usersMap;

// Map to store socket to rooms (for conversation-specific messaging)
const socketRooms = new Map(); // Key: socket.id, Value: Set of room IDs
global.socketRooms = socketRooms;

const cookie = require('cookie');
const { verifyToken } = require('./tokenSevices');

class SocketServices {
  connection(socket) {
    try {
      console.log('New socket connection attempt:', socket.id);
      console.log('Socket handshake headers:', Object.keys(socket.handshake.headers));
      console.log('Socket handshake auth:', socket.handshake.auth);
      console.log('Authorization header:', socket.handshake.headers.authorization);
      console.log('Client type header:', socket.handshake.headers['client-type']);

      let token = null;
      const isMobile = socket.handshake.headers['client-type'] === 'mobile';

      if (isMobile) {
        // Mobile: ưu tiên header và auth object
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
          console.log('Token from header (mobile):', token ? 'found' : 'not found');
        }

        if (!token && socket.handshake.auth?.token) {
          token = socket.handshake.auth.token;
          console.log('Token from auth object (mobile):', token ? 'found' : 'not found');
        }

        if (!token && socket.handshake.headers.cookie) {
          const parsedCookies = cookie.parse(socket.handshake.headers.cookie || '');
          token = parsedCookies.token;
          console.log('Token from cookie (mobile fallback):', token ? 'found' : 'not found');
        }
      } else {
        // Web: ưu tiên cookie
        if (socket.handshake.headers.cookie) {
          const parsedCookies = cookie.parse(socket.handshake.headers.cookie || '');
          token = parsedCookies.token;
          console.log('Token from cookie (web):', token ? 'found' : 'not found');
        }

        if (!token) {
          const authHeader = socket.handshake.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('Token from header (web fallback):', token ? 'found' : 'not found');
          }
        }

        if (!token && socket.handshake.auth?.token) {
          token = socket.handshake.auth.token;
          console.log('Token from auth object (web fallback):', token ? 'found' : 'not found');
        }
      }

      if (!token) {
        console.log('No token provided in socket connection');
        socket.emit('auth-error', { message: 'Authentication token required' });
        return socket.disconnect();
      }

      console.log('Attempting to verify token for socket connection...');
      verifyToken(token)
        .then((dataDecode) => {
          if (!dataDecode) {
            console.log('Invalid token provided');
            socket.emit('auth-error', { message: 'Invalid token provided' });
            return socket.disconnect();
          }

          const userId = dataDecode.id.toString();
          
          // Get existing sockets for this user or initialize an empty array
          let userSockets = usersMap.get(userId) || [];
          
          // Check if this socket is already in the list (reconnection scenario)
          const existingSocketIndex = userSockets.findIndex(s => s.id === socket.id);
          if (existingSocketIndex === -1) {
            // Add new socket to the user's socket array
            userSockets.push(socket);
            usersMap.set(userId, userSockets);
            console.log(`User ${userId} connected with socket ID: ${socket.id}. Total connections: ${userSockets.length}`);
          } else {
            // Socket already exists, just update it
            userSockets[existingSocketIndex] = socket;
            usersMap.set(userId, userSockets);
            console.log(`User ${userId} reconnected with existing socket ID: ${socket.id}`);
          }

          // Initialize socket rooms map
          socketRooms.set(socket.id, new Set());

          // Listen for room joining
          socket.on('join-room', (roomName) => {
            const roomId = roomName.toString();
            socket.join(roomId);
            
            // Update socket's room tracking
            const rooms = socketRooms.get(socket.id);
            if (rooms) {
              rooms.add(roomId);
              socketRooms.set(socket.id, rooms);
            }
            
            console.log(`Socket ${socket.id} joined room: ${roomId}`);
          });

          // Listen for leaving room
          socket.on('leave-room', (roomName) => {
            const roomId = roomName.toString();
            socket.leave(roomId);
            
            // Update socket's room tracking
            const rooms = socketRooms.get(socket.id);
            if (rooms) {
              rooms.delete(roomId);
              socketRooms.set(socket.id, rooms);
            }
            
            console.log(`Socket ${socket.id} left room: ${roomId}`);
          });

          // Thông báo người khác user này online
          for (const [otherUserId, otherUserSockets] of usersMap.entries()) {
            if (otherUserId !== userId) {
              // Emit to all sockets of other users
              otherUserSockets.forEach(connectedSocket => {
                connectedSocket.emit('user-status-update', {
                  userId,
                  status: 'online',
                  timestamp: new Date().toISOString(),
                });
              });
            }
          }

          // Xử lý disconnect
          socket.on('disconnect', (reason) => {
            console.log(`Socket disconnected: ${socket.id} for user: ${userId} - Reason: ${reason}`);
            
            // Remove socket from rooms tracking
            socketRooms.delete(socket.id);
            
            // Get the user's sockets array
            const userSockets = usersMap.get(userId);
            if (userSockets) {
              // Remove the specific socket from the user's socket array
              const socketIndex = userSockets.findIndex(s => s.id === socket.id);
              if (socketIndex !== -1) {
                userSockets.splice(socketIndex, 1);
                
                if (userSockets.length === 0) {
                  // If no more sockets for this user, remove from map
                  usersMap.delete(userId);
                  console.log(`User ${userId} fully disconnected (all sockets removed)`);
                  
                  // Thông báo người khác user này offline
                  for (const [otherUserId, otherUserSockets] of usersMap.entries()) {
                    // Emit to all sockets of other users
                    otherUserSockets.forEach(connectedSocket => {
                      connectedSocket.emit('user-status-update', {
                        userId,
                        status: 'offline',
                        timestamp: new Date().toISOString(),
                      });
                    });
                  }
                } else {
                  // Update the user's socket array
                  usersMap.set(userId, userSockets);
                  console.log(`User ${userId} still has ${userSockets.length} active connection(s)`);
                  
                  // Still connected if there are other sockets for this user
                  // Don't send offline status since user still has other connections
                }
              }
            }
          });

          // Nghe sự kiện lỗi
          socket.on('error', (error) => {
            console.error('Socket error for user', userId, ':', error);
          });
        })
        .catch((error) => {
          console.error('Socket authentication error:', error);
          socket.emit('auth-error', { message: error.message });
          socket.disconnect();
        });
    } catch (error) {
      console.error('Socket connection error:', error);
      socket.disconnect();
    }
  }
}

module.exports = new SocketServices();
