import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';
import { API_BASE_URL } from '../../constants/apiConstants';
import { getStoredTokens } from '../../utils/tokenUtils';

export default function RechargeScreen() {
  const [amount, setAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('MOMO'); // 'MOMO' or 'VNPAY'
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  // useEffect để kiểm tra xác thực
  useEffect(() => {
    const checkAuth = async () => {
      if (!user && !useAuthStore.getState().isAuthenticated) {
        const tokens = await getStoredTokens();
        if (tokens.accessToken) {
          // Nếu có token nhưng store chưa cập nhật, gọi lại getUserData
          useAuthStore.getState().getUserData();
        } else {
          // Nếu không có token, điều hướng đến trang đăng nhập
          // router.replace('/auth/login');
        }
      }
    };

    checkAuth();
  }, []);

  const formatCurrency = (value) => {
    // Remove non-digit characters
    const numericValue = value.replace(/[^0-9]/g, '');
    // Format as currency (e.g. 1,000,000)
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (text) => {
    const formattedValue = formatCurrency(text);
    setAmount(formattedValue);
  };

  const handleRecharge = async () => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const tokens = await getStoredTokens();
    if (!tokens.accessToken) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để sử dụng tính năng này');
      router.push('/auth/login'); // Điều hướng đến trang đăng nhập
      return;
    }

    if (!amount || parseInt(amount.replace(/,/g, '')) < 1000) {
      Alert.alert('Lỗi', 'Số tiền nạp phải lớn hơn hoặc bằng 1,000₫');
      return;
    }

    const numericAmount = parseInt(amount.replace(/,/g, ''));

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`, // Sử dụng token từ hàm getStoredTokens
        },
        body: JSON.stringify({
          typePayment: selectedPayment,
          amountUser: numericAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Payment API error response:', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      let paymentUrl = null;

      if (selectedPayment === 'MOMO') {
        // For MoMo, get the payment URL from response
        paymentUrl = data.metadata.payUrl;
        console.log('MoMo payment URL:', paymentUrl); // Debug log
      } else if (selectedPayment === 'VNPAY') {
        // For VNPay, the response itself is the payment URL
        paymentUrl = data.metadata;
        console.log('VNPay payment URL:', paymentUrl); // Debug log
      }

      if (paymentUrl) {
        // Navigate to payment webview
        router.push({
          pathname: '/recharge/payment',
          params: { paymentUrl: encodeURIComponent(paymentUrl) }
        });
      } else {
        Alert.alert('Lỗi', 'Không nhận được URL thanh toán từ hệ thống');
      }
    } catch (error) {
      console.error('Recharge error:', error);
      let errorMessage = 'Có lỗi xảy ra khi tạo yêu cầu nạp tiền';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Nạp tiền vào ví</Text>
        <Text style={styles.subtitle}>Số dư hiện tại: {user?.balance ? user.balance.toLocaleString('vi-VN') + '₫' : '0₫'}</Text>

        <View style={styles.amountContainer}>
          <Text style={styles.label}>Số tiền nạp</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="Nhập số tiền"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text style={styles.currency}>₫</Text>
          </View>

          <View style={styles.quickAmountsContainer}>
            {quickAmounts.map((value) => (
              <TouchableOpacity
                key={value}
                style={styles.quickAmountButton}
                onPress={() => setAmount(formatCurrency(value.toString()))}
              >
                <Text style={styles.quickAmountText}>{value.toLocaleString('vi-VN')}₫</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.paymentMethodContainer}>
          <Text style={styles.label}>Phương thức thanh toán</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPayment === 'VNPAY' && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPayment('VNPAY')}
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  selectedPayment === 'VNPAY' && styles.paymentOptionTextSelected,
                ]}
              >
                VNPay
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPayment === 'MOMO' && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPayment('MOMO')}
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  selectedPayment === 'MOMO' && styles.paymentOptionTextSelected,
                ]}
              >
                MoMo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.paymentInfo}>
          <Text style={styles.paymentInfoText}>
            {selectedPayment === 'VNPAY'
              ? 'Thanh toán qua cổng VNPay - An toàn và bảo mật'
              : 'Thanh toán qua cổng MoMo - Nhanh chóng và tiện lợi'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.rechargeButton}
          onPress={handleRecharge}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.rechargeButtonText}>
              Nạp {amount ? parseInt(amount.replace(/,/g, '')).toLocaleString('vi-VN') : '0'}₫
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Lưu ý:</Text>
          <Text style={styles.infoText}>- Số tiền sẽ được cộng vào ví của bạn sau khi thanh toán thành công</Text>
          <Text style={styles.infoText}>- Bạn có thể kiểm tra lịch sử giao dịch trong phần Hồ sơ</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  amountContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: '#333',
  },
  currency: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 8,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#333',
  },
  paymentMethodContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  paymentOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  paymentOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  paymentOptionText: {
    fontSize: 16,
    color: '#333',
  },
  paymentOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  paymentInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  rechargeButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  rechargeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
});