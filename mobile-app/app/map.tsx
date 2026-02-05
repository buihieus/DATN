import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapWebView from '../components/MapWebView';

const MapScreen: React.FC<{ route: any }> = ({ route }) => {
  const { address } = route?.params || { address: 'Hanoi, Vietnam' };

  return (
    <View style={styles.container}>
      <MapWebView address={address} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

export default MapScreen;