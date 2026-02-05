import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOnlineStatusStore } from '../store/useOnlineStatusStore';

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  userId?: string; // Add userId prop to check online status
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, subtitle, onBack, userId }) => {
  const isOnline = userId ? useOnlineStatusStore(state => state.getOnlineStatus(userId)) : false;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => onBack ? onBack() : router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.statusContainer}>
          {userId && (
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#34C759' : '#8E8E93' }]} />
          )}
          <Text style={styles.subtitle} numberOfLines={1}>
            {isOnline ? 'Đang trực tuyến' : 'Đã ngoại tuyến'}
          </Text>
        </View>
      </View>
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 50, // Add top padding for safe area
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  spacer: {
    width: 30, // Spacer to balance the back button
  },
});

export default ChatHeader;