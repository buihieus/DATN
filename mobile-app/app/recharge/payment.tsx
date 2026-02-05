import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaymentWebView from '../../components/payment/PaymentWebView';
import { useAuthStore } from '../../store/useUserStore';

const PaymentScreen = () => {
  const { paymentUrl } = useLocalSearchParams();

  const handleSuccess = async () => {
    alert('Thanh toán thành công!');
    // Refresh user data to get updated balance
    try {
      await useAuthStore.getState().getUserData();
    } catch (error) {
      console.error('Error refreshing user data after payment:', error);
    }
    // Quay về trang profile sau khi thanh toán thành công
    // Sử dụng replace để tránh quay lại màn hình thanh toán
    router.replace('/profile');
  };

  const handleFailure = (error) => {
    alert('Thanh toán thất bại: ' + error);
    // Quay lại trang trước đó, sử dụng replace để tránh vòng lặp
    router.replace('/recharge');
  };

  const handleCancel = () => {
    // Quay lại trang trước đó khi hủy, sử dụng replace để tránh vòng lặp
    router.replace('/recharge');
  };

  // Giải mã URL nếu đã được encode
  const decodedPaymentUrl = typeof paymentUrl === 'string' ? decodeURIComponent(paymentUrl) : paymentUrl ? decodeURIComponent(paymentUrl[0]) : null;

  if (!decodedPaymentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text>Không có URL thanh toán</Text>
          <Button title="Quay lại" onPress={() => router.replace('/recharge')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        headerTitle: 'Thanh toán',
        headerRight: () => (
          <Button title="Hủy" onPress={handleCancel} />
        ),
      }} />
      <PaymentWebView
        paymentUrl={decodedPaymentUrl}
        onSuccess={handleSuccess}
        onFailure={handleFailure}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default PaymentScreen;