import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { keywordSearchService, KeywordSearch } from '@/services/keywordSearchService';
import { postService, Post } from '@/services/roomService';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AdvancedSearchFilter from '@/components/AdvancedSearchFilter';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<KeywordSearch[]>([]);
  const [hotSearches, setHotSearches] = useState<KeywordSearch[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Advanced search filter state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});

  // Load hot searches when the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadHotSearches();
    }, [])
  );

  const loadHotSearches = async () => {
    try {
      setIsLoadingSuggestions(true);
      const response = await keywordSearchService.getHotSearches();
      setHotSearches(response.metadata || []);
    } catch (error) {
      console.error('Error loading hot searches:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải từ khóa phổ biến',
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearchFocus = () => {
    setShowSuggestions(true);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() && Object.keys(activeFilters).length === 0) {
      setSearchResults([]);
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Get search suggestions based on the query
      if (query.trim()) {
        const suggestionResponse = await keywordSearchService.searchKeywords(query);
        setSuggestions(suggestionResponse.metadata || []);
      }

      // Perform search based on query and active filters
      let searchResponse: any[] = [];

      if (query.trim() && Object.keys(activeFilters).length > 0) {
        // If both text query and filters are present, we might need to handle differently
        // For now, we'll prioritize the text query with AI search, but this could be enhanced
        searchResponse = await postService.aiSearchPosts(query);
        // Then we could potentially filter the results by activeFilters on the client side
        // For now, we'll just use the AI search results
      } else if (Object.keys(activeFilters).length > 0) {
        // Use advanced filtering if only filters are applied
        const filteredResponse = await postService.getFilteredPosts(activeFilters);
        // Update metadata to match expected structure
        searchResponse = filteredResponse.metadata || filteredResponse;
      } else if (query.trim()) {
        // Use AI-powered search if only text query is applied
        searchResponse = await postService.aiSearchPosts(query);
      } else {
        // If no query and no filters, maybe get all posts or show an error
        searchResponse = [];
      }

      setSearchResults(searchResponse);

      // Save the search keyword to track popularity (only if there's a text query)
      if (query.trim()) {
        await keywordSearchService.saveSearchKeyword(query);
      }

      // Hide suggestions to show results
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error during search:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Tìm kiếm thất bại',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Handle text change with debounce
  const handleTextChange = (text: string) => {
    setSearchQuery(text);

    // Clear the previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (text.trim()) {
      // Set a new timer
      const timer = setTimeout(() => {
        handleSearch(text);
      }, 300);
      setDebounceTimer(timer as unknown as NodeJS.Timeout);
    } else {
      setSuggestions([]);
      setSearchResults([]);
      loadHotSearches(); // Reload hot searches when input is cleared
    }
  };

  // Handle advanced filter application
  const handleApplyAdvancedFilter = (filters: any) => {
    setActiveFilters(filters);
    // Perform search with the new filters
    handleSearch(searchQuery);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    setSearchResults([]);
    setSuggestions([]);
    loadHotSearches();
  };

  // Helper functions to get display names
  const getCategoryName = (categoryId: string) => {
    const categories: Record<string, string> = {
      'phong-tro': 'Phòng trọ',
      'nha-nguyen-can': 'Nhà nguyên căn',
      'can-ho': 'Căn hộ',
      'o-ghep': 'Ở ghép',
    };
    return categories[categoryId] || categoryId;
  };

  // For province and ward names, we would need to store them or fetch them
  // For now, we'll just return the code and can enhance later
  const getProvinceName = (provinceCode: string) => {
    // In a real implementation, we would map the code to a name
    // For now, returning the code
    return provinceCode;
  };

  const getWardName = (wardCode: string) => {
    // In a real implementation, we would map the code to a name
    // For now, returning the code
    return wardCode;
  };

  // Function to remove a specific filter
  const removeFilter = (filterType: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      switch (filterType) {
        case 'category':
          delete newFilters.category;
          break;
        case 'provinceCode':
          delete newFilters.provinceCode;
          break;
        case 'wardCode':
          delete newFilters.wardCode;
          break;
        case 'price':
          delete newFilters.minPrice;
          delete newFilters.maxPrice;
          break;
        case 'area':
          delete newFilters.minArea;
          delete newFilters.maxArea;
          break;
        case 'selectedAmenities':
          delete newFilters.selectedAmenities;
          break;
        default:
          delete newFilters[filterType];
      }
      // After removing a filter, perform a new search
      handleSearch(searchQuery);
      return newFilters;
    });
  };

  const handleSuggestionPress = (suggestion: KeywordSearch) => {
    setSearchQuery(suggestion.title);
    handleSearch(suggestion.title);
    setShowSuggestions(false);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
      setShowSuggestions(false);
    } else {
      Toast.show({
        type: 'info',
        text1: 'Thông báo',
        text2: 'Vui lòng nhập từ khóa tìm kiếm',
      });
    }
  };

  const handleSearchButtonPress = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
      setShowSuggestions(false);
    } else {
      Toast.show({
        type: 'info',
        text1: 'Thông báo',
        text2: 'Vui lòng nhập từ khóa tìm kiếm',
      });
    }
  };

  const handleResultPress = (item: any) => {
    // Navigate to the detail screen for the selected post
    router.push({
      pathname: '/post/[id]',
      params: { id: item._id },
    });
  };

  const renderSuggestion = ({ item }: { item: KeywordSearch }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons name="search-outline" size={16} color="#666" style={styles.suggestionIcon} />
      <Text style={styles.suggestionText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderHotSearch = ({ item }: { item: KeywordSearch }) => (
    <TouchableOpacity
      style={styles.hotSearchItem}
      onPress={() => {
        setSearchQuery(item.title);
        handleSearch(item.title);
      }}
    >
      <Text style={styles.hotSearchText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleResultPress(item)}>
      {/* Room images grid - similar to web version */}
      <View style={styles.imageGrid}>
        <Image
          source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.roomImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.roomInfoContainer}>
        <Text style={styles.resultTitle}>{item.title || 'N/A'}</Text>
        <View style={styles.roomMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={16} color="#007AFF" />
            <Text style={styles.resultPrice}>{item.price?.toLocaleString('vi-VN') || 'N/A'}₫/th</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="home-outline" size={16} color="#007AFF" />
            <Text style={styles.resultArea}>{item.area || 'N/A'} m²</Text>
          </View>
        </View>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#007AFF" />
          <Text style={styles.resultLocation}>{item.location || 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm phòng trọ, địa điểm..."
            value={searchQuery}
            onChangeText={handleTextChange}
            onFocus={handleSearchFocus}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.filterButton, Object.keys(activeFilters).length > 0 && styles.activeFilterButton]}
            onPress={() => setShowAdvancedFilter(true)}
          >
            <Ionicons name="options" size={20} color={Object.keys(activeFilters).length > 0 ? "#fff" : "#007AFF"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchButtonPress}>
            <Text style={styles.searchButtonText}>Tìm</Text>
          </TouchableOpacity>
        </View>

        {/* Active filters display */}
        {Object.keys(activeFilters).length > 0 && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersLabel}>Bộ lọc đang áp dụng:</Text>
            <View style={styles.activeFiltersList}>
              {activeFilters.category && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    {getCategoryName(activeFilters.category)}
                  </Text>
                  <TouchableOpacity onPress={() => removeFilter('category')}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              {activeFilters.provinceCode && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    {getProvinceName(activeFilters.provinceCode)}
                  </Text>
                  <TouchableOpacity onPress={() => removeFilter('provinceCode')}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              {activeFilters.wardCode && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    {getWardName(activeFilters.wardCode)}
                  </Text>
                  <TouchableOpacity onPress={() => removeFilter('wardCode')}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              {(activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined) && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    Giá: {activeFilters.minPrice || '0'} - {activeFilters.maxPrice || 'Không giới hạn'}
                  </Text>
                  <TouchableOpacity onPress={() => removeFilter('price')}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              {(activeFilters.minArea !== undefined || activeFilters.maxArea !== undefined) && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    Diện tích: {activeFilters.minArea || '0'} - {activeFilters.maxArea || 'Không giới hạn'}
                  </Text>
                  <TouchableOpacity onPress={() => removeFilter('area')}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              {activeFilters.selectedAmenities && activeFilters.selectedAmenities.length > 0 && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    Tiện nghi: {activeFilters.selectedAmenities.length}
                  </Text>
                  <TouchableOpacity onPress={() => removeFilter('selectedAmenities')}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersButton}>
              <Text style={styles.clearFiltersText}>Xóa tất cả</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Advanced Search Filter Modal */}
      <AdvancedSearchFilter
        visible={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        onApply={handleApplyAdvancedFilter}
        initialFilters={activeFilters}
      />

      <ScrollView style={styles.content}>
        {showSuggestions && (
          <>
            {searchQuery ? (
              // Show search suggestions when user is typing
              <View style={styles.suggestionsContainer}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
                  </View>
                ) : suggestions.length > 0 ? (
                  <FlatList
                    data={suggestions}
                    renderItem={renderSuggestion}
                    keyExtractor={(item) => item._id}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Không tìm thấy kết quả phù hợp</Text>
                  </View>
                )}
              </View>
            ) : (
              // Show hot searches when no query is entered
              <View style={styles.hotSearchesContainer}>
                <Text style={styles.sectionTitle}>Từ khóa phổ biến</Text>
                {isLoadingSuggestions ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Đang tải từ khóa phổ biến...</Text>
                  </View>
                ) : hotSearches.length > 0 ? (
                  <FlatList
                    data={hotSearches}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={renderHotSearch}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.hotSearchesList}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Chưa có từ khóa phổ biến</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && !showSuggestions && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Tìm thấy {searchResults.length} kết quả cho "{searchQuery}"</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải kết quả...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item._id || Math.random().toString()}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginLeft: 5,
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  searchButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    marginLeft: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  activeFiltersLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 12,
    marginRight: 5,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    padding: 5,
  },
  clearFiltersText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 16,
    flex: 1,
  },
  hotSearchesContainer: {
    paddingHorizontal: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  hotSearchesList: {
    paddingBottom: 10,
  },
  hotSearchItem: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  hotSearchText: {
    fontSize: 14,
  },
  resultsContainer: {
    paddingHorizontal: 15,
    marginTop: 10,
  },
  resultItem: {
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  imageGrid: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  roomInfoContainer: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  roomMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  resultPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  resultArea: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultLocation: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});