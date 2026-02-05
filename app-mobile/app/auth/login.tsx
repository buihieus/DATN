import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../store/useUserStore';
import { NotificationManager } from '../../components/NotificationManager';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Keep the Google login session active in the browser
WebBrowser.maybeCompleteAuthSession();

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginGoogle, error, isAuthenticated, checkAuthStatus } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      // Gọi hàm đăng nhập
      await login(email, password);

      NotificationManager.showSuccess('Đăng nhập thành công', 'Chào mừng bạn đến với ứng dụng!');

      // Điều hướng trực tiếp đến tabs
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Lỗi đăng nhập', err.message || 'Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  // Google login functionality
  const handleGoogleLogin = async () => {
    try {
      // Check if Google Client IDs are configured
      const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

      if (!androidClientId || !iosClientId || androidClientId === 'YOUR_ANDROID_CLIENT_ID' || iosClientId === 'YOUR_IOS_CLIENT_ID') {
        Alert.alert(
          'Thông báo',
          'Tính năng đăng nhập bằng Google chưa được cấu hình. Vui lòng liên hệ quản trị viên để thiết lập Google Client IDs.',
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Hướng dẫn',
              onPress: () => {
                Alert.alert(
                  'Hướng dẫn cấu hình Google Login',
                  '1. Truy cập https://console.cloud.google.com/\n2. Tạo dự án hoặc chọn dự án hiện tại\n3. Kích hoạt Google+ API\n4. Tạo OAuth 2.0 Client IDs cho iOS và Android\n5. Cập nhật file .env với các Client IDs'
                );
              }
            }
          ]
        );
        return;
      }

      // For a real implementation, you would use your actual Google Client IDs
      // iOS Client ID and Android Client ID from Google Cloud Console
      const { type, authentication } = await Google.authRequest({
        androidClientId,
        iosClientId,
        scopes: ['profile', 'email'],
      });

      if (type === 'success' && authentication?.idToken) {
        // Call the loginGoogle function from the auth store
        await loginGoogle(authentication.idToken);

        NotificationManager.showSuccess('Đăng nhập thành công', 'Chào mừng bạn đến với ứng dụng!');

        // Navigate to the main tabs screen
        router.replace('/(tabs)');
      } else if (type === 'cancel') {
        console.log('Google login cancelled by user');
      } else if (type === 'error') {
        throw new Error('Google authentication error');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      Alert.alert('Lỗi', err.message || 'Đăng nhập bằng Google thất bại');
    }
  };

  // Kiểm tra xác thực khi component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        // Nếu chưa xác thực, kiểm tra lại trạng thái xác thực
        await checkAuthStatus();
      }
    };

    checkAuth();
  }, []);

  // Nếu người dùng đã xác thực, điều hướng đến trang chính
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    // Hiển thị một màn hình tải trong khi điều hướng
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Đang chuyển hướng...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Logo/Brand section */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/placeholderSignUp.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Vui lòng nhập thông tin tài khoản của bạn</Text>
        </View>

        {/* Form section */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email của bạn"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity> */}
          
          {/* Divider */}
          {/* <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View> */}

          {/* Social login buttons */}
          {/* <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleLogin}
          >
            <Text style={styles.googleButtonText}>Đăng nhập bằng Google</Text>
          </TouchableOpacity> */}
          
          {/* Sign up section - moved right after Google login */}
          <View style={styles.signupSection}>
            <Text style={styles.signupText}>Bạn chưa có tài khoản? </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'space-between', // Phân bố đều không gian
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    paddingRight: 45, // Add padding to accommodate the eye icon
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 12,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 15,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginPage;