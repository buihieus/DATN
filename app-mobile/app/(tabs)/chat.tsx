import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';
import { chatService, Conversation } from '../../services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useOnlineStatusManager } from '../../hooks/useOnlineStatusManager';


export default function ChatScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize online status manager
  useOnlineStatusManager();

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      // Subscribe to real-time messages to update conversation list
      chatService.subscribeToConversationUpdates(handleNewMessage);
    }

    // Cleanup on component unmount
    return () => {
      chatService.unsubscribeFromMessages();
    };
  }, [isAuthenticated]);

  const handleNewMessage = (data: any) => {
    if (data?.message) {
      setConversations(prev => {
        const updatedConversations = [...prev];
        const messageData = data.message;

        const conversationIndex = updatedConversations.findIndex(
          conv => conv.sender.id === messageData.senderId || conv.sender.id === messageData.receiverId
        );

        if (conversationIndex !== -1) {
          const updatedConversation = { ...updatedConversations[conversationIndex] };

          updatedConversation.lastMessage = {
            message: messageData.message,
            createdAt: messageData.createdAt
          };

          if (messageData.senderId !== user?.id) {
            updatedConversation.unreadCount += 1;
          }

          updatedConversations[conversationIndex] = updatedConversation;
        } else {
          loadConversations();
          return prev;
        }

        return updatedConversations;
      });
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversations();
      setConversations(response.metadata);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToChat = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = item.sender;

    const lastMessage = item.lastMessage ? item.lastMessage.message || item.lastMessage.content : 'Bắt đầu cuộc trò chuyện';
    const lastMessageTime = item.lastMessage && item.lastMessage.createdAt
      ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigateToChat(otherUser.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={otherUser.avatar ? { uri: otherUser.avatar } : require('../../assets/images/partial-react-logo.png')}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
          <View style={[styles.statusIndicator, { backgroundColor: otherUser.status === 'Đang hoạt động' ? '#34C759' : '#8E8E93' }]} />
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherUser.username || 'Người dùng'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.messageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage}
            </Text>
          </View>
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{lastMessageTime}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="chatbubbles" size={28} color="#007AFF" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Tin nhắn</Text>
            <Text style={styles.subtitle}>Kết nối với mọi người</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={48} color="#007AFF" />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : conversations.length > 0 ? (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.sender.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={64} color="#007AFF" />
            </View>
            <Text style={styles.emptyText}>Chưa có cuộc trò chuyện</Text>
            <Text style={styles.emptySubtext}>Bắt đầu trò chuyện ngay hôm nay!</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  conversationItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    position: 'relative',
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  statusIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  timeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 50,
  },
  timeText: {
    fontSize: 11,
    color: '#C7C7CC',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 150,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});
