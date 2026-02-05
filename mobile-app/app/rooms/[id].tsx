import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Linking, ActivityIndicator, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { postService, Post } from '../../services/roomService';
import { useAuthStore } from '../../store/useUserStore';
import { Ionicons } from '@expo/vector-icons';
import { toggleFavorite as toggleFavoriteService, addFavorite, removeFavorite } from '../../services/favoriteService';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../../services/apiConfig';
import { WebView } from 'react-native-webview';
import MapWebView from '../../components/MapWebView';

// Function to decode HTML entities
const decodeHTMLEntities = (text: string): string => {
  if (!text) return '';

  // First apply Vietnamese character replacements
  let decoded = text
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ograve;/g, 'ò')
    .replace(/&oacute;/g, 'ó')
    .replace(/&otilde;/g, 'õ')
    .replace(/&ouml;/g, 'ö')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&atilde;/g, 'ã')
    .replace(/&auml;/g, 'ä')
    .replace(/&acirc;/g, 'â')
    .replace(/&agrave;/g, 'à')
    .replace(/&iacute;/g, 'í')
    .replace(/&igrave;/g, 'ì')
    .replace(/&icirc;/g, 'î')
    .replace(/&iuml;/g, 'ï')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&ucirc;/g, 'û')
    .replace(/&uuml;/g, 'ü')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&szlig;/g, 'ß')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Acirc;/g, 'Â')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Aring;/g, 'Å')
    .replace(/&AElig;/g, 'Æ')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&Euml;/g, 'Ë')
    .replace(/&Igrave;/g, 'Ì')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Icirc;/g, 'Î')
    .replace(/&Iuml;/g, 'Ï')
    .replace(/&ETH;/g, 'Ð')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&Ograve;/g, 'Ò')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Oslash;/g, 'Ø')
    .replace(/&Ugrave;/g, 'Ù')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ucirc;/g, 'Û')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&Yacute;/g, 'Ý')
    .replace(/&THORN;/g, 'Þ')
    .replace(/&szlig;/g, 'ß')
    .replace(/&agrave;/g, 'à')
    .replace(/&aacute;/g, 'á')
    .replace(/&acirc;/g, 'â')
    .replace(/&atilde;/g, 'ã')
    .replace(/&auml;/g, 'ä')
    .replace(/&aring;/g, 'å')
    .replace(/&aelig;/g, 'æ')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&euml;/g, 'ë')
    .replace(/&igrave;/g, 'ì')
    .replace(/&iacute;/g, 'í')
    .replace(/&icirc;/g, 'î')
    .replace(/&iuml;/g, 'ï')
    .replace(/&eth;/g, 'ð')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&ograve;/g, 'ò')
    .replace(/&oacute;/g, 'ó')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&otilde;/g, 'õ')
    .replace(/&ouml;/g, 'ö')
    .replace(/&oslash;/g, 'ø')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ucirc;/g, 'û')
    .replace(/&uuml;/g, 'ü')
    .replace(/&yacute;/g, 'ý')
    .replace(/&thorn;/g, 'þ')
    .replace(/&yuml;/g, 'ÿ')
    .replace(/&uuml;/g, 'ü')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&iuml;/g, 'ï')
    .replace(/&Iuml;/g, 'Ï')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  return decoded;
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [postOwner, setPostOwner] = useState<any>(null); // Store the user information
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMap] = useState(true); // Always show map by default

  // Function to process image URLs and replace localhost references
  const processImageUrl = (url: string | undefined): string => {
    if (!url) return 'https://placehold.co/300x200';

    // Check if it's a Base64 string (starts with data:image/)
    if (url && url.startsWith('data:image/')) {
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

  // Function to process all image URLs in a post
  const processPostImages = (postData: Post): Post => {
    if (postData && postData.images) {
      return {
        ...postData,
        images: postData.images.map(img => processImageUrl(img))
      };
    }
    return postData;
  };

  useEffect(() => {
    if (id) {
      loadPostDetails();
      setCurrentImageIndex(0); // Reset to first image when post changes
    }
  }, [id]);

  const loadPostDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch post details by ID
      const response = await postService.getPostById(id as string);

      // The backend returns a complex object with multiple properties
      // Check if the response has the structure we expect from the backend
      if (response.metadata && response.metadata.data) {
        // Handle the backend format where metadata contains { data, dataUser, userFavourite }
        let postData = response.metadata.data;
        const userData = response.metadata.dataUser;

        // Process image URLs to replace localhost references
        postData = processPostImages(postData);

        setPost(postData);
        setPostOwner(userData);
      } else {
        // Handle the case where response.metadata is the post itself
        let postData = response.metadata;

        // Process image URLs to replace localhost references
        postData = processPostImages(postData);

        setPost(postData);
      }

      // Check if this post is in favorites
      if (isAuthenticated) {
        const favoriteIds = await getFavoriteIds();
        setIsFavorite(favoriteIds.includes(id as string));
      }
    } catch (err: any) {
      console.error('Error loading post details:', err);
      setError('Không thể tải chi tiết bài đăng. Vui lòng thử lại.');
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải chi tiết bài đăng',
      });
    } finally {
      setLoading(false);
    }
  };


  const getFavoriteIds = async (): Promise<string[]> => {
    try {
      const { getFavorites } = await import('../../services/favoriteService');
      return await getFavorites();
    } catch (error) {
      console.error('Error getting favorite IDs:', error);
      return [];
    }
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để thêm vào yêu thích');
      router.push('/auth/login');
      return;
    }

    if (!post) return;

    try {
      const newIsFavorite = await toggleFavoriteService(post._id);
      setIsFavorite(newIsFavorite);

      if (newIsFavorite) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Đã thêm vào yêu thích',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Thành công',
          text2: 'Đã xóa khỏi yêu thích',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật danh sách yêu thích');
    }
  };

  const handleCall = () => {
    if (!post?.phone) {
      Alert.alert('Thông báo', 'Không có số điện thoại để gọi');
      return;
    }

    Alert.alert(
      'Gọi điện',
      `Bạn muốn gọi đến ${post.phone}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gọi',
          onPress: () => {
            Linking.openURL(`tel:${post.phone}`);
          }
        }
      ]
    );
  };

  const handleSendMessage = () => {
    if (!isAuthenticated) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để gửi tin nhắn');
      router.push('/auth/login');
      return;
    }

    // Navigate to chat screen with post owner's ID
    if (post && post.userId) {
      router.push(`/chat/${post.userId}`);
    } else {
      Alert.alert('Lỗi', 'Không thể xác định người nhận tin nhắn');
    }
  };

  // Hàm render mô tả với các dòng riêng biệt để xử lý ngắt dòng
  const renderDescription = (description: string) => {
    // Thay thế các ký tự ngắt dòng HTML thành ký tự ngắt dòng thông thường
    const processedDescription = description
      .replace(/<br\s*\/?>/gi, '\n')  // Thay thế <br> và <br/> thành \n
      .replace(/<p[^>]*>/gi, '\n')    // Thay thế mở thẻ <p> thành \n
      .replace(/<\/p>/gi, '\n');      // Thay thế đóng thẻ </p> thành \n

    // Tách mô tả thành các đoạn dựa trên các dấu ngắt dòng
    const paragraphs = processedDescription.split(/\n+/);
    return (
      <View>
        {paragraphs
          .filter(paragraph => paragraph.trim() !== '') // Lọc các đoạn rỗng
          .map((paragraph, index) => (
            <View key={index} style={styles.paragraphContainer}>
              <Text style={styles.descriptionText} selectable={true}>
                {paragraph.trim()}
              </Text>
            </View>
          ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Đang tải...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadPostDetails()}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy bài đăng</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Image Gallery */}
      <View style={styles.imageGalleryContainer}>
        {/* Main Image */}
        <View style={styles.mainImageContainer}>
          {post.images && post.images.length > 0 ? (
            <Image
              source={{ uri: post.images[currentImageIndex] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>Không có ảnh</Text>
            </View>
          )}

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoriteToggle}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#FF3B30" : "white"}
            />
          </TouchableOpacity>
        </View>

        {/* Thumbnail Images */}
        {post.images && post.images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailContainer}
            contentContainerStyle={styles.thumbnailContent}
          >
            {post.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.thumbnailImageWrapper,
                  index === currentImageIndex && styles.activeThumbnail
                ]}
                onPress={() => setCurrentImageIndex(index)}
              >
                <Image
                  source={{ uri: image }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Post Title and Price */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>{post.title}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{post.price?.toLocaleString('vi-VN')} ₫/tháng</Text>
          <Text style={styles.area}>{post.area} m²</Text>
        </View>
      </View>

      {/* Category and Type */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Danh mục:</Text>
          <Text style={styles.value}>{post.category || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Loại tin:</Text>
          <Text style={styles.value}>{post.typeNews === 'vip' ? 'Tin VIP' : 'Tin thường'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Ngày hết hạn:</Text>
          <Text style={styles.value}>{post.endDate ? new Date(post.endDate).toLocaleDateString('vi-VN') : 'N/A'}</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.descriptionSection}>
        <Text style={styles.sectionTitle}>Mô tả</Text>
        <View style={styles.descriptionContainer}>
          {renderDescription(decodeHTMLEntities(post.description || 'Chưa có mô tả'))}
        </View>
      </View>

      {/* Options/Amenities */}
      {post.options && post.options.length > 0 && (
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Tiện nghi</Text>
          <View style={styles.optionsContainer}>
            {post.options.map((option, index) => (
              <View key={index} style={styles.optionItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.optionText}>
                  {typeof option === 'string' ? option : (option.label || option.title || option.name || `Tùy chọn ${index + 1}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Location */}
      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>Địa điểm</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={16} color="#007AFF" />
          <WebView
            originWhitelist={['*']}
            source={{
              html: `<div style="color: #333; font-size: 14px; flex: 1; padding-bottom: 4px; display: flex; align-items: center; height: 100%;">${
                (post.location && decodeHTMLEntities(post.location).trim() !== '')
                ? decodeHTMLEntities(post.location)
                : (post.address && post.address.fullAddress)
                  ? decodeHTMLEntities(post.address.fullAddress)
                  : 'Chưa có địa chỉ'
              }</div>`
            }}
            style={styles.locationWebView}
            scrollEnabled={false}
            scalesPageToFit={false}
            domStorageEnabled={false}
            javaScriptEnabled={false}
          />
        </View>
      </View>

      {/* Map - always visible */}
      <View style={styles.mapContainer}>
        <Text style={styles.sectionTitle}>Vị trí trên bản đồ</Text>
        <View style={styles.mapViewContainer}>
          <MapWebView
            address={post.location || (post.address && post.address.fullAddress) || 'Vietnam'}
          />
        </View>
      </View>

      {/* Owner Information */}
      <View style={styles.ownerSection}>
        <Text style={styles.sectionTitle}>Thông tin người đăng</Text>
        <View style={styles.ownerInfo}>
          <View style={styles.ownerRow}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.ownerText}>{postOwner?.username || post.username}</Text>
          </View>
          {postOwner?.phone && (
            <View style={styles.ownerRow}>
              <Ionicons name="call" size={16} color="#666" />
              <Text style={styles.ownerText}>{postOwner.phone}</Text>
            </View>
          )}
          {postOwner?.lengthPost && (
            <View style={styles.ownerRow}>
              <Ionicons name="document-text" size={16} color="#666" />
              <Text style={styles.ownerText}>{postOwner.lengthPost} bài đăng</Text>
            </View>
          )}
          {postOwner?.status && (
            <View style={styles.ownerRow}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={[styles.ownerText, postOwner.status === 'Đang hoạt động' ? styles.onlineStatus : styles.offlineStatus]}>
                {postOwner.status}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Contact Actions */}
      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Liên hệ</Text>
        <View style={styles.contactInfo}>
          <Text style={styles.contactText}>Gọi hoặc nhắn tin trực tiếp với người đăng</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons name="call" size={24} color="white" />
          <Text style={styles.callButtonText}>Gọi điện</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton} onPress={handleSendMessage}>
          <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
          <Text style={styles.messageButtonText}>Nhắn tin</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imageGalleryContainer: {
    backgroundColor: 'white',
  },
  mainImageContainer: {
    position: 'relative',
    height: 300,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailContainer: {
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  thumbnailContent: {
    paddingHorizontal: 16,
  },
  thumbnailImageWrapper: {
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#007AFF',
  },
  thumbnailImage: {
    width: 80,
    height: 80,
  },
  headerSection: {
    backgroundColor: 'white',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  area: {
    fontSize: 16,
    color: '#8E8E93',
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  descriptionSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  descriptionContainer: {
    // Không đặt flex: 1 để cho phép mở rộng theo nội dung
  },
  descriptionWebView: {
    flex: 1,
    minHeight: 200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    textAlign: 'left',
  },
  paragraphContainer: {
    marginBottom: 8, // Khoảng cách giữa các đoạn
  },
  optionsSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 8,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 4,
  },
  locationSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24, // Ensure minimum height for proper alignment
  },
  location: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  locationWebView: {
    flex: 1,
    marginLeft: 8,
    minHeight: 20,
    justifyContent: 'center', // Ensure content is vertically centered
  },
  mapContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapViewContainer: {
    flex: 1,
    minHeight: 300,
    maxHeight: 600,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  ownerSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  ownerInfo: {
    marginTop: 8,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ownerText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  onlineStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  offlineStatus: {
    color: '#999',
  },
  contactSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    marginTop: 8,
    marginBottom: 20,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  callButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  messageButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});