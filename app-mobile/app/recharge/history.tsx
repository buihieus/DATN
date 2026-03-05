import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useUserStore';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/apiConstants';
import { getStoredTokens } from '../../utils/tokenUtils';

interface RechargeRecord {
  _id: string;
  userId: string;
  amount: number;
  typePayment: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function RechargeHistoryScreen() {
  const { user, getUserData } = useAuthStore();
  const [history, setHistory] = useState<RechargeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setError(null);
      console.log('Fetching recharge history...');
      
      // Get token from storage
      const { accessToken } = await getStoredTokens();
      console.log('Access token:', accessToken ? 'Present' : 'Missing');
      
      if (!accessToken) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/recharge-user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('Response:', response.data);
      
      // Check if response has metadata (server returns { message, metadata, statusCode })
      if (response.data.metadata || response.status === 200) {
        const historyData = response.data.metadata || response.data || [];
        setHistory(Array.isArray(historyData) ? historyData : []);
        console.log('History loaded:', historyData.length, 'records');
      } else {
        setError('Phản hồi từ server không thành công');
      }
    } catch (err: any) {
      console.error('Error fetching recharge history:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      
      let errorMessage = 'Không thể tải lịch sử nạp tiền';
      if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      } else if (err.response?.status === 404) {
        errorMessage = 'API không tồn tại';
      } else if (err.response?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      } else if (err.code === 'ECONNREFUSED' || err.code === 'NETWORK_ERROR') {
        errorMessage = 'Không thể kết nối server. Kiểm tra lại kết nối mạng.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'failed':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Thành công';
      case 'pending':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      default:
        return status;
    }
  };

  const getPaymentIcon = (typePayment: string) => {
    switch (typePayment) {
      case 'VNPAY':
        return 'bank';
      case 'MOMO':
        return 'wallet';
      default:
        return 'card';
    }
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Chưa có lịch sử nạp tiền</Text>
      <TouchableOpacity
        style={styles.rechargeButton}
        onPress={() => router.push('/recharge')}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.rechargeButtonText}>Nạp tiền ngay</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: RechargeRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons
            name={getPaymentIcon(item.typePayment)}
            size={24}
            color="#007AFF"
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>
            {item.typePayment === 'VNPAY' ? 'Ngân hàng' : item.typePayment}
          </Text>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.cardAmount}>
          <Text style={styles.amountText}>
            +{item.amount.toLocaleString('vi-VN')}₫
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Lịch sử nạp tiền' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && history.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Lịch sử nạp tiền' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={64} color="#FF9500" />
          <Text style={styles.errorTitle}>Không thể tải lịch sử</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchHistory}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Lịch sử nạp tiền',
        }}
      />
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: '#999',
  },
  cardAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  rechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  rechargeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
