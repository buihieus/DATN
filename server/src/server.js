const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
cors: {
        origin: [
            process.env.CLIENT_URL,
            'http://localhost:19006', // Expo development
            'http://localhost:19000', // Expo development
            'exp://localhost:19000', // Expo development
            'exp://127.0.0.1:19000', // Expo development
            'http://localhost:3000', // Local development
            'http://127.0.0.1:3000', // Local development
            'http://192.168.48.1:3000', // Mobile app development
            'http://192.168.48.1:19000', // Mobile app Expo development
            ...process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [] // Thêm CLIENT_URL nếu có
        ],
        credentials: true
    },
    transports: ['websocket', 'polling'], // Allow both websocket and polling for better mobile compatibility
});

global.io = io;

require('dotenv').config();

const bodyParser = require('body-parser');
const cookiesParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const cookie = require('cookie');

// Cấu hình CORS để hỗ trợ cả web và mobile app
const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép requests không có origin (như mobile apps hoặc curl requests)
        if (!origin) return callback(null, true);

        // Nếu có origin, kiểm tra có được phép hay không
        const allowedOrigins = [
            process.env.CLIENT_URL,
            'http://localhost:19006', // Expo development
            'http://localhost:19000', // Expo development
            'exp://localhost:19000', // Expo development
            'exp://127.0.0.1:19000', // Expo development
            'http://localhost:3000', // Local development
            'http://127.0.0.1:3000', // Local development
            //
            'http://192.168.48.1:3000', // Mobile app development
            'http://192.168.48.1:19000', // Mobile app Expo development
            ...process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [] // Thêm CLIENT_URL nếu có
        ];

        const isAllowed = allowedOrigins.includes(origin);
        callback(null, isAllowed);
    },
    credentials: true
};

app.use(cors(corsOptions));

const connectDB = require('./config/ConnectDB');
const routes = require('./routes/index');
const { verifyToken } = require('./services/tokenSevices');
const modelMessager = require('./models/Messager.model');
const { askQuestion, reindexPosts } = require('./utils/Chatbot/chatbot');
const { AiSearch } = require('./utils/AISearch/AISearch');
const socketServices = require('./services/socketServices');

// Import và khởi động dịch vụ kiểm tra bài đăng hết hạn
const PostExpirationService = require('./services/postExpiration.service');

app.use(express.static(path.join(__dirname, '../src')));
app.use(cookiesParser());

// Configure body parsing with increased size limits for image uploads
// Using express's built-in body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

routes(app);


app.use((req, res, next) => {
    req.io = io;
    next();
});

global.io.on('connect', socketServices.connection);



app.post('/chat', async (req, res) => {
    const { question } = req.body;
    const data = await askQuestion(question);
    return res.status(200).json(data);
});

app.get('/ai-search', async (req, res) => {
    const { question } = req.query;
    console.log('question', question);
    const data = await AiSearch(question);
    return res.status(200).json(data);
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server',
    });
});

app.post('/api/add-search', (req, res) => {
    const { title } = req.body;
    const index = hotSearch.findIndex((item) => item.title === title);
    if (index !== -1) {
        hotSearch[index].count++;
    } else {
        hotSearch.push({ title, count: 1 });
    }
    return res.status(200).json({ message: 'Thêm từ khóa thành công' });
});
connectDB().then(() => {

    // Initialize RAG system by indexing all posts on startup
    console.log('Initializing RAG system...');
    reindexPosts('api').then(count => {  // Changed to use API as source
        console.log(`RAG system initialized with ${count.indexed_count} posts from ${count.source}`);
    }).catch(err => {
        console.error('Error initializing RAG system:', err);
    });

    // Khởi động dịch vụ kiểm tra bài đăng hết hạn
    // Kiểm tra mỗi 30 phút một lần
    PostExpirationService.startExpirationCheck(30);

    server.listen(port, '0.0.0.0', () => {
        console.log(`Example app listening on port ${port}`);
    });

});