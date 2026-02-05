import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchableDropdown from './SearchableDropdown';
import { postService } from '../services/roomService';

interface Amenity {
  id: string;
  name: string;
}

interface AdvancedSearchFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  initialFilters?: any;
}

const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({ 
  visible, 
  onClose, 
  onApply, 
  initialFilters = {} 
}) => {
  // Category filter
  const [category, setCategory] = useState(initialFilters.category || '');
  
  // Location filters
  const [provinces, setProvinces] = useState<{ Code: string; Name: string }[]>([]);
  const [wards, setWards] = useState<{ Code: string; Name: string }[]>([]);
  const [selectedProvince, setSelectedProvince] = useState(initialFilters.provinceCode || '');
  const [selectedWard, setSelectedWard] = useState(initialFilters.wardCode || '');
  
  // Price range filter
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || '');
  
  // Area range filter
  const [minArea, setMinArea] = useState(initialFilters.minArea || '');
  const [maxArea, setMaxArea] = useState(initialFilters.maxArea || '');
  
  // Amenities filter
  const initialAmenities: Amenity[] = [
    { id: 'co-gac', name: 'Có gác' },
    { id: 'co-may-lanh', name: 'Có máy lạnh' },
    { id: 'day-du-noi-that', name: 'Đầy đủ nội thất' },
    { id: 'khong-chung-chu', name: 'Không chung chủ' },
    { id: 'gio-giac-tu-do', name: 'Giờ giấc tự do' },
    { id: 'co-ban-cong', name: 'Có ban công' },
    { id: 'co-noi-that', name: 'Có nội thất' },
    { id: 'co-an-ninh', name: 'Có an ninh' },
    { id: 'co-thang-may', name: 'Có thang máy' },
    { id: 'co-ke-bep', name: 'Có kệ bếp' },
    { id: 'co-may-giat', name: 'Có máy giặt' },
    { id: 'co-ham-de-xe', name: 'Có hầm để xe' },
  ];
  
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialFilters.selectedAmenities || []
  );

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await postService.getLocations();
        setProvinces(response.metadata?.provinces || []);
      } catch (error) {
        console.error('Error fetching provinces:', error);
      }
    };

    loadProvinces();
  }, []);

  // Load wards when province is selected
  useEffect(() => {
    if (selectedProvince) {
      const loadWards = async () => {
        try {
          const response = await postService.getLocations(selectedProvince);
          setWards(response.metadata?.wards || []);
        } catch (error) {
          console.error('Error fetching wards:', error);
        }
      };

      loadWards();
    } else {
      setWards([]);
    }
  }, [selectedProvince]);

  const toggleAmenity = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      setSelectedAmenities(selectedAmenities.filter(id => id !== amenityId));
    } else {
      setSelectedAmenities([...selectedAmenities, amenityId]);
    }
  };

  const handleApply = () => {
    const filters = {
      category,
      provinceCode: selectedProvince,
      wardCode: selectedWard,
      minPrice: minPrice !== '' && !isNaN(parseFloat(minPrice)) ? parseFloat(minPrice) * 1000000 : undefined, // Convert from millions to VND
      maxPrice: maxPrice !== '' && !isNaN(parseFloat(maxPrice)) ? parseFloat(maxPrice) * 1000000 : undefined, // Convert from millions to VND
      minArea: minArea !== '' && !isNaN(parseFloat(minArea)) ? parseFloat(minArea) : undefined,
      maxArea: maxArea !== '' && !isNaN(parseFloat(maxArea)) ? parseFloat(maxArea) : undefined,
      selectedAmenities,
    };

    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setCategory('');
    setSelectedProvince('');
    setSelectedWard('');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setSelectedAmenities([]);
  };

  // Category options
  const categoryOptions = [
    { id: 'phong-tro', name: 'Phòng trọ' },
    { id: 'nha-nguyen-can', name: 'Nhà nguyên căn' },
    { id: 'can-ho', name: 'Căn hộ' },
    { id: 'o-ghep', name: 'Ở ghép' },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bộ lọc tìm kiếm nâng cao</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Danh mục</Text>
              <View style={styles.categoryContainer}>
                {categoryOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.categoryOption,
                      category === option.id && styles.selectedCategoryOption,
                    ]}
                    onPress={() => setCategory(option.id === category ? '' : option.id)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === option.id && styles.selectedCategoryText,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Địa điểm</Text>
              
              <SearchableDropdown
                data={provinces}
                placeholder="Tỉnh/Thành phố"
                selectedValue={selectedProvince}
                onValueChange={setSelectedProvince}
                label="Tỉnh/Thành phố"
              />
              
              <SearchableDropdown
                data={wards}
                placeholder={selectedProvince ? "Phường/Xã" : "Chọn tỉnh thành phố trước"}
                selectedValue={selectedWard}
                onValueChange={setSelectedWard}
                label="Phường/Xã"
                disabled={!selectedProvince}
              />
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Khoảng giá (VNĐ/tháng)</Text>
              <View style={styles.rangeContainer}>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeLabel}>Từ</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeLabel}>Đến</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="Không giới hạn"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Area Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Diện tích (m²)</Text>
              <View style={styles.rangeContainer}>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeLabel}>Từ</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={minArea}
                    onChangeText={setMinArea}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeLabel}>Đến</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={maxArea}
                    onChangeText={setMaxArea}
                    placeholder="Không giới hạn"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Amenities Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Tiện nghi</Text>
              <View style={styles.amenitiesContainer}>
                {initialAmenities.map((amenity) => (
                  <TouchableOpacity
                    key={amenity.id}
                    style={[
                      styles.amenityOption,
                      selectedAmenities.includes(amenity.id) && styles.selectedAmenityOption,
                    ]}
                    onPress={() => toggleAmenity(amenity.id)}
                  >
                    <Text
                      style={[
                        styles.amenityText,
                        selectedAmenities.includes(amenity.id) && styles.selectedAmenityText,
                      ]}
                    >
                      {amenity.name}
                    </Text>
                    {selectedAmenities.includes(amenity.id) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Đặt lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategoryOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  rangeInputContainer: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  rangeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 120,
  },
  selectedAmenityOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  amenityText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  selectedAmenityText: {
    color: '#fff',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AdvancedSearchFilter;