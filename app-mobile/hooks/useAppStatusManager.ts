import { useEffect } from 'react';
import { AppState } from 'react-native';
import { chatService } from '../services/chatService';

export const useAppStatusManager = () => {
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Khi ứng dụng trở lại hoạt động, cập nhật trạng thái là trực tuyến
        chatService.updateUserStatus(true);
      } else if (nextAppState === 'background') {
        // Khi ứng dụng chuyển sang chế độ nền, cập nhật trạng thái là ngoại tuyến
        chatService.updateUserStatus(false);
      }
    };

    // Đăng ký lắng nghe thay đổi trạng thái ứng dụng
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cập nhật trạng thái trực tuyến khi component mount
    chatService.updateUserStatus(true);

    // Dọn dẹp khi component unmount
    return () => {
      subscription?.remove();
      // Cập nhật trạng thái ngoại tuyến khi component unmount
      chatService.updateUserStatus(false);
    };
  }, []);
};