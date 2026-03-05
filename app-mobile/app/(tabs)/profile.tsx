import { Image } from 'expo-image';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { Link, router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';
import { API_BASE_URL } from '../../services/apiConfig';
import { Ionicons } from '@expo/vector-icons';

// Helper function to fix avatar URLs that point to localhost
const fixAvatarUrl = (url: string | null): string | null => {
  if (!url) return null;

  // If it's already a local file URI, return as is
  if (url.startsWith('file://') || url.startsWith('content://')) {
    return url;
  }

  // Replace localhost or 127.0.0.1 with the actual API base URL
  // This handles cases where the backend returns localhost URLs
  return url.replace(/^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/, API_BASE_URL);
};

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, getUserData } = useAuthStore();
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });

  // Refresh user data when screen comes into focus (only when coming back from edit screen)
  useFocusEffect(
    useCallback(() => {
      console.log('Profile Screen: Screen focused');
      // Don't automatically refresh - only refresh if needed
      // The edit screen will call getUserData() after successful update
    }, [])
  );

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: fixAvatarUrl(user?.avatar || null) || 'https://placehold.co/80x80?text=AV' }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory"
            onError={(error) => console.log('Avatar image error:', error)}
            onLoad={(success) => console.log('Avatar image loaded successfully:', success)}
          />
        </View>
        <Text style={styles.name}>{profileData.fullName || 'Bạn'}</Text>
        <Text style={styles.email}>{profileData.email}</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Số dư tài khoản</Text>
            <Text style={styles.balanceValue}>{user?.balance ? user.balance.toLocaleString('vi-VN') : '0'}₫</Text>
          </View>
          <TouchableOpacity style={styles.rechargeButton} onPress={handleRecharge} activeOpacity={0.7}>
            <Ionicons name="add-circle" size={20} color="#fff" style={styles.rechargeIcon} />
            <Text style={styles.rechargeButtonText}>Nạp tiền</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color="#007AFF" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <View style={styles.infoLeft}>
            <Ionicons name="person-outline" size={18} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Họ và tên</Text>
          </View>
          <Text style={styles.infoValue}>{profileData.fullName || 'Chưa cập nhật'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <View style={styles.infoLeft}>
            <Ionicons name="mail-outline" size={18} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Email</Text>
          </View>
          <Text style={styles.infoValue}>{profileData.email || 'Chưa cập nhật'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <View style={styles.infoLeft}>
            <Ionicons name="call-outline" size={18} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Số điện thoại</Text>
          </View>
          <Text style={styles.infoValue}>{profileData.phone || 'Chưa cập nhật'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <View style={styles.infoLeft}>
            <Ionicons name="location-outline" size={18} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Địa chỉ</Text>
          </View>
          <Text style={styles.infoValue}>{profileData.address || 'Chưa cập nhật'}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/profile/edit')}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={18} color="#fff" style={styles.editButtonIcon} />
          <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>
      </View>

      {/* Account Settings */}
      <View style={styles.settingsCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={20} color="#007AFF" style={styles.sectionIcon} />
          <Text style={styles.cardTitle}>Cài đặt tài khoản</Text>
        </View>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/favorites')} activeOpacity={0.7}>
          <View style={styles.settingContent}>
            <Ionicons name="heart-outline" size={20} color="#FF3B30" style={styles.settingIcon} />
            <Text style={styles.settingText}>Mục yêu thích</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.divider} />
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/rooms/my-rooms')} activeOpacity={0.7}>
          <View style={styles.settingContent}>
            <Ionicons name="home-outline" size={20} color="#007AFF" style={styles.settingIcon} />
            <Text style={styles.settingText}>Phòng đã đăng</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.divider} />
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(tabs)/chat')} activeOpacity={0.7}>
          <View style={styles.settingContent}>
            <Ionicons name="chatbubble-outline" size={20} color="#34C759" style={styles.settingIcon} />
            <Text style={styles.settingText}>Tin nhắn</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.divider} />
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/rooms/create')} activeOpacity={0.7}>
          <View style={styles.settingContent}>
            <Ionicons name="add-circle-outline" size={20} color="#FF9500" style={styles.settingIcon} />
            <Text style={styles.settingText}>Đăng tin mới</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.divider} />
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/recharge/history')} activeOpacity={0.7}>
          <View style={styles.settingContent}>
            <Ionicons name="wallet-outline" size={20} color="#5856D6" style={styles.settingIcon} />
            <Text style={styles.settingText}>Lịch sử nạp tiền</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
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
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  email: {
    fontSize: 14,
    color: '#888',
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
  },
  rechargeButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  rechargeIcon: {
    marginRight: 0,
  },
  rechargeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  sectionIcon: {
    marginRight: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  infoIcon: {
    marginRight: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
  },
  editButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  editButtonIcon: {
    marginRight: 0,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    marginRight: 0,
  },
  settingText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#FFF5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  logoutIcon: {
    marginRight: 0,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});