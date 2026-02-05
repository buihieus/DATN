import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import ChatHeader from '../../components/ChatHeader';
import ChatBubble from '../../components/ChatBubble';
import ChatInput from '../../components/ChatInput';
import { chatService, Message } from '../../services/chatService';
import { useAuthStore } from '../../store/useUserStore';
import { useChat } from '../../hooks/useChat';
import { Ionicons } from '@expo/vector-icons';
import { useOnlineStatusManager } from '../../hooks/useOnlineStatusManager';
import { useOnlineStatusStore } from '../../store/useOnlineStatusStore';

export default function ChatDetailScreen() {
  const { chatId } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuthStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Initialize online status manager
  useOnlineStatusManager();

  // Handle the chatId parameter properly (it might be a string or array)
  const conversationUserId = typeof chatId === 'string' ? chatId : Array.isArray(chatId) ? chatId[0] : '';

  // Use the useChat hook for message management
  const {
    messages,
    loading,
    sendMessage: sendNewMessage,
    loadMessages
  } = useChat(conversationUserId);

  // Sort messages chronologically (oldest first, newest last)
  const sortedMessages = messages.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  useEffect(() => {
    if (chatId && typeof chatId === 'string') {
      loadMessages();
    }
  }, [chatId]);

  // Auto-scroll to bottom when messages change (after the initial load and new messages)
  useEffect(() => {
    if (sortedMessages.length > 0) {
      if (isInitialLoad) {
        // On initial load, scroll to bottom after a short delay to ensure rendering
        const timer = setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
            setIsInitialLoad(false);
          }
        }, 100);
        return () => clearTimeout(timer);
      } else {
        // For new messages, scroll to bottom with animation
        const timer = setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100); // Small delay to ensure the new item is rendered
        return () => clearTimeout(timer);
      }
    }
  }, [sortedMessages, isInitialLoad]);

  const handleSendMessage = async (content: string) => {
    if (!chatId || typeof chatId !== 'string' || !content.trim()) return;

    try {
      await sendNewMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error appropriately (e.g., show error message to user)
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = user?._id === item.senderId;
    return <ChatBubble message={item} isOwn={isOwnMessage} />;
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    // Show scroll to bottom button when user scrolls up more than 100 pixels from bottom
    const shouldShowButton = contentHeight - offsetY - layoutHeight > 100;
    setShowScrollToBottom(shouldShowButton);
  };

  const StatusDisplay = ({ userId }: { userId: string }) => {
    const isOnline = useOnlineStatusStore(state => state.getOnlineStatus(userId));

    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#34C759' : '#8E8E93' }]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Đang trực tuyến' : 'Đã ngoại tuyến'}
        </Text>
      </View>
    );
  };


  return (
    <>
      <Stack.Screen
        options={{
          title: 'Trò chuyện',
          headerShown: true,
          headerStyle: { backgroundColor: 'white' },
          headerTintColor: '#000',
          headerTitleAlign: 'left',
          headerLeft: () => (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => conversationUserId ? <StatusDisplay userId={conversationUserId} /> : null,
        }}
      />
      <View style={styles.container}>
        <View style={styles.messagesContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : messages.length > 0 ? (
          <>
            <FlatList
              ref={flatListRef}
              data={sortedMessages} // Chronological order (oldest first, newest last)
              renderItem={renderMessage}
              keyExtractor={item => item._id || `msg-${Date.now()}-${Math.random()}`} // Ensure unique key
              style={styles.list}
              contentContainerStyle={styles.listContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />
            {showScrollToBottom && (
              <TouchableOpacity style={styles.scrollToBottomButton} onPress={scrollToBottom}>
                <Ionicons name="chevron-down" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses" size={64} color="#D1D1D6" />
            <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
            <Text style={styles.emptySubtext}>Bắt đầu cuộc trò chuyện ngay hôm nay!</Text>
          </View>
        )
        }
      </View>
      <ChatInput onSend={handleSendMessage} />
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  messagesContainer: {
    flex: 1,
    position: 'relative',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 80, // Above the input field
    right: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});





// import React, { useEffect, useRef, useState } from 'react';
// import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
// import { router, useLocalSearchParams } from 'expo-router';
// import ChatHeader from '../../components/ChatHeader';
// import ChatBubble from '../../components/ChatBubble';
// import ChatInput from '../../components/ChatInput';
// import { chatService, Message } from '../../services/chatService';
// import { useAuthStore } from '../../store/useUserStore';
// import { useChat } from '../../hooks/useChat';
// import { Ionicons } from '@expo/vector-icons';

// export default function ChatDetailScreen() {
//   const { chatId } = useLocalSearchParams();
//   const flatListRef = useRef<FlatList>(null);
//   const { user } = useAuthStore();
//   const [isInitialLoad, setIsInitialLoad] = useState(true);
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);

//   // Handle the chatId parameter properly (it might be a string or array)
//   const conversationUserId = typeof chatId === 'string' ? chatId : Array.isArray(chatId) ? chatId[0] : '';

//   // Use the useChat hook for message management
//   const {
//     messages,
//     loading,
//     sendMessage: sendNewMessage,
//     loadMessages
//   } = useChat(conversationUserId);

//   // Sort messages chronologically (oldest first, newest last)
//   const sortedMessages = messages.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

//   useEffect(() => {
//     if (chatId && typeof chatId === 'string') {
//       loadMessages();
//     }
//   }, [chatId]);

//   // Auto-scroll to bottom when messages change (after the initial load and new messages)
//   useEffect(() => {
//     if (sortedMessages.length > 0) {
//       if (isInitialLoad) {
//         // On initial load, scroll to bottom after a short delay to ensure rendering
//         const timer = setTimeout(() => {
//           if (flatListRef.current) {
//             flatListRef.current.scrollToEnd({ animated: false });
//             setIsInitialLoad(false);
//           }
//         }, 100);
//         return () => clearTimeout(timer);
//       } else {
//         // For new messages, scroll to bottom with animation
//         const timer = setTimeout(() => {
//           if (flatListRef.current) {
//             flatListRef.current.scrollToEnd({ animated: true });
//           }
//         }, 100); // Small delay to ensure the new item is rendered
//         return () => clearTimeout(timer);
//       }
//     }
//   }, [sortedMessages, isInitialLoad]);

//   const handleSendMessage = async (content: string) => {
//     if (!chatId || typeof chatId !== 'string' || !content.trim()) return;

//     try {
//       await sendNewMessage(content);
//     } catch (error) {
//       console.error('Failed to send message:', error);
//       // Handle error appropriately (e.g., show error message to user)
//     }
//   };

//   const handleBack = () => {
//     router.back();
//   };

//   const renderMessage = ({ item }: { item: Message }) => {
//     const isOwnMessage = user?._id === item.senderId;
//     return <ChatBubble message={item} isOwn={isOwnMessage} />;
//   };

//   const scrollToBottom = () => {
//     if (flatListRef.current) {
//       flatListRef.current.scrollToEnd({ animated: true });
//     }
//   };

//   const handleScroll = (event: any) => {
//     const offsetY = event.nativeEvent.contentOffset.y;
//     const contentHeight = event.nativeEvent.contentSize.height;
//     const layoutHeight = event.nativeEvent.layoutMeasurement.height;

//     // Show scroll to bottom button when user scrolls up more than 100 pixels from bottom
//     const shouldShowButton = contentHeight - offsetY - layoutHeight > 100;
//     setShowScrollToBottom(shouldShowButton);
//   };

//   return (
//     <View style={styles.container}>
//       <ChatHeader
//         title="Cuộc trò chuyện"
//         subtitle="Đang trực tuyến"
//         onBack={handleBack}
//       />
//       <View style={styles.messagesContainer}>
//         {loading ? (
//           <View style={styles.loadingContainer}>
//             <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
//           </View>
//         ) : messages.length > 0 ? (
//           <>
//             <FlatList
//               ref={flatListRef}
//               data={sortedMessages} // Chronological order (oldest first, newest last)
//               renderItem={renderMessage}
//               keyExtractor={item => item._id || `msg-${Date.now()}-${Math.random()}`} // Ensure unique key
//               style={styles.list}
//               contentContainerStyle={styles.listContent}
//               onScroll={handleScroll}
//               scrollEventThrottle={16}
//             />
//             {showScrollToBottom && (
//               <TouchableOpacity style={styles.scrollToBottomButton} onPress={scrollToBottom}>
//                 <Ionicons name="chevron-down" size={24} color="#007AFF" />
//               </TouchableOpacity>
//             )}
//           </>
//         ) : (
//           <View style={styles.emptyContainer}>
//             <Ionicons name="chatbubble-ellipses" size={64} color="#D1D1D6" />
//             <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
//             <Text style={styles.emptySubtext}>Bắt đầu cuộc trò chuyện ngay hôm nay!</Text>
//           </View>
//         )}
//       </View>
//       <ChatInput onSend={handleSendMessage} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FAFAFA',
//   },
//   messagesContainer: {
//     flex: 1,
//     position: 'relative',
//   },
//   list: {
//     flex: 1,
//   },
//   listContent: {
//     paddingVertical: 12,
//     paddingHorizontal: 8,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#8E8E93',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '500',
//     color: '#333',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#8E8E93',
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   scrollToBottomButton: {
//     position: 'absolute',
//     bottom: 80, // Above the input field
//     right: 20,
//     backgroundColor: 'white',
//     borderRadius: 20,
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 5,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
// });