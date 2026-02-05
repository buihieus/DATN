import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ChatBot from '../../components/ChatBot';

const ChatBotScreen = () => {
  const [isChatBotVisible, setIsChatBotVisible] = useState(true);

  const handleClose = () => {
    setIsChatBotVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat với Trợ lý AI</Text>
      <Text style={styles.description}>Hỏi tôi bất cứ điều gì về phòng trọ!</Text>
      
      <ChatBot 
        visible={isChatBotVisible} 
        onClose={handleClose} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
});

export default ChatBotScreen;