import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapWebView from '../components/MapWebView';

const ExampleMapScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ví dụ bản đồ</Text>
      <MapWebView address="123 Nguyễn Trãi, Quận 1, TP.HCM" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default ExampleMapScreen;