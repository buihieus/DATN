import { create } from 'zustand';
import { ChatbotMessage, chatbotService } from '../services/chatbotService';

interface ChatBotStore {
  messages: ChatbotMessage[];
  isLoading: boolean;
  error: string | null;
  addMessage: (message: ChatbotMessage) => void;
  sendUserMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatBotStore = create<ChatBotStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  
  addMessage: (message) => 
    set((state) => ({
      messages: [...state.messages, message],
    })),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearMessages: () => set({ messages: [], error: null }),
  
  sendUserMessage: async (message) => {
    const { addMessage, setIsLoading, setError } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to the chat
      const userMessage: ChatbotMessage = {
        _id: Date.now().toString(),
        senderId: 'user',
        content: message,
        timestamp: new Date(),
        sender: 'user',
      };
      
      addMessage(userMessage);
      
      // Get response from chatbot
      const response = await chatbotService.sendMessage(message);
      
      // Add bot response to the chat
      const botMessage: ChatbotMessage = {
        _id: (Date.now() + 1).toString(),
        senderId: 'assistant',
        content: response.metadata,
        timestamp: new Date(),
        sender: 'assistant',
      };
      
      addMessage(botMessage);
    } catch (error: any) {
      console.error('Error sending message to chatbot:', error);
      setError(error.message || 'Có lỗi xảy ra khi gửi tin nhắn');
    } finally {
      setIsLoading(false);
    }
  },
}));