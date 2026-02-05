import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Image } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadService } from '../../services/uploadService';

export default function EditProfileScreen() {
  const { user, isAuthenticated, updateProfile } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
    
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setAvatar(user.avatar || null);
    }
  }, [user, isAuthenticated]);

  // Don't render anything if not authenticated, useEffect will handle navigation
  if (!isAuthenticated) {
    return null;
  }

  const selectAvatar = async () => {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Quyền truy cập bị từ chối', 'Bạn cần cấp quyền truy cập thư viện ảnh để chọn ảnh đại diện');
      return;
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0].uri;
      setAvatar(selectedImage);
      setAvatarChanged(true);
    }
  };

  const takePhoto = async () => {
    // Request permission to access camera
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Quyền truy cập bị từ chối', 'Bạn cần cấp quyền truy cập camera để chụp ảnh');
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const capturedImage = result.assets[0].uri;
      setAvatar(capturedImage);
      setAvatarChanged(true);
    }
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
          onPress: selectAvatar,
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

    try {
      // Process avatar upload if it's a local file URI
      let processedAvatar = avatar;

      if (avatar && avatar.startsWith('file://')) {
        // Upload the avatar to the server first
        const uploadResponse = await uploadService.uploadAvatar(avatar);
        processedAvatar = uploadResponse.image; // Use the server URL instead of local URI
      }

      // Update the profile with the processed avatar URL
      await updateProfile({ fullName, phone, address, avatar: processedAvatar });
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to the profile screen to refresh the data
            router.back();
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={showAvatarOptions}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#8E8E93" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>Chạm để thay đổi ảnh đại diện</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Họ tên</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ tên của bạn"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ của bạn"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
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
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    marginTop: 15,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});