const VectorStore = require('./vectorStore');

class DocumentIndexer {
    constructor() {
        this.vectorStore = new VectorStore();
    }

    async indexAllPosts() {
        return await this.vectorStore.indexPosts();
    }

    async indexNewPost(post) {
        // For now, we'll re-index all posts when a new one is added
        // In production, you might want to add just the new post to the vector store
        return await this.indexAllPosts();
    }
}

module.exports = DocumentIndexer;