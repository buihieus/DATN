import { ScrollView, View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';
import SearchBar from '../../components/SearchBar';
import RoomCard from '../../components/RoomCard';
import CategoryItem from '../../components/CategoryItem';
import FilterModal from '../../components/FilterModal';
import ChatBot from '../../components/ChatBot';
import { categories, popularLocations } from '../../constants/homeData';
import { Ionicons } from '@expo/vector-icons';
import { postService, Post } from '../../services/roomService';
import { toggleFavorite as toggleFavoriteService } from '../../services/favoriteService';

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // State quản lý tất cả filter cùng lúc như web version
  const [activeFilters, setActiveFilters] = useState({
    category: null as string | null,
    province: null as string | null,
    ward: null as string | null,
    minPrice: null as number | null,
    maxPrice: null as number | null,
    minArea: null as number | null,
    maxArea: null as number | null,
    amenities: [] as string[],
  });
  const [showChatBot, setShowChatBot] = useState<boolean>(false);

  // Use effect to handle redirection when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return; // Don't execute the rest if not authenticated
    }

    // Load new posts on initial mount
    loadFeaturedRooms();

    // Load all posts
    const fetchAllPosts = async () => {
      const allPostsData = await loadAllPosts();
      setAllPosts(allPostsData);
    };

    fetchAllPosts();
  }, [isAuthenticated]);

  // Don't render anything if not authenticated, useEffect will handle navigation
  if (!isAuthenticated) {
    return null;
  }

  const loadFeaturedRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearching(false);

      // Get new posts (recent posts) - for featured section
      let response;
      try {
        response = await postService.getNewPosts();
      } catch (err) {
        console.log("New posts endpoint not available, getting all posts");
        response = await postService.getPosts({});
      }

      const backendPosts = response.metadata || [];

      // Get favorited post IDs from local storage
      const favoriteIds = await getFavoriteIds();

      // Update posts with favorite status
      const postsWithFavorites = Array.isArray(backendPosts) ?
        backendPosts.map(post => ({
          ...post,
          isFavorite: favoriteIds.includes(post._id)
        })) : [];

      setPosts(postsWithFavorites);
    } catch (err: any) {
      console.error('Error loading new posts:', err);
      setError('Không thể tải bài đăng mới. Vui lòng thử lại sau.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to load all available posts
  const loadAllPosts = async () => {
    try {
      const response = await postService.getPosts({});
      const favoriteIds = await getFavoriteIds();

      // Handle the new response structure with pagination
      let postsData = response.metadata;

      // Check if response has pagination structure
      if (postsData.posts && Array.isArray(postsData.posts)) {
        // Response includes pagination info
        postsData = postsData.posts;
      }

      const postsWithFavorites = postsData.map(post => ({
        ...post,
        isFavorite: favoriteIds.includes(post._id)
      }));

      return postsWithFavorites;
    } catch (err: any) {
      console.error('Error loading all posts:', err);
      return [];
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      if (query.trim() === '') {
        // Reload featured rooms when search is cleared
        await loadFeaturedRooms();
      } else {
        // Perform search
        setLoading(true);
        setIsSearching(true);
        setError(null);

        let response;
        try {
          // Use the search endpoint
          response = await postService.searchPosts(query);
        } catch (err) {
          // If search endpoint doesn't work, get posts without filters
          console.log("Search endpoint error, getting all posts");
          response = await postService.getPosts({});
        }

        const favoriteIds = await getFavoriteIds();

        const postsWithFavorites = response.metadata.map(post => ({
          ...post,
          isFavorite: favoriteIds.includes(post._id)
        }));

        setPosts(postsWithFavorites);
        setAllPosts(postsWithFavorites); // Also update all posts with search results
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Không thể tìm kiếm bài đăng. Vui lòng thử lại.');
      setPosts([]);
      setAllPosts([]); // Also clear all posts on search error
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get favorite IDs
  const getFavoriteIds = async (): Promise<string[]> => {
    try {
      const { getFavorites } = await import('../../services/favoriteService');
      return await getFavorites();
    } catch (error) {
      console.error('Error getting favorite IDs:', error);
      return [];
    }
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilters = async (newFilters: any) => {
    // Apply filters to the post list - now accumulates with existing filters
    console.log('Filters applied:', newFilters);

    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);

      // Update active filters with new values from modal
      const updatedFilters = {
        ...activeFilters,
        category: newFilters.category || activeFilters.category,
        province: newFilters.provinceCode || activeFilters.province, // Note: modal sends provinceCode
        ward: newFilters.wardCode || activeFilters.ward, // Note: modal sends wardCode
        minPrice: newFilters.minPrice !== undefined ? newFilters.minPrice : activeFilters.minPrice,
        maxPrice: newFilters.maxPrice !== undefined ? newFilters.maxPrice : activeFilters.maxPrice,
        minArea: newFilters.minArea !== undefined ? newFilters.minArea : activeFilters.minArea,
        maxArea: newFilters.maxArea !== undefined ? newFilters.maxArea : activeFilters.maxArea,
        amenities: newFilters.selectedAmenities || activeFilters.amenities,
      };

      setActiveFilters(updatedFilters);

      // Apply all filters together like web version
      await applyFilters(updatedFilters);
    } catch (error) {
      console.error('Filter error:', error);
      setError('Không thể áp dụng bộ lọc. Vui lòng thử lại.');
      setPosts([]);
    } finally {
      setLoading(false);
      setShowFilterModal(false);
    }
  };

  const toggleFavorite = async (postId: string, currentIsFavorite: boolean) => {
    try {
      // Show immediate feedback by optimistically updating UI
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? { ...post, isFavorite: !currentIsFavorite } : post
        )
      );
      setAllPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? { ...post, isFavorite: !currentIsFavorite } : post
        )
      );

      // Perform the actual toggle operation
      const newIsFavorite = await toggleFavoriteService(postId);

      // Update with the actual result from the service
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? { ...post, isFavorite: newIsFavorite } : post
        )
      );
      setAllPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? { ...post, isFavorite: newIsFavorite } : post
        )
      );

      // Show appropriate toast message based on the action that was performed
      if (currentIsFavorite && !newIsFavorite) {
        // Was favorited, now unfavorited
        import('react-native-toast-message').then(Toast => {
          Toast.default.show({
            type: 'info',
            text1: 'Thành công',
            text2: 'Đã xóa khỏi yêu thích',
          });
        });
      } else if (!currentIsFavorite && newIsFavorite) {
        // Was not favorited, now favorited
        import('react-native-toast-message').then(Toast => {
          Toast.default.show({
            type: 'success',
            text1: 'Thành công',
            text2: 'Đã thêm vào yêu thích',
          });
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert UI changes if there was an error
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? { ...post, isFavorite: currentIsFavorite } : post
        )
      );
      setAllPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? { ...post, isFavorite: currentIsFavorite } : post
        )
      );
      Alert.alert('Lỗi', 'Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.');
    }
  };

  const handlePostPress = (postId: string) => {
    router.push(`/rooms/${postId}`);
  };

  const handleCategoryPress = async (categoryId: string) => {
    // Toggle the category: if it's already selected, deselect it; otherwise, select it
    const newCategory = activeFilters.category === categoryId ? null : categoryId;
    const updatedFilters = { ...activeFilters, category: newCategory };
    setActiveFilters(updatedFilters);
    await applyFilters(updatedFilters);
  };

  const handlePriceRangePress = async (priceRange: string) => {
    // Chuyển đổi price range sang min/max price như ở web version
    let minPrice = null, maxPrice = null;
    const priceRanges: Record<string, { min: number | null; max: number | null }> = {
      'duoi-1-trieu': { min: null, max: 1000000 },
      'tu-1-2-trieu': { min: 1000000, max: 2000000 },
      'tu-2-3-trieu': { min: 2000000, max: 3000000 },
      'tu-3-5-trieu': { min: 3000000, max: 5000000 },
      'tu-5-7-trieu': { min: 5000000, max: 7000000 },
      'tu-7-10-trieu': { min: 7000000, max: 10000000 },
      'tu-10-15-trieu': { min: 10000000, max: 15000000 },
      'tren-15-trieu': { min: 15000000, max: null },
    };

    if (priceRanges[priceRange]) {
      const range = priceRanges[priceRange];
      minPrice = range.min;
      maxPrice = range.max;
    }

    const updatedFilters = { ...activeFilters, minPrice, maxPrice };
    setActiveFilters(updatedFilters);
    await applyFilters(updatedFilters);
  };

  const handleAreaRangePress = async (areaRange: string) => {
    // Chuyển đổi area range sang min/max area như ở web version
    let minArea = null, maxArea = null;
    const areaRanges: Record<string, { min: number | null; max: number | null }> = {
      'duoi-20': { min: null, max: 20 },
      'tu-20-30': { min: 20, max: 30 },
      'tu-30-50': { min: 30, max: 50 },
      'tu-50-70': { min: 50, max: 70 },
      'tu-70-90': { min: 70, max: 90 },
      'tren-90': { min: 90, max: null },
    };

    if (areaRanges[areaRange]) {
      const range = areaRanges[areaRange];
      minArea = range.min;
      maxArea = range.max;
    }

    const updatedFilters = { ...activeFilters, minArea, maxArea };
    setActiveFilters(updatedFilters);
    await applyFilters(updatedFilters);
  };

  // Hàm áp dụng tất cả các filter cùng lúc như web version
  const applyFilters = async (filters: any) => {
    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);

      // Chuyển đổi các filter sang đúng format cho backend như ở web version
      const backendFilters: any = {};

      if (filters.category) backendFilters.category = filters.category;
      if (filters.province) backendFilters.cityCode = filters.province;
      if (filters.ward) backendFilters.wardCode = filters.ward;
      // Gửi cả minPrice/maxPrice để hàm getPosts nhận diện đúng là filter nâng cao
      if (filters.minPrice !== null && filters.minPrice !== undefined) {
        backendFilters.minPrice = filters.minPrice;
        backendFilters.gia_tu = filters.minPrice; // Giữ cả 2 format để tương thích
      }
      if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
        backendFilters.maxPrice = filters.maxPrice;
        backendFilters.gia_den = filters.maxPrice; // Giữ cả 2 format để tương thích
      }
      if (filters.minArea !== null && filters.minArea !== undefined) {
        backendFilters.minArea = filters.minArea;
        backendFilters.dien_tich_tu = filters.minArea; // Giữ cả 2 format để tương thích
      }
      if (filters.maxArea !== null && filters.maxArea !== undefined) {
        backendFilters.maxArea = filters.maxArea;
        backendFilters.dien_tich_den = filters.maxArea; // Giữ cả 2 format để tương thích
      }
      if (filters.amenities && filters.amenities.length > 0) {
        backendFilters.selectedAmenities = filters.amenities;
      }

      console.log('Backend filters being sent:', backendFilters); // Thêm log để debug

      // Gọi API với tất cả các filter như ở web version
      const response = await postService.getPosts(backendFilters);
      const favoriteIds = await getFavoriteIds();

      let postsData = response.metadata;
      if (postsData.posts && Array.isArray(postsData.posts)) {
        postsData = postsData.posts;
      }

      console.log('Received posts from API:', postsData); // Thêm log để debug

      const postsWithFavorites = postsData.map(post => ({
        ...post,
        isFavorite: favoriteIds.includes(post._id)
      }));

      setPosts(postsWithFavorites);
      setAllPosts(postsWithFavorites);
    } catch (error) {
      console.error('Filter error:', error);
      setError('Không thể áp dụng bộ lọc. Vui lòng thử lại.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setActiveFilters({
      category: null,
      province: null,
      ward: null,
      minPrice: null,
      maxPrice: null,
      minArea: null,
      maxArea: null,
      amenities: [],
    });
    loadFeaturedRooms(); // Reload to show all featured rooms
  };

  // Helper function to get category name
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '';
    const categories: Record<string, string> = {
      'phong-tro': 'Phòng trọ',
      'nha-nguyen-can': 'Nhà nguyên căn',
      'can-ho-chung-cu': 'Căn hộ chung cư',
      'can-ho-mini': 'Căn hộ mini',
      'o-ghep': 'Ở ghép',
    };
    return categories[categoryId] || categoryId;
  };

  // Helper functions to check if price/area ranges are active
  const isPriceRangeActive = (range: string) => {
    const priceRanges: Record<string, { min: number | null; max: number | null }> = {
      'duoi-1-trieu': { min: null, max: 1000000 },
      'tu-1-2-trieu': { min: 1000000, max: 2000000 },
      'tu-2-3-trieu': { min: 2000000, max: 3000000 },
      'tu-3-5-trieu': { min: 3000000, max: 5000000 },
      'tu-5-7-trieu': { min: 5000000, max: 7000000 },
      'tu-7-10-trieu': { min: 7000000, max: 10000000 },
      'tu-10-15-trieu': { min: 10000000, max: 15000000 },
      'tren-15-trieu': { min: 15000000, max: null },
    };

    if (!priceRanges[range]) return false;

    const rangeValues = priceRanges[range];
    const currentMin = activeFilters.minPrice;
    const currentMax = activeFilters.maxPrice;

    // Check if this range matches the currently active price filter
    if (rangeValues.min === null && currentMin === null &&
        rangeValues.max === currentMax) {
      return true;
    }
    if (rangeValues.min === currentMin &&
        rangeValues.max === currentMax) {
      return true;
    }

    return false;
  };

  const isAreaRangeActive = (range: string) => {
    const areaRanges: Record<string, { min: number | null; max: number | null }> = {
      'duoi-20': { min: null, max: 20 },
      'tu-20-30': { min: 20, max: 30 },
      'tu-30-50': { min: 30, max: 50 },
      'tu-50-70': { min: 50, max: 70 },
      'tu-70-90': { min: 70, max: 90 },
      'tren-90': { min: 90, max: null },
    };

    if (!areaRanges[range]) return false;

    const rangeValues = areaRanges[range];
    const currentMin = activeFilters.minArea;
    const currentMax = activeFilters.maxArea;

    // Check if this range matches the currently active area filter
    if (rangeValues.min === null && currentMin === null &&
        rangeValues.max === currentMax) {
      return true;
    }
    if (rangeValues.min === currentMin &&
        rangeValues.max === currentMax) {
      return true;
    }

    return false;
  };

  const renderPost = ({ item }: { item: Post }) => (
    <RoomCard
      room={item}
      onPress={() => handlePostPress(item._id)}
      onFavoriteToggle={toggleFavorite}
    />
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/profile')}>
              <Ionicons name="person-circle-outline" size={40} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.greeting}>Xin chào {user?.fullName?.split(' ')[0] || 'User'}!</Text>
          </View>
          {/* <Text style={styles.title}>Tìm bài đăng lý tưởng</Text> */}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            onSearch={handleSearch}
            onFilterPress={handleFilterPress}
          />
        </View>

        {/* Active Filters Indicator - Updated to show all active filters like web version */}
        {Object.values(activeFilters).some(value =>
          (Array.isArray(value) ? value.length > 0 : value !== null)
        ) && (
          <View style={styles.activeFilters}>
            <View style={styles.activeFiltersRow}>
              <Text style={styles.activeFiltersText}>Bộ lọc: </Text>
              <View style={styles.activeFilterTags}>
                {activeFilters.category && (
                  <View style={styles.filterTag}>
                    <Text style={styles.filterTagText}>{getCategoryName(activeFilters.category)}</Text>
                  </View>
                )}
                {(activeFilters.minPrice !== null || activeFilters.maxPrice !== null) && (
                  <View style={styles.filterTag}>
                    <Text style={styles.filterTagText}>
                      Giá: {activeFilters.minPrice ? `${(activeFilters.minPrice / 1000000).toFixed(0)}tr` : '∞'} - {activeFilters.maxPrice ? `${(activeFilters.maxPrice / 1000000).toFixed(0)}tr` : '∞'}
                    </Text>
                  </View>
                )}
                {(activeFilters.minArea !== null || activeFilters.maxArea !== null) && (
                  <View style={styles.filterTag}>
                    <Text style={styles.filterTagText}>
                      Diện tích: {activeFilters.minArea !== null ? `${activeFilters.minArea}m²` : '0'} - {activeFilters.maxArea !== null ? `${activeFilters.maxArea}m²` : '∞'}
                    </Text>
                  </View>
                )}
                {activeFilters.amenities && activeFilters.amenities.length > 0 && (
                  <View style={styles.filterTag}>
                    <Text style={styles.filterTagText}>Tiện nghi: {activeFilters.amenities.length}</Text>
                  </View>
                )}
                {activeFilters.province && (
                  <View style={styles.filterTag}>
                    <Text style={styles.filterTagText}>Tỉnh: {activeFilters.province}</Text>
                  </View>
                )}
                {activeFilters.ward && (
                  <View style={styles.filterTag}>
                    <Text style={styles.filterTagText}>Phường: {activeFilters.ward}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFilters}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Categories - Updated layout to match web */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
          <View style={styles.categoryGrid}>
            {[
              { id: 'phong-tro', name: 'Phòng trọ', value: 'phong-tro' },
              { id: 'nha-nguyen-can', name: 'Nhà nguyên căn', value: 'nha-nguyen-can' },
              { id: 'can-ho-chung-cu', name: 'Căn hộ chung cư', value: 'can-ho-chung-cu' },
              { id: 'can-ho-mini', name: 'Căn hộ mini', value: 'can-ho-mini' },
            ].map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  activeFilters.category === category.value && styles.categoryItemSelected
                ]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Text style={[
                  styles.categoryText,
                  activeFilters.category === category.value && styles.categoryTextSelected
                ]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range Filter - Matches web layout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Xem theo khoảng giá</Text>
          <View style={styles.priceFilterGrid}>
            {[
              { range: 'duoi-1-trieu', label: 'Dưới 1 triệu' },
              { range: 'tu-2-3-trieu', label: 'Từ 2 - 3 triệu' },
              { range: 'tu-5-7-trieu', label: 'Từ 5 - 7 triệu' },
              { range: 'tu-10-15-trieu', label: 'Từ 10 - 15 triệu' },
              { range: 'tu-1-2-trieu', label: 'Từ 1 - 2 triệu' },
              { range: 'tu-3-5-trieu', label: 'Từ 3 - 5 triệu' },
              { range: 'tu-7-10-trieu', label: 'Từ 7 - 10 triệu' },
              { range: 'tren-15-trieu', label: 'Trên 15 triệu' },
            ].map(item => (
              <TouchableOpacity
                key={item.range}
                style={[
                  styles.priceFilterItem,
                  isPriceRangeActive(item.range) && styles.priceFilterItemSelected
                ]}
                onPress={() => handlePriceRangePress(item.range)}
              >
                <Text style={[
                  styles.priceFilterText,
                  isPriceRangeActive(item.range) && styles.priceFilterTextSelected
                ]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Area Filter - Matches web layout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Xem theo diện tích</Text>
          <View style={styles.areaFilterGrid}>
            {[
              { range: 'duoi-20', label: 'Dưới 20 m²' },
              { range: 'tu-30-50', label: 'Từ 30 - 50m²' },
              { range: 'tu-70-90', label: 'Từ 70 - 90m²' },
              { range: 'tu-20-30', label: 'Từ 20 - 30m²' },
              { range: 'tu-50-70', label: 'Từ 50 - 70m²' },
              { range: 'tren-90', label: 'Trên 90m²' },
            ].map(item => (
              <TouchableOpacity
                key={item.range}
                style={[
                  styles.areaFilterItem,
                  isAreaRangeActive(item.range) && styles.areaFilterItemSelected
                ]}
                onPress={() => handleAreaRangePress(item.range)}
              >
                <Text style={[
                  styles.areaFilterText,
                  isAreaRangeActive(item.range) && styles.areaFilterTextSelected
                ]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rooms Section */}
        <View style={styles.section}>
          {/* <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isSearching ? 'Kết quả tìm kiếm' : 'Bài đăng nổi bật'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/favorites')}>
              <Text style={styles.sectionAction}>Yêu thích</Text>
            </TouchableOpacity>
          </View> */}
          {loading ? (
            <Text>Đang tải bài đăng...</Text>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Lỗi: {error}</Text>
              <TouchableOpacity onPress={isSearching ? () => loadFeaturedRooms() : () => loadFeaturedRooms()}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* All Posts Section - Only show when not searching */}
        {!isSearching && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tất cả bài đăng</Text>
              {/* <TouchableOpacity onPress={() => router.push('/search')}>
                <Text style={styles.sectionAction}>Xem tất cả</Text>
              </TouchableOpacity> */}
            </View>
            <FlatList
              data={allPosts}
              renderItem={renderPost}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ListEmptyComponent={<Text>Không có bài đăng nào</Text>}
            />
          </View>
        )}

      </ScrollView>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
      />

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowChatBot(true)}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ChatBot Modal */}
      <ChatBot
        visible={showChatBot}
        onClose={() => setShowChatBot(false)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginLeft: -30, // To balance the icons
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  activeFilters: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  activeFiltersRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  activeFilterTags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 5,
  },
  filterTag: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  filterTagText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  clearFilters: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionAction: {
    fontSize: 14,
    color: '#007AFF',
  },
  categoriesList: {
    paddingRight: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  categoryItemSelected: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  categoryTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  priceFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priceFilterItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  priceFilterItemSelected: {
    backgroundColor: '#007AFF',
  },
  priceFilterText: {
    fontSize: 13,
    color: '#000',
  },
  priceFilterTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  areaFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  areaFilterItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  areaFilterItemSelected: {
    backgroundColor: '#007AFF',
  },
  areaFilterText: {
    fontSize: 13,
    color: '#000',
  },
  areaFilterTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  locationItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  locationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  locationCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});