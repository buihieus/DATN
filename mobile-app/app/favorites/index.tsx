import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RoomCard from '../../components/RoomCard';
import { postService, Post } from '../../services/roomService'; // Still in roomService.ts
import { getFavorites, toggleFavorite as toggleFavoriteService, getUserFavoritePosts, removeFromFavorites, addToFavorites, isFavoritedFromBackend } from '../../services/favoriteService';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavoritePosts();
  }, []);

  const loadFavoritePosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user's favorite posts from backend
      const favoritePosts = await getUserFavoritePosts();
      
      if (favoritePosts.length === 0) {
        setFavorites([]);
        return;
      }
      
      // Process image URLs to handle localhost references
      const processedFavorites = favoritePosts.map((post: any) => {
        if (post.data && post.data.images) {
          // Handle the backend response format where metadata contains nested data
          const postData = post.data;
          // Process image URLs to replace localhost with actual IP
          const processedImages = postData.images.map((img: string) => {
            // Extract base URL from API_BASE_URL
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.16.103:3000';
            const apiUrlNoProtocol = API_BASE_URL.replace(/^https?:\/\/[^:\/]+(:\d+)?/, '');
            const apiProtocol = API_BASE_URL.startsWith('https') ? 'https' : 'http';
            const apiHost = API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
            const apiPort = API_BASE_URL.replace(/^https?:\/\/[^:]*:?(:\d+)?/, '$1').replace(/:/, '');
            const fullApiHost = apiPort ? `${apiHost}:${apiPort}` : apiHost;
            
            // Check if it's a Base64 string (starts with data:image/)
            if (img.startsWith('data:image/')) {
              return img; // Return as-is for Base64 images
            }

            if (img.startsWith('http')) {
              // Replace localhost references
              return img
                .replace(/^http:\/\/localhost(:\d+)?/, `${apiProtocol}://${fullApiHost}`)
                .replace(/^http:\/\/127\.0\.0\.1(:\d+)?/, `${apiProtocol}://${fullApiHost}`)
                .replace(/^http:\/\/10\.0\.2\.2(:\d+)?/, `${apiProtocol}://${fullApiHost}`);
            } else {
              // If relative path, construct full URL
              const normalizedUrl = img.startsWith('/') ? img.substring(1) : img;
              return `${API_BASE_URL}/${normalizedUrl}`;
            }
          });
          
          return {
            ...postData,
            images: processedImages,
            isFavorite: true // Mark as favorite
          };
        } else if (post.images) {
          // Handle direct post format
          const processedImages = post.images.map((img: string) => {
            // Extract base URL from API_BASE_URL
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.16.103:3000';
            const apiUrlNoProtocol = API_BASE_URL.replace(/^https?:\/\/[^:\/]+(:\d+)?/, '');
            const apiProtocol = API_BASE_URL.startsWith('https') ? 'https' : 'http';
            const apiHost = API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
            const apiPort = API_BASE_URL.replace(/^https?:\/\/[^:]*:?(:\d+)?/, '$1').replace(/:/, '');
            const fullApiHost = apiPort ? `${apiHost}:${apiPort}` : apiHost;
            
            // Check if it's a Base64 string (starts with data:image/)
            if (img.startsWith('data:image/')) {
              return img; // Return as-is for Base64 images
            }

            if (img.startsWith('http')) {
              // Replace localhost references
              return img
                .replace(/^http:\/\/localhost(:\d+)?/, `${apiProtocol}://${fullApiHost}`)
                .replace(/^http:\/\/127\.0\.0\.1(:\d+)?/, `${apiProtocol}://${fullApiHost}`)
                .replace(/^http:\/\/10\.0\.2\.2(:\d+)?/, `${apiProtocol}://${fullApiHost}`);
            } else {
              // If relative path, construct full URL
              const normalizedUrl = img.startsWith('/') ? img.substring(1) : img;
              return `${API_BASE_URL}/${normalizedUrl}`;
            }
          });
          
          return {
            ...post,
            images: processedImages,
            isFavorite: true // Mark as favorite
          };
        }
        return {
          ...post,
          isFavorite: true // Mark as favorite
        };
      });
      
      setFavorites(processedFavorites);
    } catch (err: any) {
      console.error('Error loading favorite posts:', err);
      setError(err.message || 'Failed to load favorite posts');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavoriteStatus = async (postId: string, currentIsFavorite: boolean) => {
    // Trong màn hình yêu thích, tất cả các bài đều đang được yêu thích
    // Vì vậy, hành động nhấn vào tim là hành động bỏ yêu thích
    try {
      // Gọi API xóa khỏi yêu thích trực tiếp
      const success = await removeFromFavorites(postId);
      
      if (success) {
        // Nếu xóa thành công, xóa bài khỏi UI
        setFavorites(prevFavorites => prevFavorites.filter(fav => fav._id !== postId));
        
        // Hiển thị thông báo thành công
        import('react-native-toast-message').then(Toast => {
          Toast.default.show({
            type: 'info',
            text1: 'Đã xóa khỏi yêu thích',
            text2: 'Bài đăng đã được xóa khỏi danh sách yêu thích',
          });
        });
      } else {
        // Nếu xóa không thành công (do đã không yêu thích trước đó hoặc lỗi khác)
        // Vẫn xóa khỏi UI vì người dùng đã thực hiện hành động bỏ yêu thích
        // và bài đó không còn trong danh sách yêu thích
        setFavorites(prevFavorites => prevFavorites.filter(fav => fav._id !== postId));
        
        import('react-native-toast-message').then(Toast => {
          Toast.default.show({
            type: 'info',
            text1: 'Bài đăng đã không còn trong danh sách yêu thích',
            text2: 'Bài đăng đã được gỡ khỏi danh sách yêu thích',
          });
        });
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      // Tải lại danh sách để khôi phục trạng thái nếu có lỗi
      await loadFavoritePosts();
    }
  };

  const handlePostPress = (postId: string) => {
    router.push(`/rooms/${postId}`);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <RoomCard 
      room={item} 
      onPress={() => handlePostPress(item._id)} 
      onFavoriteToggle={toggleFavoriteStatus} 
    />
  );

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu thích</Text>
        <View style={styles.spacer} />
      </View> */}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={30} color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#FF3B30" />
          <Text style={styles.errorText}>Lỗi: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadFavoritePosts}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderPost}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={60} color="#C0C0C0" />
          <Text style={styles.emptyTitle}>Chưa có bài đăng nào yêu thích</Text>
          <Text style={styles.emptySubtitle}>Nhấn vào biểu tượng trái tim để lưu bài đăng yêu thích</Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.exploreButtonText}>Khám phá bài đăng</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  spacer: {
    width: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginLeft: -30,
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});