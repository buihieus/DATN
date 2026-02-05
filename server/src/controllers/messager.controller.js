const { BadRequestError } = require('../core/error.response');
const modelMessager = require('../models/Messager.model');
const modelUser = require('../models/users.model');

const { Created, OK } = require('../core/success.response');

class controllerMessager {
    async createMessage(req, res) {
        const { id } = req.user;
        const { receiverId, message } = req.body;
        if (!receiverId || !message) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        const newMessage = await modelMessager.create({
            senderId: id,
            receiverId,
            message,
            isRead: false,
        });

        // Create room name based on user IDs (sorted to ensure consistency)
        const roomName = [id, receiverId].sort().join('_');

        // Emit to all users in the chat room (both sender and receiver)
        if (global.io) {
            global.io.to(roomName).emit('new-message', {
                message: newMessage,
            });
        }

        // Also emit to individual user sockets as fallback for users not in room
        const receiverSockets = global.usersMap.get(receiverId.toString());
        if (receiverSockets && receiverSockets.length > 0) {
            // Emit to all connected sockets for this user (web, mobile, etc.)
            receiverSockets.forEach(socket => {
                socket.emit('new-message', {
                    message: newMessage,
                });
            });
        }

        // Also emit to sender sockets in case they have multiple devices
        const senderSockets = global.usersMap.get(id.toString());
        if (senderSockets && senderSockets.length > 0) {
            // Emit to all connected sockets for this user (web, mobile, etc.)
            senderSockets.forEach(socket => {
                socket.emit('new-message', {
                    message: newMessage,
                });
            });
        }

        // Ensure the message is sent to both participants with both event types
        // to maximize compatibility across different client types
        const allParticipantsSockets = [
            ...(receiverSockets || []),
            ...(senderSockets || [])
        ];

        // Send new-user-message to ensure mobile clients get it
        allParticipantsSockets.forEach(socket => {
            socket.emit('new-user-message', {
                message: newMessage,
            });
        });

        // Also send conversation update to ensure conversation lists are updated
        if (receiverSockets) {
            receiverSockets.forEach(socket => {
                socket.emit('new-conversation', {
                    message: newMessage,
                    type: 'new_message_received'
                });
            });
        }

        new Created({
            message: 'Tạo tin nhắn thành công',
            metadata: newMessage,
        }).send(res);
    }

    async getMessages(req, res) {
        const { id } = req.user;
        const { receiverId } = req.query;

        // Lấy tất cả tin nhắn giữa hai người dùng
        const messages = await modelMessager
            .find({
                $or: [
                    { senderId: id, receiverId },
                    { senderId: receiverId, receiverId: id },
                ],
            })
            .sort({ createdAt: 1 });

        // Đánh dấu tất cả tin nhắn từ người nhận gửi đến là đã đọc
        await modelMessager.updateMany({ senderId: receiverId, receiverId: id, isRead: false }, { isRead: true });

        new OK({
            message: 'Lấy tin nhắn thành công',
            metadata: messages,
        }).send(res);
    }

    async markMessageAsRead(req, res) {
        const { id } = req.user;
        const { messageId } = req.body;

        if (!messageId) {
            throw new BadRequestError('Vui lòng cung cấp ID tin nhắn');
        }

        // Cập nhật trạng thái đã đọc cho 1 tin nhắn cụ thể
        const updatedMessage = await modelMessager.findOneAndUpdate(
            { _id: messageId, receiverId: id, isRead: false },
            { isRead: true },
            { new: true },
        );

        if (!updatedMessage) {
            throw new BadRequestError('Không tìm thấy tin nhắn hoặc tin nhắn đã được đọc');
        }

        new OK({
            message: 'Đánh dấu tin nhắn đã đọc thành công',
            metadata: updatedMessage,
        }).send(res);
    }

    async markAllMessagesAsRead(req, res) {
        const { id } = req.user;
        const { senderId } = req.body;

        if (!senderId) {
            throw new BadRequestError('Vui lòng cung cấp ID người gửi');
        }

        // Đánh dấu tất cả tin nhắn từ một người gửi cụ thể là đã đọc
        const result = await modelMessager.updateMany({ senderId, receiverId: id, isRead: false }, { isRead: true });

        // Thông báo cho người gửi biết tin nhắn đã được đọc
        const senderSockets = global.usersMap.get(senderId.toString());
        if (senderSockets && senderSockets.length > 0) {
            // Emit to all connected sockets for the sender (web, mobile, etc.)
            senderSockets.forEach(socket => {
                socket.emit('messages-read', {
                    readerId: id,
                    count: result.modifiedCount,
                });
            });
        }

        new OK({
            message: 'Đánh dấu tất cả tin nhắn đã đọc thành công',
            metadata: { updatedCount: result.modifiedCount },
        }).send(res);
    }

    async getMessagesByUserId(req, res) {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            throw new BadRequestError('User not authenticated');
        }

        const { id } = req.user;

        // Get all messages where the current user is the receiver
        const messages = await modelMessager.find({
            $or: [{ senderId: id }, { receiverId: id }],
        });

        // Tạo danh sách các ID người dùng duy nhất mà người dùng hiện tại đã tương tác
        const uniqueUserIds = [
            ...new Set([
                ...messages.filter((msg) => msg.senderId && msg.senderId.toString() !== id).map((msg) => msg.senderId),
                ...messages.filter((msg) => msg.receiverId && msg.receiverId.toString() !== id).map((msg) => msg.receiverId),
            ]),
        ];

        // Get user information for each unique user
        const users = await modelUser.find({ _id: { $in: uniqueUserIds } });

        // Create a map of userId to user info for easy lookup
        const userMap = {};
        users.forEach((user) => {
            const userId = user._id.toString();
            let statusUser = 'Đang offline';

            // Kiểm tra xem người dùng có đang online không
            // Check if global.usersMap exists and has the userId
            if (global.usersMap && global.usersMap.has(userId)) {
                const userSockets = global.usersMap.get(userId);
                if (userSockets && userSockets.length > 0) {
                    statusUser = 'Đang hoạt động';
                }
            }

            userMap[userId] = {
                id: user._id,
                username: user.fullName,
                avatar: user.avatar,
                status: statusUser,
            };
        });

        // Count unread messages per user
        const unreadCounts = {};
        messages.forEach((msg) => {
            if (msg.receiverId && msg.receiverId.toString() === id && !msg.isRead) {
                const senderId = msg.senderId.toString();
                if (!unreadCounts[senderId]) {
                    unreadCounts[senderId] = 0;
                }
                unreadCounts[senderId]++;
            }
        });

        // Create the final response with sender info, unread counts and last message
        const result = uniqueUserIds
            .map((userId) => {
                const userIdStr = userId.toString();

                // Find the most recent message between users
                const userMessages = messages.filter(
                    (msg) =>
                        (msg.senderId && msg.senderId.toString() === userIdStr && msg.receiverId && msg.receiverId.toString() === id) ||
                        (msg.senderId && msg.senderId.toString() === id && msg.receiverId && msg.receiverId.toString() === userIdStr),
                );

                const lastMessage =
                    userMessages.length > 0
                        ? userMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                        : null;

                return {
                    sender: userMap[userIdStr] || { id: userIdStr },
                    unreadCount: unreadCounts[userIdStr] || 0,
                    lastMessage,
                };
            })
            .filter((item) => item.lastMessage !== null);

        new OK({
            message: 'Lấy tin nhắn thành công',
            metadata: result,
        }).send(res);
    }
}

module.exports = new controllerMessager();
