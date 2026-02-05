import { useEffect } from 'react';
import { useChatBotStore } from '../store/useChatBotStore';

export const useChatBot = () => {
  const { 
    messages, 
    isLoading, 
    error, 
    sendUserMessage, 
    clearMessages, 
    setIsLoading, 
    setError 
  } = useChatBotStore();

  // Load initial messages from storage or start fresh
  useEffect(() => {
    // In a real implementation, you might load previous conversations from storage
    // For now, we'll start with an empty chat
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendUserMessage,
    clearMessages,
    setIsLoading,
    setError,
  };
};