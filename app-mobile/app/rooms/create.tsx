import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Image, FlatList, BackHandler } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { postService } from '../../services/roomService';
import { uploadService } from '../../services/uploadService';
import AddressForm from '../../components/AddressForm';
import { Address } from '../../services/roomService';
import { useFocusEffect } from '@react-navigation/native';

export default function CreatePostScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const params: any = useLocalSearchParams(); // Get edit parameters from router
  const isEditMode = params.editMode === 'true';
  const postId = params.postId;

  // State initialization with proper error handling
  const [title, setTitle] = useState(params.title || '');
  const [description, setDescription] = useState(params.description || '');
  const [price, setPrice] = useState(params.price?.toString() || '');
  const [area, setArea] = useState(params.area?.toString() || '');
  const [address, setAddress] = useState<Address | null>(null); // New address object
  const [location, setLocation] = useState(params.location || ''); // Just a simple location field (for backward compatibility)
  const [suggestions, setSuggestions] = useState<string[]>([]); // Suggestions for location
  const [showSuggestions, setShowSuggestions] = useState(false); // Toggle suggestion visibility

  // Initialize images with robust parsing and URL processing
  const [images, setImages] = useState<string[]>(() => {
    if (params.images) {
      try {
        // Parse the JSON string of images
        let parsedImages = [];

        if (typeof params.images === 'string') {
          // If it's a JSON string, parse it
          parsedImages = JSON.parse(params.images);
        } else if (Array.isArray(params.images)) {
          // Already an array
          parsedImages = params.images;
        }

        // Process URLs to replace localhost with actual IP if needed
        return parsedImages.map(imageUrl => {
          if (typeof imageUrl === 'string') {
            // Check if it's a Base64 string (starts with data:image/)
            if (imageUrl.startsWith('data:image/')) {
              return imageUrl; // Return as-is for Base64 images
            }

            // Replace localhost references with the actual API_BASE_URL
            const { API_BASE_URL } = require('../../services/apiConfig');
            const apiUrlNoProtocol = API_BASE_URL.replace(/^https?:\/\//, '');
            const apiProtocol = API_BASE_URL.startsWith('https') ? 'https' : 'http';

            return imageUrl
              .replace(/^http:\/\/localhost(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`)
              .replace(/^http:\/\/127\.0\.0\.1(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`)
              .replace(/^http:\/\/10\.0\.2\.2(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`)
              .replace(/^https:\/\/localhost(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`)
              .replace(/^https:\/\/127\.0\.0\.1(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`)
              .replace(/^https:\/\/10\.0\.2\.2(:\d+)?/, `${apiProtocol}://${apiUrlNoProtocol}`);
          }
          return imageUrl;
        });
      } catch (error) {
        console.error('Error parsing images parameter:', error);
        return [];
      }
    }
    return [];
  });

  const [category, setCategory] = useState(params.category || 'phong-tro'); // Default category
  const [username, setUsername] = useState(params.username || user?.fullName || '');
  const [phone, setPhone] = useState(params.phone || user?.phone || '');

  const [amenities, setAmenities] = useState([
    { id: 'full-furniture', name: 'Đầy đủ nội thất', selected: false },
    { id: 'has-loft', name: 'Có gác', selected: false },
    { id: 'has-kitchen-shelf', name: 'Có kệ bếp', selected: false },
    { id: 'has-air-conditioner', name: 'Có máy lạnh', selected: false },
    { id: 'has-washing-machine', name: 'Có máy giặt', selected: false },
    { id: 'has-refrigerator', name: 'Có tủ lạnh', selected: false },
    { id: 'has-elevator', name: 'Có thang máy', selected: false },
    { id: 'not-sharing-owner', name: 'Không chung chủ', selected: false },
    { id: 'free-time', name: 'Giờ giấc tự do', selected: false },
    { id: 'has-security-247', name: 'Có bảo vệ 24/24', selected: false },
    { id: 'has-parking', name: 'Có hầm để xe', selected: false },
  ]);

  // Initialize selected amenities if in edit mode with proper error handling
  useEffect(() => {
    if (isEditMode && params.options) {
      try {
        const optionsParam = params.options;
        let selectedOptionNames = optionsParam;

        // If options is a string, parse it
        if (typeof optionsParam === 'string') {
          selectedOptionNames = JSON.parse(optionsParam);
        }

        setAmenities(prev =>
          prev.map(amenity => ({
            ...amenity,
            selected: Array.isArray(selectedOptionNames) && selectedOptionNames.includes(amenity.name)
          }))
        );
      } catch (error) {
        console.error('Error parsing amenities options:', error);
        // If JSON parsing fails, try to work with the raw value if it's already an array
        if (Array.isArray(params.options)) {
          setAmenities(prev =>
            prev.map(amenity => ({
              ...amenity,
              selected: params.options.includes(amenity.name)
            }))
          );
        }
      }
    }
  }, [isEditMode, params.options]);

  const [typeNews, setTypeNews] = useState<'normal' | 'vip'>('normal'); // Always 'normal' since we no longer differentiate
  const [dateEnd, setDateEnd] = useState<3 | 7 | 30>(params.dateEnd ? parseInt(params.dateEnd as string) : 3); // Default 3 days
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      // router.replace('/(auth)/login');
    }
    // Initialize form with user data if not in edit mode
    if (!isEditMode && user) {
      setUsername(user.fullName || '');
      setPhone(user.phone || '');
    }

    // Handle address initialization if in edit mode
    if (isEditMode && params.address) {
      try {
        let parsedAddress;
        if (typeof params.address === 'string') {
          parsedAddress = JSON.parse(params.address);
        } else {
          parsedAddress = params.address;
        }
        setAddress(parsedAddress);
      } catch (error) {
        console.error('Error parsing address parameter:', error);
        // If address parsing fails, try to use the location field
        if (params.location) {
          setLocation(params.location);
        }
      }
    } else if (isEditMode && params.location) {
      // For backward compatibility, if no address but location exists
      setLocation(params.location);
    }
  }, [user, isAuthenticated, isEditMode, params.address, params.location]);


  // Handle hardware back button on Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Check if there are unsaved changes before navigating away
        if (title || description || price || images.length > 0) {
          Alert.alert(
            'Xác nhận thoát',
            'Bạn có chắc muốn thoát? Dữ liệu chưa lưu sẽ bị mất.',
            [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Thoát', style: 'destructive', onPress: () => router.back() }
            ]
          );
        } else {
          router.back();
        }
        return true; // Prevent default behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription?.remove();
    }, [title, description, price, images])
  );

  // Don't render anything if not authenticated, useEffect will handle navigation
  if (!isAuthenticated) {
    return null;
  }

  const selectImages = async () => {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Quyền truy cập bị từ chối', 'Bạn cần cấp quyền truy cập thư viện ảnh để chọn ảnh');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
      selectionLimit: 10, // Limit to 10 images
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImages = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...selectedImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (id: string) => {
    setAmenities(prev =>
      prev.map(amenity =>
        amenity.id === id
          ? { ...amenity, selected: !amenity.selected }
          : amenity
      )
    );
  };

  const calculatePrice = () => {
    if (typeNews === 'normal') {
      switch (dateEnd) {
        case 3: return 10000;
        case 7: return 50000;
        case 30: return 1000000;
        default: return 0;
      }
    } else {
      switch (dateEnd) {
        case 3: return 50000;
        case 7: return 315000;
        case 30: return 1200000;
        default: return 0;
      }
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề bài đăng');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả bài đăng');
      return;
    }

    if (!price || isNaN(Number(price))) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá tiền hợp lệ');
      return;
    }

    if (!area || isNaN(Number(area))) {
      Alert.alert('Lỗi', 'Vui lòng nhập diện tích hợp lệ');
      return;
    }

    // Check for new address structure (AddressForm will handle validation internally)
    if (!address) {
      Alert.alert('Lỗi', 'Vui lòng chọn tỉnh/thành phố, phường/xã và nhập số nhà, tên đường');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một ảnh');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên người đăng');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }

    try {
      setLoading(true);

      // Prepare amenities list
      const selectedAmenities = amenities
        .filter(amenity => amenity.selected)
        .map(amenity => amenity.name);

      // Calculate end date based on duration
      const calculateEndDate = (duration: 3 | 7 | 30): string => {
        const now = new Date();
        now.setDate(now.getDate() + duration);
        return now.toISOString();
      };

      // Upload images to server first if they are local files
      let processedImages = [...images];

      // Check if any images are local files (file://) that need to be uploaded
      const localImages = images.filter(image => image.startsWith('file://'));

      if (localImages.length > 0) {
        try {
          // Upload all local images to the server
          const uploadResponse = await uploadService.uploadImages(localImages);
          const uploadedUrls = uploadResponse.images;

          // Replace local image URIs with server URLs in the images array
          processedImages = images.map(image =>
            image.startsWith('file://')
              ? uploadedUrls[localImages.indexOf(image)]
              : image
          );
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.');
          return;
        }
      }

      // Prepare post data according to backend requirements
      const postData: any = {
        title,
        description,
        price: Number(price),
        area: Number(area),
        images: processedImages, // Use the processed image URLs
        category,
        username,
        phone,
        options: selectedAmenities,
        // Note: status will be set by backend to 'inactive', not sent from frontend
        typeNews: 'normal', // Always 'normal' since we no longer differentiate
        dateEnd,  // Required: duration (3, 7, or 30)
        endDate: calculateEndDate(dateEnd), // Calculated end date
      };

      // Include address if available, otherwise use location field for backward compatibility
      if (address) {
        postData.address = address;
        // Also include location for backward compatibility
        postData.location = address.fullAddress;
      } else {
        postData.location = location;
      }

      let response;

      if (isEditMode) {
        // Update existing post
        response = await postService.updatePost(postId as string, postData);
        Toast.show({
          type: 'success',
          text1: 'Cập nhật thành công',
          text2: 'Bài đăng của bạn đã được cập nhật và đang chờ admin duyệt lại.',
        });
      } else {
        // Create new post
        response = await postService.createPost(postData);
        Toast.show({
          type: 'info', // Using info type for pending status since posts start as inactive
          text1: 'Bài đăng đã được gửi',
          text2: 'Bài đăng của bạn đã được gửi và đang chờ admin duyệt. Bài sẽ hiển thị sau khi được phê duyệt.',
        });
      }

      // Navigate back to previous screen
      router.back();
    } catch (error) {
      console.error('Error handling post:', error);
      const errorMessage = isEditMode ?
        'Có lỗi xảy ra khi cập nhật bài đăng. Vui lòng thử lại.' :
        'Có lỗi xảy ra khi tạo bài đăng. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderImageSelector = () => (
    <View style={styles.imageSelectorContainer}>
      <Text style={styles.sectionTitle}>Hình ảnh</Text>
      <TouchableOpacity
        style={styles.imageSelectorButton}
        onPress={selectImages}
      >
        <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        <Text style={styles.imageSelectorText}>Chọn ảnh</Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <ScrollView horizontal style={styles.imagePreviewContainer}>
          {images.map((imageUri, index) => (
            <View key={index} style={styles.imagePreviewWrapper}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                onError={(error) => console.log('Image load error for URI:', imageUri.substring(0, 100) + (imageUri.length > 100 ? '...' : ''), error.nativeEvent.error)}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderAmenitiesSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tiện nghi & Tùy chọn</Text>
      <View style={styles.amenitiesGrid}>
        {amenities.map((amenity) => (
          <TouchableOpacity
            key={amenity.id}
            style={[
              styles.amenityButton,
              amenity.selected && styles.selectedAmenity,
            ]}
            onPress={() => toggleAmenity(amenity.id)}
          >
            <Text
              style={[
                styles.amenityText,
                amenity.selected && styles.selectedAmenityText,
              ]}
            >
              {amenity.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPricingSection = () => (
    <View style={styles.section}>
      {/* Ẩn phần chọn loại tin vì tất cả bài đăng đều là tin thường */}
      <Text style={styles.sectionTitle}>Thời gian đăng</Text>

      <View style={styles.durationOptions}>
        {[3, 7, 30].map((days) => (
          <TouchableOpacity
            key={days}
            style={[styles.durationOption, dateEnd === days && styles.selectedDuration]}
            onPress={() => setDateEnd(days as 3 | 7 | 30)}
          >
            <Text style={[styles.durationText, dateEnd === days && styles.selectedDurationText]}>
              {days} ngày
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.pricingSummary}>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Tạm tính (VNĐ)</Text>
          <Text style={styles.pricingAmount}>{calculatePrice().toLocaleString('vi-VN')}</Text>
        </View>
      </View>

      <View style={styles.priceTable}>
        <View style={styles.priceTableHeader}>
          <Text style={styles.priceTableHeaderText}>Loại Tin</Text>
          <Text style={styles.priceTableHeaderText}>3 ngày</Text>
          <Text style={styles.priceTableHeaderText}>7 ngày</Text>
          <Text style={styles.priceTableHeaderText}>30 ngày</Text>
        </View>
        <View style={styles.priceTableRow}>
          <Text style={styles.priceTableCell}>Tin VIP</Text>
          <Text style={styles.priceTableCell}>50.000</Text>
          <Text style={styles.priceTableCell}>315.000</Text>
          <Text style={styles.priceTableCell}>1.200.000</Text>
        </View>
        <View style={styles.priceTableRow}>
          <Text style={styles.priceTableCell}>Tin thường</Text>
          <Text style={styles.priceTableCell}>10.000</Text>
          <Text style={styles.priceTableCell}>50.000</Text>
          <Text style={styles.priceTableCell}>1.000.000</Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? 'Chỉnh sửa bài đăng' : 'Đăng tin mới',
          headerShown: true,
          headerStyle: { backgroundColor: '#f5f5f5' },
          headerTintColor: '#000',
          headerLeft: () => (
            <TouchableOpacity onPress={() => {
              // Check if there are unsaved changes before navigating away
              if (title || description || price || images.length > 0) {
                Alert.alert(
                  'Xác nhận thoát',
                  'Bạn có chắc muốn thoát? Dữ liệu chưa lưu sẽ bị mất.',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Thoát', style: 'destructive', onPress: () => router.back() }
                  ]
                );
              } else {
                router.back();
              }
            }}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>

          {/* Form with scroll view only for the content area */}
          <ScrollView style={styles.formScrollView} contentContainerStyle={styles.content}>
            <View style={styles.form}>
              {/* Basic Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Tiêu đề *</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Nhập tiêu đề bài đăng"
                    maxLength={100}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Mô tả *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Nhập mô tả chi tiết về phòng trọ"
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Giá tiền (VNĐ) *</Text>
                    <TextInput
                      style={styles.input}
                      value={price}
                      onChangeText={setPrice}
                      placeholder="Nhập giá tiền"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Diện tích (m²) *</Text>
                    <TextInput
                      style={styles.input}
                      value={area}
                      onChangeText={setArea}
                      placeholder="Nhập diện tích"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Address Form - New structure */}
                <AddressForm
                  onAddressChange={setAddress}
                  initialAddress={address || undefined}
                />
              </View>

              {/* Images */}
              <View style={styles.section}>
                {renderImageSelector()}
              </View>

              {/* Category */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Danh mục</Text>
                <View style={styles.categoryOptions}>
                  {[
                    { id: 'phong-tro', name: 'Phòng trọ' },
                    { id: 'nha-nguyen-can', name: 'Nhà nguyên căn' },
                    { id: 'can-ho', name: 'Căn hộ' },
                    { id: 'o-ghep', name: 'Ở ghép' },
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryOption, category === cat.id && styles.selectedCategory]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Text style={[styles.categoryText, category === cat.id && styles.selectedCategoryText]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Amenities */}
              {renderAmenitiesSelector()}

              {/* Pricing */}
              {renderPricingSection()}

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Họ tên *</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Nhập họ tên của bạn"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Số điện thoại *</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Nhập số điện thoại"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>Đang xử lý...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>{isEditMode ? 'Cập nhật' : 'Đăng tin'}</Text>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  formScrollView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  spacer: {
    width: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginLeft: -30,
  },
  form: {
    padding: 16,
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    minHeight: 40,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  imageSelectorContainer: {
    marginBottom: 16,
  },
  imageSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    justifyContent: 'center',
  },
  imageSelectorText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    marginTop: 16,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  imagePreview: {
    width: 120,  // Tăng kích thước ảnh
    height: 120,  // Tăng kích thước ảnh
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,  // Điều chỉnh vị trí để nút không bị che khuất
    right: -10, // Điều chỉnh vị trí để nút không bị che khuất
    backgroundColor: 'white',
    borderRadius: 14, // Làm tròn nút xóa
    padding: 6, // Tăng padding cho dễ chạm
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOption: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: 'white',
  },
  postTypeContainer: {
    marginBottom: 16,
  },
  postTypeOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  postTypeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  selectedPostType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  postTypeText: {
    fontSize: 16,
    color: '#666',
  },
  selectedPostTypeText: {
    color: 'white',
  },
  durationContainer: {
    marginBottom: 16,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  selectedDuration: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  durationText: {
    fontSize: 16,
    color: '#666',
  },
  selectedDurationText: {
    color: 'white',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  selectedAmenity: {
    backgroundColor: '#007AFF',
  },
  amenityText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedAmenityText: {
    color: 'white',
  },
  pricingSummary: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  pricingAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priceTable: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  priceTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
  },
  priceTableHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  priceTableCell: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 13,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationInputContainer: {
    position: 'relative',
  },
});