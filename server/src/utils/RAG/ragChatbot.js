const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ObjectId } = require('mongoose').Types;
const RetrievalSystem = require('./retrievalSystem');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const modelPost = require('../../models/post.model');

// Initialize the retrieval system
const retrievalSystem = new RetrievalSystem();

async function askQuestion(question) {
    try {
        // Retrieve relevant posts based on the user's question using RAG
        const relevantPosts = await retrievalSystem.retrieveRelevantDocuments(question, 10);
        const postDataPreview = retrievalSystem.formatPostsForPrompt(relevantPosts);

        // Create a more context-aware prompt for the AI
        const prompt = `
        Bạn là một trợ lý chuyên nghiệp hỗ trợ tìm phòng trọ. Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng một cách tự nhiên và thân thiện dựa trên các bài đăng phòng trọ được cung cấp dưới đây.

        Dưới đây là một số bài đăng phòng trọ liên quan đến câu hỏi của người dùng:
        ${postDataPreview}

        Nếu người dùng yêu cầu tìm phòng trọ hoặc có nhu cầu tìm nơi ở, hãy trả lời theo định dạng sau:
        __SHOW_ROOMS__:{\"message\": \"Dưới đây là một số phòng trọ phù hợp với yêu cầu của bạn:\", \"roomIds\": [\"id1\", \"id2\", ...]}
        Trong đó, \"roomIds\" là mảng ID của các bài đăng phù hợp nhất với yêu cầu của người dùng dựa trên thông tin bạn có. Nếu không tìm được bài đăng nào phù hợp, hãy trả lời tự nhiên.

        Nếu người dùng không yêu cầu tìm phòng trọ, hãy trả lời một cách tự nhiên và thân thiện như bình thường.

        Câu hỏi của khách hàng: ${question}
        `;

        const result = await model.generateContent(prompt);
        let answer = result.response.text();

        // Check if Gemini requests to show rooms
        const showRoomsPrefix = "__SHOW_ROOMS__:";
        let trimmedAnswer = answer.trim();

        const showRoomsIndex = trimmedAnswer.indexOf(showRoomsPrefix);
        if (showRoomsIndex !== -1) {
            try {
                const textBeforeToken = trimmedAnswer.substring(0, showRoomsIndex).trim();
                const jsonString = trimmedAnswer.substring(showRoomsIndex + showRoomsPrefix.length).trim();
                const showRoomsData = JSON.parse(jsonString);

                const roomIds = showRoomsData.roomIds || [];
                const roomObjectIds = roomIds.map(id => new ObjectId(id));
                const rooms = await modelPost.find({ '_id': { $in: roomObjectIds } });

                return {
                    type: 'SHOW_ROOMS',
                    message: textBeforeToken ? textBeforeToken + ' ' + showRoomsData.message : showRoomsData.message,
                    rooms: rooms
                };
            } catch (parseError) {
                console.error("Lỗi khi parse dữ liệu phòng trọ từ Gemini:", parseError);
                return answer;
            }
        } else {
            return answer;
        }
    } catch (error) {
        console.error("Lỗi trong hàm askQuestion:", error);
        return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.";
    }
}

// Function to re-index all posts (to be called when new posts are added)
async function reindexPosts() {
    try {
        const count = await retrievalSystem.vectorStore.indexPosts();
        return count;
    } catch (error) {
        console.error("Lỗi khi re-index posts:", error);
        return 0;
    }
}

module.exports = { askQuestion, reindexPosts };