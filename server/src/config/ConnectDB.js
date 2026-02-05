// const Mongoose = require('mongoose'); dung cho mongodb v5 tro xuong
// require('dotenv').config();

// const connectDB = async () => {
//     try {
//         await Mongoose.connect(process.env.CONNECT_DB, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         console.log('MongoDB connected');
//     } catch (error) {
//         console.error('Failed to connect to MongoDB', error);
//     }
// };

// module.exports = connectDB;

const Mongoose = require('mongoose'); // dung cho môngdb v6 tro len
require('dotenv').config();

const connectDB = async () => {
    try {
        await Mongoose.connect(process.env.CONNECT_DB);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
    }
};

module.exports = connectDB;
