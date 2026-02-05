import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faTimes, faPaperPlane, faRobot } from '@fortawesome/free-solid-svg-icons';
import { requestChatbot } from '../../config/request';
import './Chatbot.css';

const CHATBOT_STORAGE_KEY = 'chatbot_messages';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inputMessage, setInputMessage] = useState('');

    // Initialize messages from localStorage or default
    const [messages, setMessages] = useState(() => {
        const savedMessages = localStorage.getItem(CHATBOT_STORAGE_KEY);
        if (savedMessages) {
            try {
                return JSON.parse(savedMessages);
            } catch (e) {
                console.error('Error parsing saved messages:', e);
            }
        }
        return [{ text: 'Xin chào! Tôi là trợ lý AI chuyên hỗ trợ tìm phòng trọ. Tôi có thể giúp gì cho bạn?', sender: 'bot' }];
    });

    const messagesEndRef = useRef(null);

    // Save messages to localStorage whenever messages change
    useEffect(() => {
        localStorage.setItem(CHATBOT_STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (inputMessage.trim() && !isLoading) {
            const userMessage = inputMessage.trim();
            setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
            setInputMessage('');
            setIsLoading(true);

            try {
                const response = await requestChatbot({ question: userMessage });

                if (response && response.type === 'show_rooms') {
                    // If showing rooms, only add the room list component (avoid duplicate messages)
                    setMessages((prev) => [
                        ...prev,
                        {
                            type: 'ROOM_LIST',
                            rooms: response.rooms || [],
                            message: response.response,
                            sender: 'bot'
                        }
                    ]);
                } else {
                    // Regular text response
                    setMessages((prev) => [
                        ...prev,
                        { text: response.response || response, sender: 'bot' }
                    ]);
                }
            } catch (error) {
                console.error("Lỗi khi gọi API chatbot:", error);
                setMessages((prev) => [
                    ...prev,
                    {
                        text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
                        sender: 'bot',
                    },
                ]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Function to clear chat history
    const clearChatHistory = () => {
        localStorage.removeItem(CHATBOT_STORAGE_KEY);
        setMessages([{ text: 'Xin chào! Tôi là trợ lý AI chuyên hỗ trợ tìm phòng trọ. Tôi có thể giúp gì cho bạn?', sender: 'bot' }]);
    };

    return (
        <>
            {!isOpen && (
                <button 
                    className="ai-chatbot-button" 
                    onClick={() => setIsOpen(true)} 
                    aria-label="Mở chatbot"
                >
                    <FontAwesomeIcon icon={faRobot} />
                </button>
            )}

            {isOpen && (
                <div className="ai-chatbot-container">
                    <div className="ai-chat-header">
                        <div className="ai-chat-title">
                            <FontAwesomeIcon icon={faRobot} className="ai-icon" />
                            <h2>Trợ lý AI Phòng Trọ</h2>
                        </div>
                        <div className="ai-chat-controls">
                            <button 
                                className="ai-clear-btn" 
                                onClick={clearChatHistory}
                                title="Xóa lịch sử trò chuyện"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                            <button 
                                className="ai-close-btn" 
                                onClick={() => setIsOpen(false)} 
                                aria-label="Đóng chat"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="ai-message-list">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`ai-message ${message.sender === 'user' ? 'ai-user-message' : 'ai-bot-message'}`}
                            >
                                {message.type === 'ROOM_LIST' ? (
                                    <div className="ai-room-list-container">
                                        {message.message && message.message.trim() !== '' && (
                                            <div className="ai-room-list-message">{message.message}</div>
                                        )}
                                        <div className="ai-room-grid">
                                            {(message.rooms || []).map((room, roomIdx) => (
                                                <div
                                                    key={roomIdx}
                                                    className="ai-room-card"
                                                    onClick={() => window.open(`/chi-tiet-tin-dang/${room._id}`, '_self')}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="ai-room-image">
                                                        {room.images && room.images.length > 0 ? (
                                                            <img
                                                                src={room.images[0]}
                                                                alt={room.title}
                                                                onError={(e) => {
                                                                    e.target.src = 'https://via.placeholder.com/300x200.png?text=No+Image';
                                                                }}
                                                            />
                                                        ) : (
                                                            <img
                                                                src="https://via.placeholder.com/300x200.png?text=No+Image"
                                                                alt="No image available"
                                                                onError={(e) => e.target.style.display = 'none'} // Hide if even placeholder fails
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="ai-room-info">
                                                        <h4 className="ai-room-title">{room.title}</h4>
                                                        <div className="ai-room-details">
                                                            <p className="ai-room-price">
                                                                Giá: {new Intl.NumberFormat('vi-VN', {
                                                                    style: 'currency',
                                                                    currency: 'VND'
                                                                }).format(room.price)}/tháng
                                                            </p>
                                                            <p className="ai-room-location">Địa điểm: {room.location}</p>
                                                            <p className="ai-room-area">Diện tích: {room.area} m²</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="ai-view-detail-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent triggering the parent click
                                                            window.open(`/chi-tiet-tin-dang/${room._id}`, '_self');
                                                        }}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="ai-message-content">{message.text}</div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="ai-message ai-bot-message">
                                <div className="ai-message-content">
                                    <span className="ai-typing-indicator">Đang suy nghĩ...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <form onSubmit={handleSubmit} className="ai-input-form">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Hỏi tôi về phòng trọ (Ví dụ: Tìm phòng dưới 3 triệu ở Hà Nội)..."
                            className="ai-input"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            className="ai-send-button" 
                            disabled={isLoading}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;