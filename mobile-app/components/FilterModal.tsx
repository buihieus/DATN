import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchProvinces, fetchDistrictsByProvince } from '../services/locationService';
import SearchableDropdown from './SearchableDropdown';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);


  // State for dynamic data from database
  const [provinces, setProvinces] = useState<{ Code: string; Name: string }[]>([]);
  const [districts, setDistricts] = useState<{ Code: string; Name: string }[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);

  // Sample data for dropdowns
  const categories = [
    { id: 'all', name: 'Tất cả danh mục' },
    { id: 'phong-tro', name: 'Phòng trọ' },
    { id: 'nha-nguyen-can', name: 'Nhà nguyên căn' },
    { id: 'can-ho-chung-cu', name: 'Căn hộ chung cư' },
    { id: 'can-ho-mini', name: 'Căn hộ mini' },
    { id: 'o-ghep', name: 'Ở ghép' }, // Fixed the hyphen
  ];

  const priceRanges = [
    { id: 'all', name: 'Tất cả khoảng giá' },
    { id: 'duoi-1-trieu', name: 'Dưới 1 triệu' },
    { id: 'tu-1-2-trieu', name: 'Từ 1 - 2 triệu' },
    { id: 'tu-2-3-trieu', name: 'Từ 2 - 3 triệu' },
    { id: 'tu-3-5-trieu', name: 'Từ 3 - 5 triệu' },
    { id: 'tu-5-7-trieu', name: 'Từ 5 - 7 triệu' },
    { id: 'tu-7-10-trieu', name: 'Từ 7 - 10 triệu' },
    { id: 'tu-10-15-trieu', name: 'Từ 10 - 15 triệu' },
    { id: 'tren-15-trieu', name: 'Trên 15 triệu' },
  ];

  const areaRanges = [
    { id: 'all', name: 'Tất cả diện tích' },
    { id: 'duoi-20', name: 'Dưới 20m²' },
    { id: 'tu-20-30', name: '20 – 30m²' },
    { id: 'tu-30-50', name: '30 – 50m²' },
    { id: 'tu-50-70', name: '50 – 70m²' },
    { id: 'tu-70-90', name: '70 – 90m²' },
    { id: 'tren-90', name: 'Trên 90m²' },
  ];

  const amenities = [
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

  // Fetch provinces when component mounts
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const provinceData = await fetchProvinces();
        // Transform the data to match our expected format
        // Check if the data is valid before mapping
        const validProvinceData = Array.isArray(provinceData) ? provinceData : [];
        const transformedProvinces = [
          { Code: 'all', Name: 'Tất cả tỉnh/thành phố' },
          ...validProvinceData
        ];
        setProvinces(transformedProvinces);
      } catch (error) {
        console.error('Error loading provinces:', error);
        // Fallback to default provinces if API fails
        setProvinces([
          { Code: 'all', Name: 'Tất cả tỉnh/thành phố' },
          { Code: 'hcm', Name: 'TP. Hồ Chí Minh' },
          { Code: 'hn', Name: 'Hà Nội' },
          { Code: 'dn', Name: 'Đà Nẵng' },
          { Code: 'bd', Name: 'Bình Dương' },
        ]);
      } finally {
        setLoadingProvinces(false);
      }
    };

    if (visible) { // Only load when modal is visible
      loadProvinces();
    }
  }, [visible]);

  // Fetch districts when province is selected
  useEffect(() => {
    const loadDistricts = async () => {
      if (!selectedProvince || selectedProvince === 'all') {
        setDistricts([
          { Code: 'all', Name: 'Tất cả phường/xã' },
        ]);
        return;
      }

      try {
        setLoadingWards(true);
        const districtData = await fetchDistrictsByProvince(selectedProvince);
        // Transform the data to match our expected format
        // Check if the data is valid before mapping
        const validDistrictData = Array.isArray(districtData) ? districtData : [];
        const transformedDistricts = [
          { Code: 'all', Name: 'Tất cả phường/xã' },
          ...validDistrictData
        ];
        setDistricts(transformedDistricts);
      } catch (error) {
        console.error('Error loading districts:', error);
        // Fallback to default districts if API fails
        setDistricts([
          { Code: 'all', Name: 'Tất cả phường/xã' },
          { Code: 'q1', Name: 'Quận 1' },
          { Code: 'q2', Name: 'Quận 2' },
          { Code: 'q3', Name: 'Quận 3' },
          { Code: 'q5', Name: 'Quận 5' },
        ]);
      } finally {
        setLoadingWards(false);
      }
    };

    loadDistricts();
  }, [selectedProvince]);

  const toggleAmenity = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenityId));
    } else {
      setSelectedAmenities([...selectedAmenities, amenityId]);
    }
  };



  const handleApply = () => {
    // Convert price range to minPrice/maxPrice format for the new filtering system
    let minPrice, maxPrice;

    switch (selectedPrice) {
      case 'duoi-1-trieu':
        minPrice = undefined;
        maxPrice = 1000000;
        break;
      case 'tu-1-2-trieu':
        minPrice = 1000000;
        maxPrice = 2000000;
        break;
      case 'tu-2-3-trieu':
        minPrice = 2000000;
        maxPrice = 3000000;
        break;
      case 'tu-3-5-trieu':
        minPrice = 3000000;
        maxPrice = 5000000;
        break;
      case 'tu-5-7-trieu':
        minPrice = 5000000;
        maxPrice = 7000000;
        break;
      case 'tu-7-10-trieu':
        minPrice = 7000000;
        maxPrice = 10000000;
        break;
      case 'tu-10-15-trieu':
        minPrice = 10000000;
        maxPrice = 15000000;
        break;
      case 'tren-15-trieu':
        minPrice = 15000000;
        maxPrice = undefined;
        break;
      default:
        minPrice = undefined;
        maxPrice = undefined;
    }

    // Convert area range to minArea/maxArea format
    let minArea, maxArea;

    switch (selectedArea) {
      case 'duoi-20':
        minArea = undefined;
        maxArea = 20;
        break;
      case 'tu-20-30':
        minArea = 20;
        maxArea = 30;
        break;
      case 'tu-30-50':
        minArea = 30;
        maxArea = 50;
        break;
      case 'tu-50-70':
        minArea = 50;
        maxArea = 70;
        break;
      case 'tu-70-90':
        minArea = 70;
        maxArea = 90;
        break;
      case 'tren-90':
        minArea = 90;
        maxArea = undefined;
        break;
      default:
        minArea = undefined;
        maxArea = undefined;
    }

    onApply({
      category: selectedCategory,
      provinceCode: selectedProvince,
      wardCode: selectedDistrict, // Map district to wardCode for the new system
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      selectedAmenities,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedCategory(null);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedPrice(null);
    setSelectedArea(null);
    setSelectedAmenities([]);
  };

  return (
    <View>
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bộ lọc tìm kiếm nâng cao</Text>
          <View style={styles.placeholder} /> {/* Placeholder for alignment */}
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section 1: Danh mục */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Danh mục</Text>
            <SearchableDropdown
              data={categories.map(cat => ({ Code: cat.id, Name: cat.name }))}
              placeholder="Tất cả danh mục"
              selectedValue={selectedCategory || ''}
              onValueChange={(value) => {
                // If "all" option is selected, set to null to represent default state
                const newCategoryValue = value === 'all' ? null : value;
                setSelectedCategory(newCategoryValue);
              }}
              label="Danh mục"
            />
          </View>

          {/* Section 2: Địa chỉ */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Địa chỉ</Text>
            <SearchableDropdown
              data={provinces}
              placeholder="Tất cả tỉnh/thành phố"
              selectedValue={selectedProvince || ''}
              onValueChange={(value) => {
                // If "all" option is selected, set to null to represent default state
                const newProvinceValue = value === 'all' ? null : value;
                setSelectedProvince(newProvinceValue);
                // Reset district when province changes
                if (newProvinceValue === null) {
                  setSelectedDistrict(null);
                }
              }}
              label="Tỉnh/Thành phố"
              disabled={loadingProvinces}
            />
            <SearchableDropdown
              data={districts}
              placeholder={selectedProvince ? "Tất cả phường/xã" : "Vui lòng chọn tỉnh thành phố trước"}
              selectedValue={selectedDistrict || ''}
              onValueChange={(value) => {
                // If "all" option is selected, set to null to represent default state
                const newDistrictValue = value === 'all' ? null : value;
                setSelectedDistrict(newDistrictValue);
              }}
              label="Phường/Xã"
              disabled={!selectedProvince || loadingWards}
            />
          </View>

          {/* Section 3: Khoảng giá */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Khoảng giá</Text>
            <SearchableDropdown
              data={priceRanges.map(range => ({ Code: range.id, Name: range.name }))}
              placeholder="Tất cả khoảng giá"
              selectedValue={selectedPrice || ''}
              onValueChange={(value) => {
                // If "all" option is selected, set to null to represent default state
                const newPriceValue = value === 'all' ? null : value;
                setSelectedPrice(newPriceValue);
              }}
              label="Khoảng giá"
            />
          </View>

          {/* Section 4: Diện tích */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Diện tích</Text>
            <SearchableDropdown
              data={areaRanges.map(range => ({ Code: range.id, Name: range.name }))}
              placeholder="Tất cả diện tích"
              selectedValue={selectedArea || ''}
              onValueChange={(value) => {
                // If "all" option is selected, set to null to represent default state
                const newAreaValue = value === 'all' ? null : value;
                setSelectedArea(newAreaValue);
              }}
              label="Diện tích"
            />
          </View>

          {/* Section 5: Tiện nghi */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tiện nghi</Text>
            <View style={styles.amenitiesContainer}>
              {Array.from({ length: Math.ceil(amenities.length / 2) }, (_, rowIndex) => {
                const startIndex = rowIndex * 2;
                const amenity1 = amenities[startIndex];
                const amenity2 = amenities[startIndex + 1];

                return (
                  <View key={rowIndex} style={styles.amenityRow}>
                    <TouchableOpacity
                      style={[styles.amenityItem, selectedAmenities.includes(amenity1.id) && styles.amenityItemSelected]}
                      onPress={() => toggleAmenity(amenity1.id)}
                    >
                      <View style={[styles.checkbox, selectedAmenities.includes(amenity1.id) && styles.checkboxSelected]}>
                        {selectedAmenities.includes(amenity1.id) && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.amenityText}>{amenity1.name}</Text>
                    </TouchableOpacity>
                    {amenity2 ? (
                      <TouchableOpacity
                        style={[styles.amenityItemRight, selectedAmenities.includes(amenity2.id) && styles.amenityItemSelected]}
                        onPress={() => toggleAmenity(amenity2.id)}
                      >
                        <View style={[styles.checkbox, selectedAmenities.includes(amenity2.id) && styles.checkboxSelected]}>
                          {selectedAmenities.includes(amenity2.id) && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                        <Text style={styles.amenityText}>{amenity2.name}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Đặt lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 40, // To account for the buttons on both sides
  },
  placeholder: {
    width: 40, // Same width as the close button area
  },
  content: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding to account for the fixed footer
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 16,
    color: '#888', // Grey when not selected
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 0.48, // Account for gap
  },
  gap: {
    width: 12, // Gap between the two dropdowns
  },
  amenitiesContainer: {
    flexDirection: 'column',
  },
  amenityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    flex: 0.48, // Take up to 48% of width to account for gap
  },
  amenityItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    flex: 0.48, // Take up to 48% of width to account for gap
    marginLeft: 8, // Add gap between items
  },
  amenityText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  amenityItemSelected: {
    // Additional styles if needed when selected
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  resetButton: {
    flex: 0.35,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#fff',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 0.65,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 24,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalOptionsContainer: {
    flex: 1,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
  },
  modalOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  clearSearchButton: {
    padding: 4,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  priceFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
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
  areaDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  areaDropdownFocused: {
    borderColor: '#007AFF', // Blue border when selected
  },
  areaDropdownText: {
    fontSize: 16,
    color: '#888', // Grey when not selected
  },
  areaDropdownTextSelected: {
    color: '#000', // Black when selected
    fontWeight: 'normal',
  },
  areaDropdownIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaClearButton: {
    marginRight: 8,
  },
  areaModalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  areaModalOptionsContainer: {
    maxHeight: 250,
  },
  areaModalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  areaModalOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  areaModalOptionText: {
    fontSize: 16,
    color: '#000',
  },
  areaModalOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default FilterModal;