import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../../services/authService';
import { NotificationManager } from '../../components/NotificationManager';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email'); // Step tracking
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập email của bạn');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      NotificationManager.showSuccess('Mã OTP đã được gửi', 'Vui lòng kiểm tra email của bạn để nhận mã xác nhận');
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Đã xảy ra lỗi khi gửi OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = () => {
    if (!otp) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP');
      return;
    }

    // In a real app, you would verify the OTP with the backend
    // For now, we'll just move to the next step
    setStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu mới');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(otp, newPassword);
      NotificationManager.showSuccess('Đặt lại mật khẩu thành công', 'Mật khẩu của bạn đã được cập nhật!');
      // Điều hướng ngay lập tức thay vì đợi toast ẩn đi
      router.push('/auth/login');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Đã xảy ra lỗi khi đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToEmailStep = () => {
    setStep('email');
    setEmail('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>
          {step === 'email' && 'Quên mật khẩu'}
          {step === 'otp' && 'Xác nhận OTP'}
          {step === 'newPassword' && 'Đặt lại mật khẩu'}
        </Text>
        
        <Text style={styles.subtitle}>
          {step === 'email' && 'Nhập email để nhận mã xác nhận'}
          {step === 'otp' && 'Nhập mã OTP đã gửi đến email của bạn'}
          {step === 'newPassword' && 'Nhập mật khẩu mới cho tài khoản'}
        </Text>
      </View>

      {/* Form section */}
      <View style={styles.form}>
        {step === 'email' && (
          <>
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

            <TouchableOpacity 
              style={styles.sendOTPButton} 
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendOTPButtonText}>Gửi mã OTP</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === 'otp' && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mã OTP</Text>
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                placeholder="Nhập mã OTP"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <TouchableOpacity 
              style={styles.verifyButton} 
              onPress={handleVerifyOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Xác nhận</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={goBackToEmailStep} style={styles.resendContainer}>
              <Text style={styles.resendText}>Gửi lại OTP</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'newPassword' && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <TextInput
                style={styles.input}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Đặt lại mật khẩu</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
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
  },
  sendOTPButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sendOTPButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default ForgotPasswordPage;