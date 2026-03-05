import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';

const PaymentWebView = ({ paymentUrl, onSuccess, onFailure, onCancel }) => {
  const callbackCalled = useRef(false);

  useEffect(() => {
    // Reset callback flag when paymentUrl changes
    callbackCalled.current = false;
    
    if (!paymentUrl) {
      console.error('PaymentWebView: No payment URL provided');
      onFailure && onFailure('Không có URL thanh toán');
    } else {
      console.log('PaymentWebView: Payment URL received', paymentUrl.substring(0, 50) + '...');
    }
  }, [paymentUrl]);

  const handleSuccessCallback = (amount) => {
    if (callbackCalled.current) {
      console.log('Callback already called, ignoring duplicate...');
      return;
    }
    callbackCalled.current = true;
    console.log('Calling success callback with amount:', amount);
    onSuccess && onSuccess(amount);
  };

  const handleFailureCallback = (error) => {
    if (callbackCalled.current) {
      console.log('Callback already called, ignoring duplicate...');
      return;
    }
    callbackCalled.current = true;
    onFailure && onFailure(error);
  };

  const handleNavigationStateChange = (navState) => {
    const { url, loading } = navState;

    // Chỉ xử lý khi navigation hoàn tất (không phải đang loading)
    if (loading) return;

    console.log('Navigation URL:', url.substring(0, 100) + (url.length > 100 ? '...' : '')); // Thêm log để debug

    // Kiểm tra nếu URL là callback từ cổng thanh toán VNPay
    if (url.includes('check-payment-vnpay')) {
      try {
        // Parse query parameters to determine success/failure
        const queryString = url.split('?')[1] || '';
        const urlParams = new URLSearchParams(queryString);
        const responseCode = urlParams.get('vnp_ResponseCode');
        const transactionStatus = urlParams.get('vnp_TransactionStatus');

        console.log('VNPay Response Code:', responseCode);
        console.log('VNPay Transaction Status:', transactionStatus);

        // Gọi callback thành công ngay khi thấy URL callback với response code 00
        if (responseCode === '00' && transactionStatus === '00') {
          console.log('Payment successful - Calling success callback...');
          // Trích xuất số tiền từ URL nếu có
          // VNPay trả về amount với giá trị thực tế (không cần chia 100)
          const amountParam = urlParams.get('vnp_Amount');
          const amount = amountParam ? parseInt(amountParam) : 0;
          console.log('Extracted amount from URL:', amount);
          setTimeout(() => {
            handleSuccessCallback(amount);
          }, 300);
        } else if (responseCode && responseCode !== '00') {
          console.log('Payment failed - Calling failure callback...');
          setTimeout(() => {
            handleFailureCallback(`Thanh toán thất bại (Mã lỗi: ${responseCode})`);
          }, 500);
        }
      } catch (error) {
        console.error('Error parsing VNPay callback:', error);
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
          handleSuccessCallback(0);
        }, 1000);
      }
      // Check for failed payment
      else if (resultCode) {
        console.log('MoMo Payment failed detected');
        setTimeout(() => {
          handleFailureCallback(`Thanh toán thất bại (Mã lỗi: ${resultCode})`);
        }, 1000);
      }
    }
    // Kiểm tra các URL chứa thông báo thành công/thất bại từ server
    else if (url.includes('payment-success') || url.includes('payment-failed')) {
      if (url.includes('success')) {
        setTimeout(() => {
          handleSuccessCallback(0);
        }, 1000);
      } else {
        setTimeout(() => {
          handleFailureCallback('Thanh toán thất bại');
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
      console.log('WebView message received:', message);

      // KHÔNG gọi callback từ message nữa vì đã gọi từ navigation state change
      // Chỉ log để debug
      if (message.type === 'PAYMENT_SUCCESS') {
        console.log('Payment success message received (ignored, already called from navigation)');
      } else if (message.type === 'PAYMENT_FAILURE') {
        console.log('Payment failure message received (ignored)');
      } else if (message.type === 'WEBVIEW_CLOSE') {
        console.log('WebView close requested (ignored)');
      } else if (message.type === 'PAGE_LOADED') {
        console.log('Page loaded:', message.url);
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
        nestedScrollEnabled={true}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onError={(error) => {
          console.error('WebView Error:', error);
          
          // Kiểm tra nếu lỗi xảy ra khi load URL callback từ VNPay
          const failingUrl = error.nativeEvent?.url || error.url || '';
          if (failingUrl.includes('check-payment-vnpay')) {
            console.log('Error on callback URL, ignoring (payment already processed)...');
            // Bỏ qua lỗi này vì thanh toán đã thành công
            return;
          }
          
          // Bỏ qua lỗi null hoặc lỗi không quan trọng
          if (!error || !error.nativeEvent) {
            console.log('WebView error is null or incomplete, ignoring...');
            return;
          }
          
          const errorCode = error.nativeEvent?.code || error.code;
          const errorDescription = error.nativeEvent?.description || error.description;
          
          // Bỏ qua các lỗi không quan trọng
          if (errorCode === 0 || !errorCode || errorCode === -6) {
            console.log('Ignoring minor WebView error');
            return;
          }
          
          onFailure && onFailure(`Lỗi khi mở cổng thanh toán: ${error.domain || errorCode || errorDescription || 'Unknown error'}`);
        }}
        onHttpError={(error) => {
          console.error('WebView HTTP Error:', error);
          // Chỉ báo lỗi HTTP nếu không phải là redirect đến callback URL
          if (error.nativeEvent?.url?.includes('check-payment-vnpay')) {
            console.log('HTTP error on callback URL, ignoring...');
            return;
          }
          onFailure && onFailure(`Lỗi HTTP khi mở cổng thanh toán: ${error.statusCode} - ${error.description}`);
        }}
        // Cấu hình để WebView có thể giao tiếp với React Native
        injectedJavaScript={`
          (function() {
            // Override window.close to send message to React Native instead
            var originalClose = window.close;
            window.close = function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'WEBVIEW_CLOSE' }));
              }
              originalClose.call(window);
            };
            
            // Log when page is loaded
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAGE_LOADED', url: window.location.href }));
            }
          })();
          true;
        `}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text>Đang chuyển đến cổng thanh toán...</Text>
          </View>
        )}
        onShouldStartLoadWithRequest={(request) => {
          // Log all requests for debugging
          console.log('WebView request URL:', request.url.substring(0, 100) + (request.url.length > 100 ? '...' : ''));

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