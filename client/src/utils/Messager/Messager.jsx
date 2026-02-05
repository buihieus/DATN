import { useState, useEffect, useRef } from 'react';
import { requestCreateMessage, requestGetMessages, requestMarkAllMessagesRead } from '../../config/request';
import { useStore } from '../../hooks/useStore';
import { useSocket } from '../../hooks/useSocket';
import styles from './Messager.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function Messager({ user, setUsersMessage, usersMessage }) {
    const { dataMessages, setDataMessages, dataUser } = useStore();
    const { socketRef, newMessage } = useSocket();
    const messagesEndRef = useRef(null);
    const [valueMessager, setValueMessager] = useState('');

    const [unreadMessages, setUnreadMessages] = useState([]);

    // Scroll to bottom of messages when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [dataMessages]);

    // Fetch messages when component mounts or user changes
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const data = {
                    receiverId: user.id,
                };
                const res = await requestGetMessages(data);

                // Mark messages as read
                await markAllAsRead();

                // Update messages
                setDataMessages(res.metadata || []);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        // If messages are already loaded for this user in usersMessage, use that data
        if (user.messages && user.messages.length > 0) {
            setDataMessages(user.messages);

            // Filter unread messages
            const unread = user.messages.filter(
                (msg) => !msg.isRead && msg.senderId === user.id
            );
            setUnreadMessages(unread);

            // Mark messages as read after a delay
            const timer = setTimeout(() => {
                markAllAsRead();
            }, 1000); // Delay to allow user to see there were unread messages

            return () => clearTimeout(timer);
        } else {
            // Otherwise fetch from API
            fetchMessages();
        }

        // Join conversation room when component mounts
        if (socketRef.current && dataUser?._id && user?._id) {
            const roomName = [dataUser._id, user.id].sort().join('_');
            socketRef.current.joinRoom(roomName);
        }

        return () => {
            // Leave conversation room when component unmounts
            if (socketRef.current && dataUser?._id && user?._id) {
                const roomName = [dataUser._id, user.id].sort().join('_');
                socketRef.current.leaveRoom(roomName);
            }
        };
    }, [user.id, dataUser?._id]);

    // Handle new messages for this specific user
    useEffect(() => {
        if (newMessage && newMessage.senderId === user.id) {
            setDataMessages((prev) => [...prev, newMessage]);
        }
    }, [newMessage, user.id]);

    const markAllAsRead = async () => {
        try {
            await requestMarkAllMessagesRead({ 
                receiverId: user.id,
                senderId: dataUser._id 
            });
            
            // Update local state
            setUsersMessage((prev) => {
                return prev.map((u) => {
                    if (u.id === user.id) {
                        return {
                            ...u,
                            messages: u.messages.map((msg) => ({
                                ...msg,
                                isRead: true
                            }))
                        };
                    }
                    return u;
                });
            });
            
            setDataMessages((prev) => 
                prev.map((msg) => ({ ...msg, isRead: true }))
            );
            
            setUnreadMessages([]);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!valueMessager.trim()) return;

        try {
            // Prepare message data
            const messageData = {
                receiverId: user.id,
                senderId: dataUser._id,
                message: valueMessager.trim(),
                senderInfo: {
                    id: dataUser._id,
                    username: dataUser.username,
                    avatar: dataUser.avatar,
                    status: dataUser.status,
                },
            };

            // Send message via API - server will broadcast to all relevant sockets automatically
            const res = await requestCreateMessage(messageData);

            // Update local state
            const newMessageObj = {
                ...res.metadata,
                senderId: dataUser._id,
                receiverId: user.id,
            };

            setDataMessages((prev) => [...prev, newMessageObj]);
            setValueMessager('');
            
            // Also update the user's message list in the parent state
            setUsersMessage((prev) => 
                prev.map((u) => 
                    u.id === user.id 
                        ? { 
                            ...u, 
                            messages: [...u.messages, newMessageObj] 
                        } 
                        : u
                )
            );
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Gửi tin nhắn thất bại. Vui lòng thử lại.');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    return (
        <div className={cx('messager-container')}>
            <div className={cx('messager-header')}>
                <div className={cx('user-info')}>
                    <img 
                        src={user.avatar} 
                        alt={user.username} 
                        className={cx('user-avatar')}
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40x40?text=U'; // fallback image
                        }}
                    />
                    <div className={cx('user-details')}>
                        <h4 className={cx('user-name')}>{user.username}</h4>
                        <span className={cx('user-status', user.status === 'Đang hoạt động' ? 'online' : 'offline')}>
                            {user.status}
                        </span>
                    </div>
                </div>
                <button 
                    className={cx('close-btn')} 
                    onClick={() => {
                        // Remove this user's chat window
                        setUsersMessage(prev => prev.filter(u => u.id !== user.id));
                    }}
                >
                    ✕
                </button>
            </div>

            <div className={cx('messager-body')}>
                <div className={cx('messages-list')}>
                    {dataMessages && dataMessages.length > 0 ? (
                        dataMessages.map((msg, index) => (
                            <div
                                key={msg._id || index}
                                className={cx(
                                    'message',
                                    msg.senderId === dataUser._id ? 'sent' : 'received'
                                )}
                            >
                                <div className={cx('message-content')}>
                                    <p>{msg.message}</p>
                                    <span className={cx('message-time')}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={cx('empty-messages')}>
                            <p>Chưa có tin nhắn nào</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className={cx('messager-footer')}>
                <form onSubmit={handleSendMessage} className={cx('message-input-form')}>
                    <textarea
                        value={valueMessager}
                        onChange={(e) => setValueMessager(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập tin nhắn..."
                        className={cx('message-input')}
                        rows="1"
                    />
                    <button 
                        type="submit" 
                        className={cx('send-btn')}
                        disabled={!valueMessager.trim()}
                    >
                        Gửi
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Messager;