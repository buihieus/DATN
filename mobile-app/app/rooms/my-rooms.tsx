import { StyleSheet, View, Text, FlatList, Alert, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';
import { postService, Post } from '../../services/roomService';
import MyRoomCard from '../../components/MyRoomCard';
import Toast from 'react-native-toast-message';

export default function MyRoomsScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.replace('/auth/login');
  //   } else {
  //     loadMyPosts();
  //   }
  // }, [isAuthenticated]);
  useEffect(() => {
    if (isAuthenticated) {
      loadMyPosts();
    }
  }, [isAuthenticated]);


  const loadMyPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getMyPosts();

      // Ensure all posts have proper data structure
      const processedPosts = response.metadata.map((post: Post) => ({
        ...post,
        images: Array.isArray(post.images) ? post.images : [],
        location: post.location || '',
        title: post.title || 'Bài đăng chưa có tiêu đề',
        price: post.price || 0,
        area: post.area || 0,
        description: post.description || 'Chưa có mô tả',
        options: Array.isArray(post.options) ? post.options : [],
        status: post.status || 'inactive'
      }));

      setPosts(processedPosts);
    } catch (error) {
      console.error('Error loading my posts:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải danh sách bài đăng của bạn',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyPosts();
  };

  // Handle deleting a post
  const handleDeletePost = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  };

  // Handle editing a post
  const handleEditPost = (post: Post) => {
    // Navigate to the edit post screen with the complete post data
    router.push({
      pathname: '/rooms/create',
      // Pass all required fields with proper formatting
      params: {
        editMode: 'true',
        postId: post._id,
        title: post.title || '',
        description: post.description || '',
        price: (post.price !== undefined && post.price !== null) ? post.price.toString() : '0',
        area: (post.area !== undefined && post.area !== null) ? post.area.toString() : '0',
        location: post.location || '',  // Clean location string
        // Ensure images is properly formatted as JSON string
        images: JSON.stringify(Array.isArray(post.images) ? post.images : []),
        category: post.category || 'phong-tro',
        username: post.username || user?.fullName || '',
        phone: post.phone || user?.phone || '',
        // Ensure options is properly formatted as JSON string
        options: JSON.stringify(Array.isArray(post.options) ? post.options : []),
        typeNews: post.typeNews || 'normal',
        status: post.status || 'inactive'
      }
    });
  };

  // Handle renewing a post
  const handleRenewPost = (post: Post) => {
    // Navigate to the renew post screen with the post data
    router.push({
      pathname: '/rooms/renew',
      params: {
        postId: post._id,
        title: post.title || '',
        typeNews: post.typeNews || 'normal',
        status: post.status || 'inactive',
        endDate: post.endDate || ''
      }
    });
  };

  // Don't render anything if not authenticated
  // if (!isAuthenticated) {
  //   return null;
  // }
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  const renderPost = ({ item }: { item: Post }) => {
    // Status indicator for post status
    let statusText = '';
    switch (item.status) {
      case 'active':
        statusText = '';
        break;
      case 'pending':
        statusText = ' (Chờ duyệt)';
        break;
      case 'inactive':
        statusText = ' (Chưa duyệt)';
        break;
      case 'cancel':
        statusText = ' (Đã hủy)';
        break;
      default:
        statusText = ` (${item.status})`;
    }

    return (
      <MyRoomCard
        post={{
          ...item,
          title: `${item.title}${statusText}` // Add status to title
        }}
        onPress={() => router.push(`/rooms/${item._id}`)}
        onFavoriteToggle={() => { }} // No favorite toggle needed for my rooms screen
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onRenew={handleRenewPost}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>Phòng đã đăng</Text>
        <Text style={styles.description}>Danh sách các phòng bạn đã đăng</Text>
      </View> */}

      {loading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bạn chưa có bài đăng nào</Text>
              <Text style={styles.emptySubtext}>Hãy tạo bài đăng đầu tiên của bạn!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
  },
});