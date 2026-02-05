import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={message}
        onChangeText={setMessage}
        placeholder="Nhập tin nhắn..."
        multiline
        textAlignVertical="top"
        maxLength={500}
        editable={!disabled}
      />
      <TouchableOpacity 
        style={styles.sendButton} 
        onPress={handleSend} 
        disabled={!message.trim() || disabled}
      >
        <Ionicons 
          name="send" 
          size={24} 
          color={message.trim() && !disabled ? "#007AFF" : "#C0C0C0"} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    maxHeight: 120,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
  },
});

export default ChatInput;