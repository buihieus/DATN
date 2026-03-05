import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChatBot } from '../hooks/useChatBot';
import { ChatbotMessage } from '@/services/chatbotService';
import { API_BASE_URL } from '@/services/apiConfig';
// import { ChatbotMessage } from '../../services/chatbotService';

interface ChatBotProps {
  visible: boolean;
  onClose: () => void;
}

// Function to process image URLs and replace localhost references
const processImageUrl = (url: string | undefined): string => {
  if (!url) return 'https://placehold.co/300x200';

  // Check if it's a Base64 string (starts with data:image/)
  if (url.startsWith('data:image/')) {
    return url; // Return as-is for Base64 images
  }

  // If it's already a full URL, replace localhost references
  if (url.startsWith('http')) {
    // Extract just the host:port part from API_BASE_URL (without protocol)
    const apiUrlNoProtocol = API_BASE_URL.replace(/^https?:\/\//, '');
    const apiProtocol = API_BASE_URL.startsWith('https') ? 'https' : 'http';

    return url
      .replace(/^http:\/\/localhost(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`)
      .replace(/^http:\/\/127\.0\.0\.1(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`)
      .replace(/^http:\/\/10\.0\.2\.2(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`)
      .replace(/^https:\/\/localhost(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`)
      .replace(/^https:\/\/127\.0\.0\.1(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`)
      .replace(/^https:\/\/10\.0\.2\.2(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`);
  }

  // If it's a relative path, construct the full URL
  const normalizedUrl = url.startsWith('/') ? url.substring(1) : url;
  return `${API_BASE_URL}/${normalizedUrl}`;
};

const ChatBot: React.FC<ChatBotProps> = ({ visible, onClose }) => {
  const { messages, isLoading, error, sendUserMessage, clearMessages } = useChatBot();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Scroll to the end when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      // Use a small delay to ensure the content has been rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  if (!visible) return null;

  const handleSend = async () => {
    const message = inputText.trim();
    if (message === '') return;

    // Clear input immediately
    setInputText('');

    try {
      await sendUserMessage(message);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
      // Restore the message if sending failed
      setInputText(message);
    }
  };

  const renderMessage = ({ item }: { item: ChatbotMessage }) => {
    const isUser = item.sender === 'user';

    // Handle room recommendation responses (similar to web version)
    if (typeof item.content !== 'string' && item.content.type === 'show_rooms' && item.content.rooms) {
      console.log('=== ROOMS DATA ===');
      console.log('Number of rooms:', item.content.rooms.length);
      console.log('First room:', JSON.stringify(item.content.rooms[0], null, 2));
      console.log('First room images:', item.content.rooms[0]?.images);
      console.log('First room title:', item.content.rooms[0]?.title);
      console.log('First room price:', item.content.rooms[0]?.price);
      console.log('First room location:', item.content.rooms[0]?.location);

      return (
        <View style={styles.messageContainer}>
          <View style={styles.botBubbleWithRooms}>
            {/* Display the message text */}
            {item.content.message && item.content.message.trim() !== '' && (
              <Text style={styles.botText}>{item.content.message}</Text>
            )}

            {/* Render room recommendations list */}
            {item.content.rooms.map((room, index) => {
              console.log(`Room ${index} (${room._id}):`);
              console.log('  - images:', room.images);
              console.log('  - title:', room.title);
              console.log('  - price:', room.price);
              console.log('  - location:', room.location);
              console.log('  - area:', room.area);
              
              return (
                <TouchableOpacity
                  key={room._id}
                  style={styles.roomRecommendationItem}
                  onPress={() => router.push(`/rooms/${room._id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.roomContent}>
                    <View style={styles.roomImageContainer}>
                      {room.images && room.images.length > 0 ? (
                        <Image
                          source={{ uri: processImageUrl(room.images[0]) }}
                          style={styles.roomImage}
                          resizeMode="cover"
                          onError={(e) => {
                            console.log('❌ Image load error:', room.images[0]);
                            console.log('Processed URL:', processImageUrl(room.images[0]));
                          }}
                          onLoad={() => console.log('✅ Image loaded:', processImageUrl(room.images[0]))}
                        />
                      ) : (
                        <View style={styles.noImagePlaceholder}>
                          <Text style={styles.noImageText}>Không có ảnh</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.roomInfo}>
                      <Text style={styles.roomTitle} numberOfLines={2}>{room.title || 'Không có tiêu đề'}</Text>
                      <Text style={styles.roomPrice}>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(room.price || 0)}/tháng
                      </Text>
                      <Text style={styles.roomLocation} numberOfLines={1}>📍 {room.location || 'Không có địa điểm'}</Text>
                      <Text style={styles.roomArea}>📐 {room.area || 0} m²</Text>
                      <TouchableOpacity
                        style={styles.viewDetailButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/rooms/${room._id}`);
                        }}
                      >
                        <Text style={styles.viewDetailButtonText}>Xem chi tiết</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            <Text style={styles.timestamp}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    // Handle regular text messages
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
            {typeof item.content === 'string' ? item.content : item.content.message}
          </Text>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };


  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat với Trợ lý AI</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            // Auto scroll to bottom when content changes
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 10);
          }}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, isLoading && styles.textInputDisabled]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isLoading ? 'Đang xử lý...' : 'Hỏi tôi về phòng trọ...'}
            multiline
            maxLength={500}
            editable={!isLoading}
            selectTextOnFocus={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (inputText.trim() === '' || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isLoading || inputText.trim() === ''}
          >
            {isLoading ? (
              <Ionicons name="hourglass-outline" size={24} color="#fff" />
            ) : (
              <Ionicons name="send" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  messagesList: {
    flex: 1,
    marginBottom: 10,
  },
  messagesContent: {
    paddingVertical: 10,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 5,
  },
  botBubbleWithRooms: {
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    padding: 10,
    maxWidth: '90%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#000',
    fontSize: 14,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  textInputDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  roomRecommendationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  roomContent: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
  },
  roomImageContainer: {
    width: 100,
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 10,
    flexShrink: 0,
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 11,
  },
  roomInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingLeft: 4,
  },
  roomTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  roomPrice: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 3,
  },
  roomLocation: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  roomArea: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
  },
  viewDetailButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewDetailButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ChatBot;