import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChatBot } from '../hooks/useChatBot';
import { ChatbotMessage } from '@/services/chatbotService';
// import { ChatbotMessage } from '../../services/chatbotService';

interface ChatBotProps {
  visible: boolean;
  onClose: () => void;
}

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
    if (inputText.trim() === '') return;

    try {
      await sendUserMessage(inputText);
      setInputText('');
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const renderMessage = ({ item }: { item: ChatbotMessage }) => {
    const isUser = item.sender === 'user';

    // Handle room recommendation responses (similar to web version)
    if (typeof item.content !== 'string' && item.content.type === 'show_rooms' && item.content.rooms) {
      return (
        <View style={[styles.messageContainer, styles.botMessage]}>
          <View style={[styles.messageBubble, styles.botBubble]}>
            {/* Display the message text */}
            {item.content.message && item.content.message.trim() !== '' && (
              <Text style={[styles.messageText, styles.botText]}>{item.content.message}</Text>
            )}

            {/* Render room recommendations grid */}
            <View style={styles.roomRecommendationsContainer}>
              <FlatList
                data={item.content.rooms}
                horizontal={false}
                numColumns={1}
                keyExtractor={(room) => room._id}
                renderItem={({ item: room }) => (
                  <TouchableOpacity
                    style={styles.roomRecommendationItem}
                    onPress={() => router.push(`/rooms/${room._id}`)}
                  >
                    <View style={styles.roomImageContainer}>
                      {room.images && room.images.length > 0 ? (
                        <Image
                          source={{ uri: room.images[0] }}
                          style={styles.roomImage}
                          resizeMode="cover"
                          onError={() => console.log('Failed to load image:', room.images[0])}
                        />
                      ) : (
                        <View style={styles.noImagePlaceholder}>
                          <Text style={styles.noImageText}>No Image</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.roomInfo}>
                      <Text style={styles.roomTitle} numberOfLines={2}>{room.title}</Text>

                      <View style={styles.roomDetails}>
                        <Text style={styles.roomPrice}>
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(room.price)}/tháng
                        </Text>

                        <Text style={styles.roomLocation} numberOfLines={1}>📍 {room.location}</Text>
                        <Text style={styles.roomArea}>📐 {room.area} m²</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.viewDetailButton}
                      onPress={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent press
                        router.push(`/rooms/${room._id}`);
                      }}
                    >
                      <Text style={styles.viewDetailButtonText}>Xem chi tiết</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            </View>

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
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi tôi về phòng trọ..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isLoading || inputText.trim() === ''}
          >
            {isLoading ? (
              <Ionicons name="time" size={24} color="#fff" />
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
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#000',
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
  roomRecommendationsContainer: {
    marginTop: 10,
    width: '100%',
  },
  roomRecommendationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'column',
  },
  roomImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
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
    fontSize: 14,
  },
  roomInfo: {
    flex: 1,
    marginBottom: 10,
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
    minHeight: 40,
  },
  roomDetails: {
    gap: 4,
  },
  roomPrice: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  roomLocation: {
    fontSize: 12,
    color: '#666',
  },
  roomArea: {
    fontSize: 12,
    color: '#888',
  },
  viewDetailButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  viewDetailButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatBot;