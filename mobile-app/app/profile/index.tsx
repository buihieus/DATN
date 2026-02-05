import { Image } from 'expo-image';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeArea } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }

    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user, isAuthenticated]);

  // Don't render anything if not authenticated, useEffect will handle navigation
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

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  return (
    <SafeArea style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Simple Header - Only Avatar and Name */}
        <View style={styles.simpleHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={user?.avatar ? { uri: user.avatar } : require('../../assets/images/partial-react-logo.png')}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
          <Text style={styles.name}>{profileData.fullName || 'Người dùng'}</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư tài khoản</Text>
          <Text style={styles.balanceValue}>{user?.balance ? user.balance.toLocaleString('vi-VN') : '0'}₫</Text>
          <TouchableOpacity style={styles.rechargeButton} onPress={handleRecharge}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.rechargeButtonText}>Nạp tiền</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
            <TouchableOpacity onPress={handleEditProfile}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ và tên</Text>
            <Text style={styles.infoValue}>{profileData.fullName || 'Chưa cập nhật'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profileData.email || 'Chưa cập nhật'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            <Text style={styles.infoValue}>{profileData.phone || 'Chưa cập nhật'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ</Text>
            <Text style={styles.infoValue}>{profileData.address || 'Chưa cập nhật'}</Text>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Cài đặt tài khoản</Text>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/favorites')}>
            <View style={styles.settingContent}>
              <Ionicons name="heart-outline" size={20} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingText}>Mục yêu thích</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/rooms/my-rooms')}>
            <View style={styles.settingContent}>
              <Ionicons name="home-outline" size={20} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingText}>Phòng đã đăng</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/chat')}>
            <View style={styles.settingContent}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingText}>Tin nhắn</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/rooms/create')}>
            <View style={styles.settingContent}>
              <Ionicons name="add-circle-outline" size={20} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingText}>Đăng tin mới</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        {/* <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Cài đặt ứng dụng</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="notifications-outline" size={20} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingText}>Thông báo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingText}>Bảo mật</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="language-outline" size={20} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingText}>Ngôn ngữ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="help-circle-outline" size={20} color="#666" style={styles.settingIcon} />
              <Text style={styles.settingText}>Trợ giúp</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View> */}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop:30,
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingTop: 20, // Increased top padding to create more breathing space
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  simpleHeader: {
    alignItems: 'center',
    paddingVertical: 44, // Increased from 24 to move everything down
    marginBottom: 16,
  },
  avatarContainer: {
    width: 120, // Increase width
    height: 120, // Increase height
    borderRadius: 60, // Adjust border radius
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
    marginVertical: 8,
  },
  rechargeButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  rechargeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
    flex: 1.2,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});