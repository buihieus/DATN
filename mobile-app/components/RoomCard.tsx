import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toggleFavorite } from '../services/favoriteService';
import { API_BASE_URL } from '@/services/apiConfig';

// Define address interface based on the backend model
interface Address {
  provinceCode: string;
  wardCode: string;
  street: string;
  fullAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Room {
  _id: string;
  title: string;
  price: number;
  area: number; // in square meters
  location: string; // Instead of separate address, district, city
  address?: Address; // New address structure
  images: string[];
  isFavorite?: boolean;
  options?: any[]; // Instead of amenities - used for backend options
  category?: string; // Backend post category
}

interface RoomCardProps {
  room?: Room; // Optional for backward compatibility
  post?: Room; // Also accept post as prop name
  onPress: () => void;
  onFavoriteToggle: (roomId: string, isFavorite: boolean) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, post, onPress, onFavoriteToggle }) => {
  // Use whichever prop is provided, prioritizing 'room' over 'post'
  const currentRoom = room || post;
  
  const [isToggling, setIsToggling] = React.useState(false);

  const handleFavoritePress = async () => {
    // Tránh việc nhấn nhiều lần trong khi đang xử lý
    if (isToggling || !currentRoom) return;

    try {
      setIsToggling(true);

      // Cập nhật UI ngay lập tức để phản hồi người dùng
      const currentIsFavorite = !!currentRoom.isFavorite;
      const newIsFavoriteStatus = await toggleFavorite(currentRoom._id);

      // Gọi callback để cập nhật parent component
      // Trong màn hình yêu thích, truyền trạng thái hiện tại (trước khi toggle)
      // để biết rằng hành động này là bỏ yêu thích (vì trong màn hình yêu thích,
      // các bài đều đã được yêu thích)
      onFavoriteToggle(currentRoom._id, currentIsFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsToggling(false);
    }
  };

  if (!currentRoom) {
    return null; // Don't render if no room/post data is provided
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {(() => {
          // Process image URL to replace localhost references with the actual backend URL
          const processImageUrl = (url) => {
            if (!url) return 'https://placehold.co/300x200';

            // Check if it's a Base64 string (starts with data:image/)
            if (url.startsWith('data:image/')) {
              return url; // Return as-is for Base64 images
            }

            // If it's already a full URL, replace localhost/127.0.0.1 references
            if (url.startsWith('http')) {
              // Extract just the host:port part from API_BASE_URL (without protocol)
              const apiUrlNoProtocol = API_BASE_URL.replace(/^https?:\/\//, '');
              const apiProtocol = API_BASE_URL.startsWith('https') ? 'https' : 'http';

              return url
              // ? cai gi day


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

          const imageUrl = (currentRoom.images && currentRoom.images[0]) ?
            processImageUrl(currentRoom.images[0]) :
            'https://placehold.co/300x200.png';

          return (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              onError={(error) => console.log('Image load error for URI:', imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''), error.nativeEvent.error)}
              onLoad={(success) => console.log('Image loaded successfully:', imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''))}
              defaultSource={{uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='}} // Tiny transparent image
            />
          );
        })()}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          disabled={isToggling} // Vô hiệu hóa nút khi đang xử lý
        >
          <Ionicons
            name={currentRoom.isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={currentRoom.isFavorite ? "#FF3B30" : "white"}
          />
          {isToggling && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.loadingIndicator}>
                <Ionicons name="refresh" size={14} color="#fff" style={{ transform: [{ rotate: '0deg' }] }} />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{currentRoom.title}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{currentRoom.price?.toLocaleString('vi-VN')} ₫/tháng</Text>
          <Text style={styles.area}>{currentRoom.area} m²</Text>
        </View>

        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color="#8E8E93" />
          <Text style={styles.location} numberOfLines={1}>
            {currentRoom.address
              ? (currentRoom.address.fullAddress ||
                 `${currentRoom.address.street || ''}, ${currentRoom.address.wardCode || ''}, ${currentRoom.address.provinceCode || ''}`.trim().replace(/,\s*,/g, ', ').replace(/^,\s*|\s*,\s*$/g, ''))
              : (currentRoom.location || 'Địa chỉ không xác định')}
          </Text>
        </View>

        <View style={styles.amenitiesContainer}>
          {currentRoom.options && currentRoom.options.slice(0, 3).map((option, index) => (
            <Text key={`${currentRoom._id}-option-${index}`} style={styles.amenity}>
              {typeof option === 'string' ? option : (option.label || option.title || option.name || `Tùy chọn ${index + 1}`)}
            </Text>
          ))}
          {currentRoom.options && currentRoom.options.length > 3 && (
            <Text key={`${currentRoom._id}-more-options`} style={styles.amenity}>+{currentRoom.options.length - 3}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
});

export default RoomCard;