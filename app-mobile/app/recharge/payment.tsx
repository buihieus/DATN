import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaymentWebView from '../../components/payment/PaymentWebView';
import { useAuthStore } from '../../store/useUserStore';

const PaymentScreen = () => {
  const { paymentUrl, amount } = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuccess = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    console.log('Payment success callback');
    
    // Navigate back to profile first
    router.back();
    
    // Wait for navigation to complete, then refresh data and show alert
    setTimeout(async () => {
      router.back();
      
      // Wait a bit for profile to load, then refresh and show alert
      setTimeout(async () => {
        // Refresh user data to get updated balance
        try {
          console.log('Refreshing user data after payment...');
          await useAuthStore.getState().getUserData();
          console.log('User data refreshed successfully');
        } catch (error) {
          console.error('Error refreshing user data after payment:', error);
        }
        
        // Use the amount from params (user input)
        const displayAmount = amount ? parseInt(amount as string) : 0;
        const amountStr = displayAmount > 0 
          ? `${displayAmount.toLocaleString('vi-VN')}₫` 
          : 'thành công';
        
        // Show success alert on profile screen
        Alert.alert(
          '✓ Thành công!',
          `Nạp tiền ${amountStr} vào tài khoản`,
          [{ text: 'OK' }]
        );
      }, 500);
    }, 100);
  };

  const handleFailure = (error) => {
    console.log('Payment failure callback:', error);
    Alert.alert(
      'Thanh toán thất bại',
      error || 'Có lỗi xảy ra trong quá trình thanh toán',
      [
        {
          text: 'OK',
          onPress: () => {
            // Go back to recharge screen
            router.back();
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    if (isProcessing) return;
    router.back();
  };

  // Giải mã URL nếu đã được encode
  const decodedPaymentUrl = typeof paymentUrl === 'string' ? decodeURIComponent(paymentUrl) : paymentUrl ? decodeURIComponent(paymentUrl[0]) : null;

  if (!decodedPaymentUrl) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{
          headerShown: true,
          headerTitle: 'Thanh toán',
        }} />
        <View style={styles.content}>
          <Text>Không có URL thanh toán</Text>
          <Button title="Quay lại" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: 'Thanh toán',
        headerRight: () => (
          <Button title="Hủy" onPress={handleCancel} disabled={isProcessing} />
        ),
      }} />
      <PaymentWebView
        paymentUrl={decodedPaymentUrl}
        onSuccess={handleSuccess}
        onFailure={handleFailure}
        onCancel={handleCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default PaymentScreen;