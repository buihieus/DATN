import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadService } from '../../services/uploadService';
import { useAuthStore } from '../../store/useUserStore';
import { API_BASE_URL } from '../../services/apiConfig';

// Helper function to fix avatar URLs that point to localhost
const fixAvatarUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // If it's already a local file URI, return as is
  if (url.startsWith('file://') || url.startsWith('content://')) {
    return url;
  }
  
  // Replace localhost or 127.0.0.1 with the actual API base URL
  return url.replace(/^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/, API_BASE_URL);
};

export default function EditProfileScreen() {
  const { user, isAuthenticated, updateProfile, getUserData } = useAuthStore();
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Avatar state - use ref to prevent re-renders from resetting it
  const avatarUriRef = React.useRef<string | null>(null);
  const originalAvatarRef = React.useRef<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [hasAvatarChanged, setHasAvatarChanged] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data from user store (only once on mount)
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      
      // Fix and set avatar URL
      const fixedAvatar = fixAvatarUrl(user.avatar || null);
      avatarUriRef.current = fixedAvatar;
      originalAvatarRef.current = fixedAvatar;
      setAvatarUri(fixedAvatar);
      setHasAvatarChanged(false);
      
      console.log('EditProfile: Initialized with avatar:', fixedAvatar);
    }
    // Only run once on mount, not when user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const pickImage = () => {
    console.log('PickImage: Starting...');
    
    ImagePicker.requestMediaLibraryPermissionsAsync()
      .then((permissionResult) => {
        console.log('PickImage: Permission result:', permissionResult.granted);
        
        if (!permissionResult.granted) {
          console.log('PickImage: Permission denied');
          Alert.alert('Quyền truy cập bị từ chối', 'Bạn cần cấp quyền truy cập thư viện ảnh để chọn ảnh đại diện');
          return;
        }

        console.log('PickImage: Launching image picker...');
        
        return ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      })
      .then((result) => {
        console.log('PickImage: Got result:', {
          canceled: result.canceled,
          assetsCount: result.assets?.length,
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const selectedUri = result.assets[0].uri;
          console.log('=== PICK IMAGE ===');
          console.log('Selected URI:', selectedUri);
          avatarUriRef.current = selectedUri;
          setAvatarUri(selectedUri);
          setHasAvatarChanged(true);
          console.log('Avatar ref updated:', avatarUriRef.current);
          console.log('Has avatar changed:', true);
          console.log('===================');
        } else {
          console.log('PickImage: Canceled or no assets');
        }
      })
      .catch((error) => {
        console.error('PickImage: Error -', error?.message || error);
        Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
      });
  };

  const takePhoto = () => {
    console.log('TakePhoto: Starting...');
    
    ImagePicker.requestCameraPermissionsAsync()
      .then((permissionResult) => {
        console.log('TakePhoto: Permission result:', permissionResult.granted);
        
        if (!permissionResult.granted) {
          console.log('TakePhoto: Permission denied');
          Alert.alert('Quyền truy cập bị từ chối', 'Bạn cần cấp quyền truy cập camera để chụp ảnh');
          return;
        }

        console.log('TakePhoto: Launching camera...');
        
        return ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      })
      .then((result) => {
        console.log('TakePhoto: Got result:', {
          canceled: result.canceled,
          assetsCount: result.assets?.length,
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const capturedUri = result.assets[0].uri;
          console.log('=== TAKE PHOTO ===');
          console.log('Captured URI:', capturedUri);
          avatarUriRef.current = capturedUri;
          setAvatarUri(capturedUri);
          setHasAvatarChanged(true);
          console.log('Avatar ref updated:', avatarUriRef.current);
          console.log('==================');
        } else {
          console.log('TakePhoto: Canceled or no assets');
        }
      })
      .catch((error) => {
        console.error('TakePhoto: Error -', error?.message || error);
        Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      });
  };

  const showAvatarOptions = () => {
    Alert.alert(
      'Chọn ảnh đại diện',
      'Bạn muốn chọn ảnh từ thư viện hay chụp ảnh mới?',
      [
        {
          text: 'Chụp ảnh',
          onPress: takePhoto,
        },
        {
          text: 'Chọn từ thư viện',
          onPress: pickImage,
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }

    setIsLoading(true);

    try {
      let finalAvatarUri = originalAvatarRef.current;

      console.log('=== HANDLE SAVE ===');
      console.log('Current avatarUri state:', avatarUri);
      console.log('Current avatarUri ref:', avatarUriRef.current);
      console.log('Original avatar ref:', originalAvatarRef.current);
      console.log('Has avatar changed:', hasAvatarChanged);

      // If avatar was changed, upload the new image
      if (hasAvatarChanged && avatarUriRef.current) {
        console.log('Avatar changed, uploading new image...');
        
        // Check if it's a local file that needs uploading
        const isLocalFile = avatarUriRef.current.startsWith('file://') || avatarUriRef.current.startsWith('content://');
        console.log('Is local file:', isLocalFile);
        
        if (isLocalFile) {
          try {
            console.log('Starting uploadAvatar with URI:', avatarUriRef.current);
            const uploadResponse = await uploadService.uploadAvatar(avatarUriRef.current);
            console.log('Upload response received:', uploadResponse);
            
            if (uploadResponse && uploadResponse.image) {
              finalAvatarUri = uploadResponse.image;
              console.log('Uploaded avatar URL:', finalAvatarUri);
            } else {
              console.error('Upload response missing image property');
              throw new Error('Upload response did not contain image URL');
            }
          } catch (uploadError: any) {
            console.error('Upload error details:', {
              message: uploadError.message,
              stack: uploadError.stack,
            });
            Alert.alert('Lỗi', `Không thể tải ảnh lên: ${uploadError.message || 'Vui lòng thử lại'}`);
            setIsLoading(false);
            return;
          }
        } else {
          // Avatar is already a URL (could be from previous upload or placeholder)
          finalAvatarUri = avatarUriRef.current;
          console.log('Using existing URL:', finalAvatarUri);
        }
      }

      console.log('Final avatar URL to save:', finalAvatarUri);

      // Update profile on server
      console.log('Calling updateProfile with:', { fullName, phone, address, avatar: finalAvatarUri });
      await updateProfile({
        fullName,
        phone,
        address,
        avatar: finalAvatarUri
      });
      console.log('Profile updated successfully');

      // Refresh user data from server to get latest data
      console.log('Refreshing user data...');
      await getUserData();
      console.log('User data refreshed');

      console.log('=====================');

      Alert.alert('Thành công', 'Cập nhật thông tin thành công!', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);
    } catch (error: any) {
      console.error('Update profile error:', {
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('Lỗi', error?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={showAvatarOptions}
            activeOpacity={0.7}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
                cachePolicy="memory"
                onError={(error) => {
                  console.error('Avatar load error:', error);
                  console.log('Failed avatar URL:', avatarUri);
                }}
                onLoad={() => {
                  console.log('Avatar loaded successfully:', avatarUri);
                }}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#8E8E93" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={22} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>Chạm để thay đổi ảnh đại diện</Text>
        </View>

        {/* Full Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Họ tên</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ tên của bạn"
            placeholderTextColor="#999"
          />
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />
        </View>

        {/* Address Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ của bạn"
            placeholderTextColor="#999"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
    backgroundColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarLabel: {
    marginTop: 15,
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
