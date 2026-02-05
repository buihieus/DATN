const VectorStore = require('./vectorStore');

class RetrievalSystem {
    constructor() {
        this.vectorStore = new VectorStore();
    }

    async retrieveRelevantDocuments(query, topK = 5) {
        try {
            const relevantPosts = await this.vectorStore.search(query, topK);
            return relevantPosts;
        } catch (error) {
            console.error('Error in retrieval system:', error);
            return [];
        }
    }

    formatPostsForPrompt(posts) {
        if (!posts || posts.length === 0) {
            return "Không tìm thấy bài đăng nào phù hợp.";
        }

        return posts.map(post => 
            `ID: ${post._id}, Tiêu đề: ${post.title}, Giá: ${post.price}, Địa điểm: ${post.location}, Diện tích: ${post.area} m², Mô tả: ${post.description.substring(0, 100)}...`
        ).join('\n');
    }
}

module.exports = RetrievalSystem;