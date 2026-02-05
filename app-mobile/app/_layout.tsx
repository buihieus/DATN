import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {View, Text } from 'react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import '@/utils/disableLogs';

import { useColorScheme } from '@/hooks/use-color-scheme';
import SocketProvider from '@/components/SocketProvider';
import { useAppStatusManager } from '@/hooks/useAppStatusManager';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize app status manager
  useAppStatusManager();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SocketProvider>
        <Stack screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#000',
          headerTitleAlign: 'center',
        }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="rooms/create" options={{ headerShown: true, title: 'Đăng tin mới', presentation: 'card', gestureEnabled: true, fullScreenGestureEnabled: true }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false, title: 'Đăng nhập' }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false, title: 'Đăng ký' }} />
          <Stack.Screen name="auth/forgot-password" options={{ headerShown: true, title: 'Quên mật khẩu' }} />
          <Stack.Screen name="favorites/index" options={{ headerShown: true, title: 'Yêu thích' }} />
          <Stack.Screen name="rooms/[id]" options={{ headerShown: true, title: 'Chi tiết phòng' }} />
          <Stack.Screen name="rooms/my-rooms" options={{ headerShown: true, title: 'Phòng đã đăng' }} />
          <Stack.Screen name="chat" options={{ headerShown: false, title: 'Trò chuyện' }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false, title: 'Trò chuyện' }} />
          <Stack.Screen name="profile" options={{ headerShown: false, title: 'Hồ sơ' }} />
        </Stack>
        <StatusBar style="auto" />
        <Toast
          config={{
            success: (toast) => (
              <View style={{ backgroundColor: '#D4EDDA', padding: 15, borderRadius: 8, borderColor: '#C3E6CB', borderWidth: 1, width: '90%', alignSelf: 'center', top: 60 }}>
                <Text style={{ color: '#155724', fontWeight: 'bold', fontSize: 16 }}>{toast.text1}</Text>
                {toast.text2 && <Text style={{ color: '#155724', fontSize: 14 }}>{toast.text2}</Text>}
              </View>
            ),
            error: (toast) => (
              <View style={{ backgroundColor: '#F8D7DA', padding: 15, borderRadius: 8, borderColor: '#F5C6CB', borderWidth: 1, width: '90%', alignSelf: 'center', top: 60 }}>
                <Text style={{ color: '#721C24', fontWeight: 'bold', fontSize: 16 }}>{toast.text1}</Text>
                {toast.text2 && <Text style={{ color: '#721C24', fontSize: 14 }}>{toast.text2}</Text>}
              </View>
            ),
            info: (toast) => (
              <View style={{ backgroundColor: '#D1ECF1', padding: 15, borderRadius: 8, borderColor: '#B8DAE0', borderWidth: 1, width: '90%', alignSelf: 'center', top: 60 }}>
                <Text style={{ color: '#0C5460', fontWeight: 'bold', fontSize: 16 }}>{toast.text1}</Text>
                {toast.text2 && <Text style={{ color: '#0C5460', fontSize: 14 }}>{toast.text2}</Text>}
              </View>
            ),
          }}
        />
      </SocketProvider>
    </ThemeProvider>
  );
}
// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import { View, Text } from 'react-native';
// import 'react-native-reanimated';
// import Toast from 'react-native-toast-message';

// import { useColorScheme } from '@/hooks/use-color-scheme';
// import SocketProvider from '@/components/SocketProvider';
// import { useAppStatusManager } from '@/hooks/useAppStatusManager';

// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//   useAppStatusManager();

//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <SocketProvider>
//         <Stack
//           screenOptions={{
//             headerTitleAlign: 'center',
//           }}
//         >
//           {/* chỉ override những screen CẦN override */}
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//           <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
//         </Stack>

//         <StatusBar style="auto" />
//         <Toast />
//       </SocketProvider>
//     </ThemeProvider>
//   );
// }
