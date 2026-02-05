import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';
import { chatService, Conversation } from '../../services/chatService';
import { Ionicons } from '@expo/vector-icons';

export default function ChatTabScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversations();
      setConversations(response.metadata);
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
      if (error.message.includes('Authentication')) {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          [
            { text: 'Đăng nhập', onPress: () => router.push('/auth/login') },
            { text: 'Hủy', style: 'cancel' }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToChat = (receiverId: string) => {
    router.push(`/chat/${receiverId}`);
  };


  // Don't render anything if not authenticated, useEffect will handle navigation
  if (!isAuthenticated) {
    return null;
  }

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = item.sender; // Based on the backend response structure
    const lastMessage = item.lastMessage?.message || 'Bắt đầu cuộc trò chuyện';
    const lastMessageTime = item.lastMessage 
      ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    
    return (
      <TouchableOpacity 
        key={otherUser.id}
        style={styles.chatButton}
        onPress={() => navigateToChat(otherUser.id)}
      >
        <View style={styles.chatInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person-circle" size={40} color="#ccc" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.chatButtonText} numberOfLines={1}>
              {otherUser.username || 'Người dùng'}
            </Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage}
            </Text>
          </View>
        </View>
        <View style={styles.messageInfo}>
          <Text style={styles.timeText}>{lastMessageTime}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Tin nhắn</Text>
        <Text style={styles.description}>Danh sách cuộc trò chuyện</Text>
        {loading ? (
          <Text style={styles.loadingText}>Đang tải...</Text>
        ) : conversations.length > 0 ? (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.sender.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bạn chưa có cuộc trò chuyện nào</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  listContainer: {
    flex: 1,
    marginTop: 10,
  },
  title: {
    marginTop: 30,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom:5,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#666',
  },
  chatButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assistantButton: {
    backgroundColor: '#E6F7FF', // Light blue background for the assistant
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  chatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  chatButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  assistantText: {
    color: '#007AFF',
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  messageInfo: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});