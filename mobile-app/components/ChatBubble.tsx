import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../services/chatService';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwn }) => {
  // Helper function to safely convert content to string
  const formatContent = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }
    
    if (content && typeof content === 'object') {
      // Handle different formats that might come from the backend
      if (content.message && typeof content.message === 'string') {
        return content.message;
      } else if (content.text && typeof content.text === 'string') {
        return content.text;
      } else if (content.type === 'recommendation' && content.message && Array.isArray(content.rooms)) {
        // Handle recommendation responses with room suggestions
        const roomList = content.rooms.map((room: any) => 
          `- ${room.title || 'Phòng trọ'} (Giá: ${room.price?.toLocaleString() || 'Liên hệ'} VND)`
        ).join('\n');
        return `${content.message}\n\nGợi ý phòng trọ:\n${roomList}`;
      } else if (content.type === 'text' && content.message) {
        return content.message;
      } else {
        // Fallback: return JSON string of the object
        return JSON.stringify(content);
      }
    }
    
    // If content is not a string or object, convert to string
    return String(content);
  };

  // Safely get content with fallback
  const content = message.content ?? message.message ?? '';
  const displayContent = formatContent(content);
  
  // Safely format timestamp
  let timeString = 'Just now';
  try {
    const timestamp = message.timestamp ? new Date(message.timestamp) : null;
    if (timestamp && !isNaN(timestamp.getTime())) {
      timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (message.timestamp) {
      // If timestamp is string, try to parse it
      const parsedDate = new Date(message.timestamp as any);
      if (!isNaN(parsedDate.getTime())) {
        timeString = parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
  } catch (e) {
    timeString = 'Just now';
  }
  
  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
          {displayContent || '...'} {/* Fallback if content is empty */}
        </Text>
        <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>
          {timeString}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    marginHorizontal: 10,
    maxWidth: '85%',
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
    maxWidth: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    border: 1,
    borderColor: '#E0E0E0',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownText: {
    color: 'white',
  },
  otherText: {
    color: '#333',
  },
  time: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherTime: {
    color: '#A0A0A0',
  },
});

export default ChatBubble;