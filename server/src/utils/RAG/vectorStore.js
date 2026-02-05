const modelPost = require('../../models/post.model');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

class VectorStore {
    constructor() {
        this.posts = [];
        this.embeddings = [];
    }

    // Simple text similarity function using cosine similarity
    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, val, idx) => sum + val * vecB[idx], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
        
        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        return dotProduct / (magnitudeA * magnitudeB);
    }

    // Simple embedding generation using Gemini's text embedding capabilities
    async generateEmbedding(text) {
        try {
            // Using a simple approach since Gemini doesn't have a direct embedding API in this version
            // We'll use a prompt to generate a numeric representation of the text
            const prompt = `
            Chuyển đổi văn bản sau thành một mảng số gồm 10 số thực, mỗi số biểu diễn một khía cạnh của văn bản.
            Văn bản: "${text}"
            Chỉ trả về mảng JSON với 10 số thực, không có giải thích:
            `;

            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const result = await model.generateContent(prompt);
            let response = result.response.text();
            
            // Clean response
            response = response.replace(/```json|```/g, '').trim();
            
            let embedding = JSON.parse(response);
            
            // Ensure it's an array of 10 numbers
            if (!Array.isArray(embedding) || embedding.length !== 10) {
                // Fallback to a simple hash-based embedding
                embedding = this.simpleTextEmbedding(text);
            }
            
            return embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            return this.simpleTextEmbedding(text);
        }
    }

    // Simple fallback embedding based on text characteristics
    simpleTextEmbedding(text) {
        const normalizedText = text.toLowerCase();
        const embedding = new Array(10).fill(0);
        
        // Character-based features
        embedding[0] = normalizedText.length / 1000; // Length feature
        
        // Keyword-based features
        const keywords = ['phong', 'tro', 'gia', 'dia diem', 'nha', 'o', 'thue', 'cho thue', 'can ho', 'nguyen can'];
        for (let i = 0; i < keywords.length && i < 5; i++) {
            embedding[i + 1] = (normalizedText.match(new RegExp(keywords[i], 'g')) || []).length;
        }
        
        // Price/number features
        const numbers = normalizedText.match(/\d+/g) || [];
        embedding[6] = numbers.length > 0 ? numbers.reduce((sum, num) => sum + parseInt(num), 0) / numbers.length : 0;
        
        // Location features
        const locations = ['ha noi', 'hcm', 'da nang', 'hue', 'can tho', 'hue'];
        for (let i = 0; i < locations.length && i + 7 < 10; i++) {
            embedding[i + 7] = (normalizedText.match(new RegExp(locations[i], 'g')) || []).length;
        }

        return embedding;
    }

    // Index posts with their embeddings
    async indexPosts() {
        try {
            const posts = await modelPost.find({ status: 'active' });
            this.posts = [];
            this.embeddings = [];
            
            for (const post of posts) {
                // Create a combined text representation of the post
                const postText = `${post.title} ${post.description} ${post.location} ${post.price} ${post.area} ${JSON.stringify(post.options)}`;
                
                const embedding = await this.generateEmbedding(postText);
                
                this.posts.push({
                    _id: post._id.toString(),
                    title: post.title,
                    description: post.description,
                    location: post.location,
                    price: post.price,
                    area: post.area,
                    options: post.options,
                    phone: post.phone,
                    username: post.username,
                    category: post.category,
                    images: post.images,
                    userId: post.userId
                });
                
                this.embeddings.push(embedding);
            }
            
            console.log(`Indexed ${this.posts.length} posts`);
            return this.posts.length;
        } catch (error) {
            console.error('Error indexing posts:', error);
            return 0;
        }
    }

    // Search for similar posts based on query
    async search(query, topK = 5) {
        try {
            if (this.posts.length === 0) {
                await this.indexPosts();
            }
            
            const queryEmbedding = await this.generateEmbedding(query);
            const similarities = this.embeddings.map((embedding, idx) => ({
                similarity: this.cosineSimilarity(queryEmbedding, embedding),
                post: this.posts[idx]
            }));
            
            // Sort by similarity and return top K results
            similarities.sort((a, b) => b.similarity - a.similarity);
            return similarities.slice(0, topK).map(item => ({
                ...item.post,
                similarity: item.similarity
            }));
        } catch (error) {
            console.error('Error searching posts:', error);
            return [];
        }
    }
}

module.exports = VectorStore;