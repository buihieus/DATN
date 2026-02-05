import { Image } from 'expo-image';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  // Log user data for debugging
  useEffect(() => {
    console.log('Profile Screen - Current user data:', user);
  }, [user]);

  // Don't render the profile screen if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation is handled by the index screen's useEffect
            } catch (error) {
              Alert.alert('Lỗi', 'Đăng xuất thất bại. Vui lòng thử lại.');
            }
          }
        }
      ]
    );
  };

  const handleRecharge = () => {
    router.push('/recharge');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: user?.avatar && user.avatar.trim() !== '' ? user.avatar : 'https://placehold.co/80x80?text=AV' }}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="none"
          onError={(error) => console.log('Avatar image error:', error)}
          onLoad={(success) => console.log('Avatar image loaded successfully:', success)}
        />
        <Text style={styles.name}>{profileData.fullName || 'Người dùng'}</Text>
        <Text style={styles.email}>{profileData.email}</Text>

        {/* Balance Display */}
        {/* <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Số dư tài khoản</Text>
          <Text style={styles.balanceValue}>{user?.balance ? user.balance.toLocaleString('vi-VN') : '0'}₫</Text>
          <TouchableOpacity style={styles.rechargeButton} onPress={handleRecharge}>
            <Text style={styles.rechargeButtonText}>Nạp tiền</Text>
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Profile Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Hô và tên</Text>
          <Text style={styles.infoValue}>{profileData.fullName || 'Chưa cập nhật'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profileData.email || 'Chưa cập nhật'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Số điện thoại</Text>
          <Text style={styles.infoValue}>{profileData.phone || 'Chưa cập nhật'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Địa chỉ</Text>
          <Text style={styles.infoValue}>{profileData.address || 'Chưa cập nhật'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push('/profile/edit')}
        >
          <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/favorites')}>
          <Text style={styles.settingText}>Mục yêu thích</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/rooms/my-rooms')}>
          <Text style={styles.settingText}>Phòng đã đăng</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/chat')}>
          <Text style={styles.settingText}>Tin nhắn</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/rooms/create')}>
          <Text style={styles.settingText}>Đăng tin mới</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        
        {/* Balance Display below Account Settings */}
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceInfoLabel}>Số dư</Text>
          <View style={styles.balanceInfoRow}>
            <Text style={styles.balanceInfoValue}>{user?.balance ? user.balance.toLocaleString('vi-VN') : '0'}₫</Text>
            <TouchableOpacity style={styles.rechargeButtonSmall} onPress={handleRecharge}>
              <Text style={styles.rechargeButtonTextSmall}>Nạp tiền</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* App Settings */}
      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt ứng dụng</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Thông báo</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Bảo mật</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Ngôn ngữ</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Trợ giúp</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View> */}

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  balanceContainer: {
    marginTop: 15,
    alignItems: 'center',
    width: '100%',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  rechargeButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rechargeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 8,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1.5,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  chevron: {
    fontSize: 20,
    color: '#ccc',
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    marginHorizontal: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceInfo: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  balanceInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  balanceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rechargeButtonSmall: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rechargeButtonTextSmall: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});