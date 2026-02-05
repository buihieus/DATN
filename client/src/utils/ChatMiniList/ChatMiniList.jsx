import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useStore } from '../../hooks/useStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTimes, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { requestGetMessages } from '../../config/request';
import userDefault from '../../assets/images/user-default.svg';
import dayjs from 'dayjs';
import './ChatMiniList.css';

function ChatMiniList() {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { dataUser } = useStore();
    const { dataMessagersUser, usersMessage, setUsersMessage } = useSocket();

    const toggleOpen = () => {
        if (!dataUser._id) return; // Don't open if not logged in
        setIsOpen(!isOpen);
        if (isCollapsed) setIsCollapsed(false); // Expand when clicked if collapsed
    };

    const toggleCollapse = (e) => {
        e.stopPropagation();
        setIsCollapsed(!isCollapsed);
    };

    const handleOpenMessager = async (user) => {
        console.log('Trying to open chat from mini list:', user.sender.username, 'ID:', user.sender.id);

        // Check if user already has a chat window open
        console.log('Current usersMessage:', usersMessage);

        const existingUser = usersMessage.find((existingUser) => String(existingUser.id) === String(user.sender.id));

        if (existingUser) {
            console.log('User already has chat window open:', existingUser);
            setIsOpen(false);
            return; // If already exists, don't add again
        }

        // Get message history
        try {
            const data = {
                receiverId: user.sender.id,
            };
            console.log('Fetching messages for:', user.sender.id);
            const res = await requestGetMessages(data);

            // Create user info to add to chat list
            const newUserMessage = {
                id: user.sender.id,
                username: user.sender.username,
                avatar: user.sender.avatar,
                status: user.sender.status,
                messages: res.metadata || [],
            };

            // Use state update function to ensure state is updated correctly
            setUsersMessage((prevMessages) => {
                console.log('Adding chat from mini list for:', user.sender.username);
                const updatedMessages = [...prevMessages, newUserMessage];
                console.log('Updated messages list:', updatedMessages);
                return updatedMessages;
            });

            setIsOpen(false);
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
        }
    };

    // Calculate total unread messages
    const unreadCount = dataMessagersUser
        ? dataMessagersUser.reduce((total, user) => total + (user.unreadCount || 0), 0)
        : 0;

    // Only show when user is logged in
    if (!dataUser._id) return null;

    return (
        <div className={`chat-mini-list ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="chat-mini-toggle" onClick={toggleOpen}>
                <div className="chat-icon-container">
                    <FontAwesomeIcon icon={faComments} className="chat-icon" />
                    {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
                </div>
                {!isCollapsed && <span className="chat-label">Tin nhắn</span>}
                <div className="toggle-buttons">
                    <button className="collapse-btn" onClick={toggleCollapse}>
                        <FontAwesomeIcon icon={isCollapsed ? faChevronUp : faChevronDown} />
                    </button>
                    <button className="close-btn" onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsCollapsed(false); }}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="chat-mini-dropdown">
                    <div className="chat-mini-header">
                        <div className="chat-header-left">
                            <h4>Trò chuyện gần đây</h4>
                            <span className="chat-header-count">{dataMessagersUser ? dataMessagersUser.length : 0}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsCollapsed(false); }} className="close-btn">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                    <div className="chat-mini-content">
                        {dataMessagersUser && dataMessagersUser.length > 0 ? (
                            dataMessagersUser.map((user, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleOpenMessager(user)}
                                    className={`chat-mini-item ${user.unreadCount > 0 ? 'has-unread' : ''}`}
                                >
                                    <div className="chat-mini-avatar">
                                        <img src={user.sender.avatar || userDefault} alt={user.sender.username} />
                                        <span
                                            className={`status-dot ${
                                                user.sender.status === 'Đang hoạt động' ? 'online' : 'offline'
                                            }`}
                                        ></span>
                                    </div>
                                    <div className="chat-mini-info">
                                        <div className="chat-info-top">
                                            <h3>{user.sender.username}</h3>
                                            <span className="time-ago">
                                                {dayjs(user.lastMessage.createdAt).format('HH:mm')}
                                            </span>
                                        </div>
                                        <div className="chat-info-bottom">
                                            <p>{user.lastMessage.message}</p>
                                            {user.unreadCount > 0 && (
                                                <span className="unread-count">{user.unreadCount}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-messages">
                                <p>Bạn chưa có tin nhắn nào</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatMiniList;