import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Post } from '../services/roomService';
import { router } from 'expo-router';

interface RoomRecommendationBubbleProps {
  rooms: Post[];
  message: string;
  isOwn: boolean;
}

const RoomRecommendationBubble: React.FC<RoomRecommendationBubbleProps> = ({ 
  rooms, 
  message,
  isOwn 
}) => {
  const handleRoomPress = (roomId: string) => {
    router.push(`/rooms/${roomId}`);
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
          {message}
        </Text>
        <Text style={[styles.recommendationTitle, isOwn ? styles.ownText : styles.otherText]}>
          {'\n'}Gợi ý phòng trọ:
        </Text>
        <View style={styles.roomsContainer}>
          {rooms.map((room) => (
            <TouchableOpacity
              key={room._id}
              style={[styles.roomCard, isOwn ? styles.ownRoomCard : styles.otherRoomCard]}
              onPress={() => handleRoomPress(room._id)}
            >
              {room.images && room.images.length > 0 && (
                <Image 
                  source={{ uri: room.images[0] }} 
                  style={styles.roomImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.roomInfo}>
                <Text style={[styles.roomTitle, isOwn ? styles.ownText : styles.otherText]} numberOfLines={2}>
                  {room.title}
                </Text>
                <Text style={styles.roomPrice}>
                  {room.price?.toLocaleString()} VND
                </Text>
                <Text style={styles.roomLocation} numberOfLines={1}>
                  {room.location}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '90%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '85%',
    position: 'relative',
  },
  ownBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: '#E5E5EA',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: 'white',
  },
  otherText: {
    color: 'black',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  roomsContainer: {
    marginTop: 8,
    gap: 8,
  },
  roomCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ownRoomCard: {
    backgroundColor: '#f0f8ff',
  },
  otherRoomCard: {
    backgroundColor: '#f8f8f8',
  },
  roomImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 8,
  },
  roomInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  roomPrice: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  roomLocation: {
    fontSize: 11,
    color: '#888',
  },
});

export default RoomRecommendationBubble;