import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';

const PaymentWebView = ({ paymentUrl, onSuccess, onFailure, onCancel }) => {
  useEffect(() => {
    if (!paymentUrl) {
      console.error('PaymentWebView: No payment URL provided');
      onFailure && onFailure('Không có URL thanh toán');
    } else {
      console.log('PaymentWebView: Payment URL received', paymentUrl.substring(0, 50) + '...');
    }
  }, [paymentUrl]);

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    
    console.log('Navigation URL:', url.substring(0, 100) + (url.length > 100 ? '...' : '')); // Thêm log để debug
    
    // Kiểm tra nếu URL là callback từ cổng thanh toán VNPay
    if (url.includes('check-payment-vnpay')) {
      // Parse query parameters to determine success/failure
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const responseCode = urlParams.get('vnp_ResponseCode');
      const transactionStatus = urlParams.get('vnp_TransactionStatus');
      
      console.log('VNPay Response Code:', responseCode);
      console.log('VNPay Transaction Status:', transactionStatus);
      
      // Check for successful payment
      if (responseCode === '00' && transactionStatus === '00') {
        console.log('Payment successful detected');
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 1000);
      } 
      // Check for failed payment
      else if (responseCode && responseCode !== '00') {
        console.log('Payment failed detected');
        setTimeout(() => {
          onFailure && onFailure(`Thanh toán thất bại (Mã lỗi: ${responseCode})`);
        }, 1000);
      }
    }
    // Kiểm tra nếu URL là callback từ cổng thanh toán MoMo
    else if (url.includes('check-payment-momo')) {
      // Parse query parameters to determine success/failure
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const resultCode = urlParams.get('resultCode');
      
      console.log('MoMo Result Code:', resultCode);
      
      // Check for successful payment (resultCode 0 = success)
      if (resultCode === '0') {
        console.log('MoMo Payment successful detected');
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 1000);
      } 
      // Check for failed payment
      else if (resultCode) {
        console.log('MoMo Payment failed detected');
        setTimeout(() => {
          onFailure && onFailure(`Thanh toán thất bại (Mã lỗi: ${resultCode})`);
        }, 1000);
      }
    }
    // Kiểm tra các URL chứa thông báo thành công/thất bại từ server
    else if (url.includes('payment-success') || url.includes('payment-failed')) {
      if (url.includes('success')) {
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 1000);
      } else {
        setTimeout(() => {
          onFailure && onFailure('Thanh toán thất bại');
        }, 1000);
      }
    }
    // Kiểm tra các URL của cổng thanh toán
    else if (url.includes('vnpayment.vn') || url.includes('momo.vn') || url.includes('sandbox')) {
      // Đang ở trong cổng thanh toán, không làm gì cả
      console.log('Inside payment gateway');
    }
    // Kiểm tra các URL quay lại ứng dụng
    else if (url.includes('trang-ca-nhan') || url.includes('profile') || url.includes('recharge')) {
      // Nếu người dùng quay lại hoặc hủy thanh toán
      console.log('User navigating back or cancelling');
      setTimeout(() => {
        onCancel && onCancel();
      }, 500);
    }
  };

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'PAYMENT_SUCCESS') {
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 500);
      } else if (message.type === 'PAYMENT_FAILURE') {
        setTimeout(() => {
          onFailure && onFailure(message.message || 'Thanh toán thất bại');
        }, 500);
      }
    } catch (error) {
      console.log('Error parsing message:', error);
    }
  };

  if (!paymentUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không thể mở cổng thanh toán</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: paymentUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onError={(error) => {
          console.error('WebView Error:', error);
          onFailure && onFailure(`Lỗi khi mở cổng thanh toán: ${error.domain || error.code || error.description || 'Unknown error'}`);
        }}
        onHttpError={(error) => {
          console.error('WebView HTTP Error:', error);
          onFailure && onFailure(`Lỗi HTTP khi mở cổng thanh toán: ${error.statusCode} - ${error.description}`);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text>Đang chuyển đến cổng thanh toán...</Text>
          </View>
        )}
        // Cho phép mở các liên kết trong cùng WebView
        onShouldStartLoadWithRequest={(request) => {
          // Cho phép tất cả các yêu cầu trong WebView
          return true;
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
    color: 'red',
  },
});

export default PaymentWebView;