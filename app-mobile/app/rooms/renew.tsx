import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { postService } from '../../services/roomService';
import { useAuthStore } from '../../store/useUserStore';
import Toast from 'react-native-toast-message';

export default function RenewRoomScreen() {
  const { postId, title, typeNews, status, endDate } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [selectedDuration, setSelectedDuration] = useState<number>(3); // Default to 3 days
  // Không còn chọn loại tin, luôn là 'normal'
  const selectedType = 'normal'; // Always 'normal' since we no longer differentiate

  // Pricing structure - only normal pricing since we no longer have VIP
  const pricing = {
    normal: {
      3: 10000,
      7: 50000,
      30: 1000000,
    }
  };

  const [loading, setLoading] = useState(false);

  const handleRenew = async () => {
    setLoading(true);
    try {
      // Không còn truyền selectedType vì tất cả bài đăng đều là tin thường
      const result = await postService.renewPost(postId as string, selectedDuration);

      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Bài đăng đã được gia hạn thành công',
      });

      // Navigate back to my rooms
      router.back();
    } catch (error) {
      console.error('Error renewing post:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể gia hạn bài đăng, vui lòng thử lại',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentPrice = pricing.normal[selectedDuration] || 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Gia hạn bài đăng</Text>
        </View>

        {/* Thông tin bài đăng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin bài đăng</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tiêu đề:</Text>
            <Text style={styles.infoValue}>{title}</Text>
          </View>
          {/* Không còn hiển thị loại tin vì tất cả đều là tin thường */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái hiện tại:</Text>
            <Text style={styles.infoValue}>Đã duyệt</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày hết hạn hiện tại:</Text>
            <Text style={styles.infoValue}>
              {endDate ? new Date(endDate as string).toLocaleDateString('vi-VN') : 'Chưa xác định'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày hết hạn mới:</Text>
            <Text style={styles.infoValue}>
              {endDate ? new Date(new Date(endDate as string).getTime() + selectedDuration * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN') : 'Sau khi gia hạn'}
            </Text>
          </View>
        </View>

        {/* Không còn phần chọn loại tin vì tất cả bài đăng đều là tin thường */}

        {/* Thời gian gia hạn */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian gia hạn</Text>
          <View style={styles.durationOptions}>
            {[3, 7, 30].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.durationButton,
                  selectedDuration === days && styles.durationButtonSelected
                ]}
                onPress={() => setSelectedDuration(days)}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    selectedDuration === days && styles.durationButtonTextSelected
                  ]}
                >
                  {days} ngày
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Total amount */}
          {currentPrice > 0 && (
            <View style={styles.totalAmount}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalPrice}>{currentPrice.toLocaleString('vi-VN')} VNĐ</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.renewButton}
          onPress={handleRenew}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.renewButtonText}>Gia hạn bài đăng</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 5,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 150,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  typeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
  },
  typeButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f0ff',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  typeButtonTextSelected: {
    color: '#007AFF',
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  durationButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  durationButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  durationButtonText: {
    fontSize: 16,
    color: '#333',
  },
  durationButtonTextSelected: {
    color: '#fff',
  },
  totalAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF2D55',
  },
  renewButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  renewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});