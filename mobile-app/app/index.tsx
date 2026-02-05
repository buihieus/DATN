import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

// This is the main app entry point that handles authentication flow
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Sử dụng setTimeout để đảm bảo layout được mount trước khi điều hướng
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show a loading indicator while redirecting
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

