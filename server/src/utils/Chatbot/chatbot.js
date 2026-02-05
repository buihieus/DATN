const axios = require('axios');
require('dotenv').config();

const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:8000';

class ChatbotService {
    constructor() {
        this.baseURL = CHATBOT_SERVICE_URL;
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 seconds timeout
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }

    async askQuestion(question, userId = null, sessionId = null) {
        try {
            const response = await this.axiosInstance.post('/chat', {
                question,
                user_id: userId,
                session_id: sessionId
            });

            return response.data;
        } catch (error) {
            console.error('Error calling chatbot service:', error.message);
            
            if (error.response) {
                // Server responded with error status
                console.error('Chatbot service error:', error.response.status, error.response.data);
                throw new Error(`Chatbot service error: ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
                // Request was made but no response received
                console.error('No response from chatbot service:', error.request);
                throw new Error('No response from chatbot service. Please check if the service is running.');
            } else {
                // Other error
                console.error('Error calling chatbot service:', error.message);
                throw new Error(`Error calling chatbot service: ${error.message}`);
            }
        }
    }

    async reindexPosts(source = 'api') {
        try {
            const response = await this.axiosInstance.post('/reindex', {
                force: true,
                source: source  // Can be 'database' or 'api'
            });

            return response.data;
        } catch (error) {
            console.error('Error reindexing posts in chatbot service:', error.message);

            if (error.response) {
                console.error('Reindex service error:', error.response.status, error.response.data);
            } else if (error.request) {
                console.error('No response from reindex service:', error.request);
            }

            throw error;
        }
    }

    async healthCheck() {
        try {
            const response = await this.axiosInstance.get('/health');
            return response.data;
        } catch (error) {
            console.error('Chatbot service health check failed:', error.message);
            return { status: 'unhealthy', error: error.message };
        }
    }
}

// Create a singleton instance
const chatbotService = new ChatbotService();

// Export functions for use in the application
module.exports = {
    askQuestion: async (question, userId = null, sessionId = null) => {
        return await chatbotService.askQuestion(question, userId, sessionId);
    },
    reindexPosts: async () => {
        return await chatbotService.reindexPosts();
    },
    healthCheck: async () => {
        return await chatbotService.healthCheck();
    },
    // For direct access to the service instance if needed
    chatbotService
};