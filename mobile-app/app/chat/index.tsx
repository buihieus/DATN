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

  // Store subscription ID to properly unsubscribe later
  let subscriptionId: string | null = null;

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
      // Check if the new message is from the current user (received) or sent by current user
      // Update the conversations list optimistically instead of full reload
      setConversations(prev => {
        const updatedConversations = [...prev];
        const messageData = data.message;

        // Find if this conversation exists in the list
        const conversationIndex = updatedConversations.findIndex(
          conv => conv.sender.id === messageData.senderId || conv.sender.id === messageData.receiverId
        );

        if (conversationIndex !== -1) {
          // Update the existing conversation with the new message
          const updatedConversation = { ...updatedConversations[conversationIndex] };

          // Update last message
          updatedConversation.lastMessage = {
            message: messageData.message,
            createdAt: messageData.createdAt
          };

          // Increase unread count if the message is from other user and not from current user
          if (messageData.senderId !== user?.id) {
            updatedConversation.unreadCount += 1;
          }

          updatedConversations[conversationIndex] = updatedConversation;
        } else {
          // If conversation doesn't exist, we'll do a full refresh
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

    // Get the last message content and time
    const lastMessage = item.lastMessage ? item.lastMessage.message || item.lastMessage.content : 'Bắt đầu cuộc trò chuyện';
    const lastMessageTime = item.lastMessage && item.lastMessage.createdAt
      ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigateToChat(otherUser.id)}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={otherUser.avatar ? { uri: otherUser.avatar } : require('../../assets/images/partial-react-logo.png')}
            style={styles.avatar}
            contentFit="cover"
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
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{lastMessageTime}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Don't render anything if not authenticated, useEffect will handle navigation
  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Tin nhắn</Text>
        <Text style={styles.description}>Danh sách cuộc trò chuyện</Text>
      </View> */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : conversations.length > 0 ? (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.sender.id}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color="#D1D1D6" />
            <Text style={styles.emptyText}>Bạn chưa có cuộc trò chuyện nào</Text>
            <Text style={styles.emptySubtext}>Bắt đầu cuộc trò chuyện ngay hôm nay!</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80, // Extra padding to account for bottom navigation
  },
  conversationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  statusIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: 'white',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  timeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 17,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 8,
  },
});





// import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
// import { useEffect, useState } from 'react';
// import { router } from 'expo-router';
// import { useAuthStore } from '../../store/useUserStore';
// import { chatService, Conversation } from '../../services/chatService';

// export default function ChatScreen() {
//   const { isAuthenticated, user } = useAuthStore();
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (isAuthenticated) {
//       loadConversations();
//       // Subscribe to real-time messages to update conversation list
//       chatService.subscribeToMessages(handleNewMessage);
//     }

//     // Cleanup on component unmount
//     return () => {
//       chatService.unsubscribeFromMessages();
//     };
//   }, [isAuthenticated]);

//   const handleNewMessage = (data: any) => {
//     if (data?.message) {
//       // Check if the new message is from the current user (received) or sent by current user
//       // Update the conversations list optimistically instead of full reload
//       setConversations(prev => {
//         const updatedConversations = [...prev];
//         const messageData = data.message;
        
//         // Find if this conversation exists in the list
//         const conversationIndex = updatedConversations.findIndex(
//           conv => conv.sender.id === messageData.senderId || conv.sender.id === messageData.receiverId
//         );
        
//         if (conversationIndex !== -1) {
//           // Update the existing conversation with the new message
//           const updatedConversation = { ...updatedConversations[conversationIndex] };
          
//           // Update last message
//           updatedConversation.lastMessage = {
//             message: messageData.message,
//             createdAt: messageData.createdAt
//           };
          
//           // Increase unread count if the message is from other user and not from current user
//           if (messageData.senderId !== user?.id) {
//             updatedConversation.unreadCount += 1;
//           }
          
//           updatedConversations[conversationIndex] = updatedConversation;
//         } else {
//           // If conversation doesn't exist, we'll do a full refresh
//           loadConversations();
//           return prev;
//         }
        
//         return updatedConversations;
//       });
//     }
//   };

//   const loadConversations = async () => {
//     try {
//       setLoading(true);
//       const response = await chatService.getConversations();
//       setConversations(response.metadata);
//     } catch (error) {
//       console.error('Failed to load conversations:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const navigateToChat = (conversationId: string) => {
//     router.push(`/chat/${conversationId}`);
//   };

//   // Don't render anything if not authenticated, useEffect will handle navigation
//   if (!isAuthenticated) {
//     return null;
//   }

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.content}>
//         <Text style={styles.title}>Tin nhắn</Text>
//         <Text style={styles.description}>Danh sách cuộc trò chuyện</Text>
        
