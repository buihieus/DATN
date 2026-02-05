import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { postService, Post } from '../services/roomService';
import { API_BASE_URL } from '@/services/apiConfig';
import Toast from 'react-native-toast-message';
import { toggleFavorite } from '../services/favoriteService';

interface MyRoomCardProps {
  post: Post;
  onFavoriteToggle: (roomId: string, isFavorite: boolean) => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  onRenew: (post: Post) => void;
  onPress: () => void;
}

const MyRoomCard: React.FC<MyRoomCardProps> = ({ post, onFavoriteToggle, onEdit, onDelete, onRenew, onPress }) => {
  const [isToggling, setIsToggling] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Process image URL to handle different formats
  const processImageUrl = (url: string | undefined): string => {
    if (!url) return 'https://placehold.co/300x200';

    // Check if it's a Base64 string (starts with data:image/)
    if (url.startsWith('data:image/')) {
      return url; // Return as-is for Base64 images
    }

    // If it's already a full URL, replace localhost/127.0.0.1/10.0.2.2 references to match API_BASE_URL
    if (url.startsWith('http')) {
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

  const handleFavoritePress = async () => {
    if (isToggling) return;

    try {
      setIsToggling(true);
      const currentIsFavorite = !!post.isFavorite;
      const newIsFavoriteStatus = await toggleFavorite(post._id);
      onFavoriteToggle(post._id, currentIsFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể cập nhật yêu thích'
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleEditPress = () => {
    onEdit(post);
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa bài đăng này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await postService.deletePost(post._id);
              onDelete(post._id);
              Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Bài đăng đã được xóa',
              });
            } catch (error) {
              console.error('Error deleting post:', error);
              Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể xóa bài đăng, vui lòng thử lại',
              });
            }
          }
        }
      ]
    );
  };

  const handleRenewPress = () => {
    onRenew(post);
  };

  // Show options with "Sửa", "Gia hạn", and "Xóa"
  const showOptions = () => {
    Alert.alert(
      'Tùy chọn bài đăng',
      'Chọn hành động cho bài đăng này',
      [
        { text: 'Chỉnh sửa', onPress: handleEditPress },
        { text: 'Gia hạn', onPress: handleRenewPress },
        { text: 'Xóa', onPress: handleDeletePress, style: 'destructive' },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  // Get the first image or a placeholder
  const imageUrl = (post.images && post.images.length > 0 && post.images[0])
    ? processImageUrl(post.images[0])
    : 'https://placehold.co/300x200.png';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imageContainer} onPress={onPress}>
        <View style={styles.imageWrapper}>
          {imageLoading && !imageError && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
          {imageError ? (
            <View style={styles.imageErrorContainer}>
              <Ionicons name="image-outline" size={40} color="#ccc" />
              <Text style={styles.imageErrorText}>Lỗi tải ảnh</Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          )}
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          disabled={isToggling}
        >
          <Ionicons
            name={post.isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={post.isFavorite ? "#FF3B30" : "white"}
          />
          {isToggling && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.loadingIndicator}>
                <Ionicons name="refresh" size={14} color="#fff" style={{ transform: [{ rotate: '0deg' }] }} />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{post.price?.toLocaleString('vi-VN')} ₫/tháng</Text>
          <Text style={styles.area}>{post.area} m²</Text>
        </View>

        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color="#8E8E93" />
          <Text style={styles.location} numberOfLines={1}>
            {post.location || 'Chưa có địa chỉ'}
          </Text>
        </View>

        <View style={styles.amenitiesContainer}>
          {post.options && Array.isArray(post.options) && post.options.slice(0, 3).map((option, index) => (
            <Text key={`${post._id}-option-${index}`} style={styles.amenity}>
              {typeof option === 'string' ? option : (option.label || option.title || option.name || `Tùy chọn ${index + 1}`)}
            </Text>
          ))}
          {post.options && Array.isArray(post.options) && post.options.length > 3 && (
            <Text key={`${post._id}-more-options`} style={styles.amenity}>+{post.options.length - 3}</Text>
          )}
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEditPress}>
          <Ionicons name="create-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleRenewPress}>
          <Ionicons name="refresh" size={20} color="#34C759" />
          <Text style={[styles.actionText, { color: '#34C759' }]}>Gia hạn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDeletePress}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imageErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 6,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF2D55',
  },
  area: {
    fontSize: 14,
    color: '#8E8E93',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 6,
    flex: 1,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenity: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    color: '#636366',
    marginRight: 6,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
  },
});

export default MyRoomCard;