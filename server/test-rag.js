// Simple test to verify RAG chatbot functionality
const { askQuestion } = require('./src/utils/Chatbot/chatbot');

async function testRAGChatbot() {
    console.log('Testing RAG Chatbot...');
    
    try {
        // Test with a simple query
        const response = await askQuestion("Tôi đang tìm phòng trọ ở Hà Nội giá dưới 3 triệu");
        console.log('Response:', response);
    } catch (error) {
        console.error('Error testing RAG chatbot:', error);
    }
}

// Run the test
testRAGChatbot();