//         {loading ? (
//           <Text style={styles.loadingText}>Đang tải...</Text>
//         ) : conversations.length > 0 ? (
//           conversations.map((conversation) => {
//             const otherUser = conversation.sender;
            
//             // Get the last message content and time
//             const lastMessage = conversation.lastMessage ? conversation.lastMessage.message || conversation.lastMessage.content : 'Bắt đầu cuộc trò chuyện';
//             const lastMessageTime = conversation.lastMessage && conversation.lastMessage.createdAt
//               ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//               : '';
            
//             return (
//               <TouchableOpacity 
//                 key={otherUser.id}
//                 style={styles.chatButton}
//                 onPress={() => navigateToChat(otherUser.id)}
//               >
//                 <View style={styles.chatInfo}>
//                   <Text style={styles.chatButtonText}>
//                     {otherUser.username || 'Người dùng'}
//                   </Text>
//                   <Text style={styles.lastMessage} numberOfLines={1}>
//                     {lastMessage}
//                   </Text>
//                 </View>
//                 <View style={styles.messageInfo}>
//                   <Text style={styles.timeText}>{lastMessageTime}</Text>
//                   {conversation.unreadCount > 0 && (
//                     <View style={styles.unreadBadge}>
//                       <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
//                     </View>
//                   )}
//                 </View>
//               </TouchableOpacity>
//             );
//           })
//         ) : (
//           <View style={styles.emptyContainer}>
//             <Text style={styles.emptyText}>Bạn chưa có cuộc trò chuyện nào</Text>
//           </View>
//         )}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FAFAFA',
//   },
//   content: {
//     padding: 16,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: '700',
//     marginBottom: 4,
//     textAlign: 'left',
//     color: '#333',
//   },
//   description: {
//     fontSize: 16,
//     color: '#888',
//     textAlign: 'left',
//     marginBottom: 20,
//   },
//   loadingText: {
//     textAlign: 'center',
//     padding: 40,
//     fontSize: 16,
//     color: '#666',
//   },
//   chatButton: {
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 3,
//     elevation: 2,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   chatInfo: {
//     flex: 1,
//     marginRight: 12,
//   },
//   chatButtonText: {
//     fontSize: 17,
//     color: '#333',
//     fontWeight: '600',
//     marginBottom: 4,
//   },
//   lastMessage: {
//     fontSize: 15,
//     color: '#666',
//     marginTop: 2,
//   },
//   messageInfo: {
//     alignItems: 'flex-end',
//     justifyContent: 'space-between',
//   },
//   timeText: {
//     fontSize: 13,
//     color: '#A0A0A0',
//     marginBottom: 8,
//   },
//   unreadBadge: {
//     backgroundColor: '#FF3B30',
//     borderRadius: 10,
//     minWidth: 22,
//     height: 22,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 6,
//   },
//   unreadText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingTop: 100,
//   },
//   emptyText: {
//     fontSize: 17,
//     color: '#888',
//     textAlign: 'center',
//     marginTop: 8,
//   },
// });