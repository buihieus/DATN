import { Alert, ToastAndroid, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export class NotificationManager {
  static show(type: NotificationType, title: string, message?: string, onPress?: () => void) {
    // Use react-native-toast-message for consistent experience across platforms
    try {
      Toast.show({
        type: type,
        text1: title,
        text2: message,
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
        onHide: onPress,
      });
    } catch (error) {
      console.warn('Toast notification failed:', error);
      // Fallback to Alert if Toast fails
      Alert.alert(title, message || '');
    }
  }

  static showSuccess(title: string, message?: string, onPress?: () => void) {
    this.show('success', title, message, onPress);
  }

  static showError(title: string, message?: string, onPress?: () => void) {
    this.show('error', title, message, onPress);
  }

  static showInfo(title: string, message?: string, onPress?: () => void) {
    this.show('info', title, message, onPress);
  }

  static showWarning(title: string, message?: string, onPress?: () => void) {
    this.show('warning', title, message, onPress);
  }

  // For testing purposes - to verify notification system works
  static showTestNotification() {
    this.showSuccess('Thông báo kiểm tra', 'Hệ thống thông báo đang hoạt động!');
  }

  // For critical messages that require user action, still use Alert
  static showAlert(
    title: string, 
    message: string, 
    buttons: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[] = [{ text: 'OK' }],
    options?: { cancelable?: boolean }
  ) {
    Alert.alert(title, message, buttons, options);
  }
}