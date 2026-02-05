const mongoose = require('mongoose');
const modelUser = require('../models/users.model');
const modelApiKey = require('../models/apiKey.model');
const modelRechargeUser = require('../models/RechargeUser.model');
const modelPost = require('../models/post.model');
const modelKeyWordSearch = require('../models/keyWordSearch.model');
const modelOtp = require('../models/otp.model');

const sendMailForgotPassword = require('../utils/SendMail/sendMailForgotPassword');
const { BadRequestError } = require('../core/error.response');
const { createApiKey, createToken, createRefreshToken, verifyToken } = require('../services/tokenSevices');
const { Created, OK } = require('../core/success.response');

const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const { jwtDecode } = require('jwt-decode');

const { AiSearchKeyword } = require('../utils/AISearch/AISearch');

class controllerUsers {
    async register(req, res) {
        const { fullName, email, password, phone, address } = req.body;

        if (!fullName || !email || !password || !phone) {
            throw new BadRequestError('Vui lòng nhập đày đủ thông tin');
        }
        const user = await modelUser.findOne({ email });
        if (user) {
            throw new BadRequestError('Người dùng đã tồn tại');
        } else {
            const saltRounds = 10;
            const salt = bcrypt.genSaltSync(saltRounds);
            const passwordHash = bcrypt.hashSync(password, salt);
            const newUser = await modelUser.create({
                fullName,
                email,
                password: passwordHash,
                typeLogin: 'email',
                phone,
                address: address || '', // Thêm trường address, mặc định là chuỗi rỗng nếu không có
                avatar: '', // Thêm trường avatar mặc định là chuỗi rỗng
            });
            await newUser.save();
            await createApiKey(newUser._id);
            const token = await createToken({ id: newUser._id });
            const refreshToken = await createRefreshToken({ id: newUser._id });
            // Check if we're in development or mobile context
            const isDevelopment = process.env.NODE_ENV !== 'production';
            const secureCookie = !isDevelopment; // Set secure: true only in production

            res.cookie('token', token, {
                httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: secureCookie, // Chỉ gửi trên HTTPS trong production
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 24 * 60 * 60 * 1000, // 24 giờ
            });

            res.cookie('logged', 1, {
                httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: secureCookie, // Chỉ gửi trên HTTPS trong production
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });

            // Đặt cookie HTTP-Only cho refreshToken (tùy chọn)
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: secureCookie,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            new Created({ message: 'Đăng ký thành công', metadata: { token, refreshToken } }).send(res);
        }
    }
    async login(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }
        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        if (user.typeLogin === 'google') {
            throw new BadRequestError('Tài khoản đăng nhập bằng google');
        }

        const checkPassword = bcrypt.compareSync(password, user.password);
        if (!checkPassword) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        await createApiKey(user._id);
        const token = await createToken({ id: user._id });
        const refreshToken = await createRefreshToken({ id: user._id });

        // Check if we're in development or mobile context
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const secureCookie = !isDevelopment; // Set secure: true only in production

        res.cookie('token', token, {
            httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
            secure: secureCookie, // Chỉ gửi trên HTTPS trong production
            sameSite: 'Strict', // Chống tấn công CSRF
            maxAge: 24 * 60 * 60 * 1000, // 24 giờ
        });

        res.cookie('logged', 1, {
            httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
            secure: secureCookie, // Chỉ gửi trên HTTPS trong production
            sameSite: 'Strict', // Chống tấn công CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        // Đặt cookie HTTP-Only cho refreshToken (tùy chọn)
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        new OK({ message: 'Đăng nhập thành công', metadata: { token, refreshToken } }).send(res);
    }

    async loginGoogle(req, res) {
        const { credential } = req.body;
        const dataToken = jwtDecode(credential);
        const user = await modelUser.findOne({ email: dataToken.email });
        if (user) {
            await createApiKey(user._id);
            const token = await createToken({ id: user._id });
            const refreshToken = await createRefreshToken({ id: user._id });

            // Check if we're in development or mobile context
            const isDevelopment = process.env.NODE_ENV !== 'production';
            const secureCookie = !isDevelopment; // Set secure: true only in production

            res.cookie('token', token, {
                httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: secureCookie, // Chỉ gửi trên HTTPS trong production
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 24 * 60 * 60 * 1000, // 24 giờ
            });
            res.cookie('logged', 1, {
                httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: secureCookie, // Chỉ gửi trên HTTPS trong production
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: secureCookie,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            new OK({ message: 'Đăng nhập thành công', metadata: { token, refreshToken } }).send(res);
        } else {
            const newUser = await modelUser.create({
                fullName: dataToken.name,
                email: dataToken.email,
                typeLogin: 'google',
                address: '', // Thêm trường address mặc định là chuỗi rỗng
                avatar: '', // Thêm trường avatar mặc định là chuỗi rỗng
            });
            await newUser.save();
            await createApiKey(newUser._id);
            const token = await createToken({ id: newUser._id });
            const refreshToken = await createRefreshToken({ id: newUser._id });

            // Check if we're in development or mobile context
            const isDevelopment = process.env.NODE_ENV !== 'production';
            const secureCookie = !isDevelopment; // Set secure: true only in production

            res.cookie('token', token, {
                httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: secureCookie, // Chỉ gửi trên HTTPS trong production
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 24 * 60 * 60 * 1000, // 24 giờ
            });
            res.cookie('logged', 1, {
                httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: secureCookie, // Chỉ gửi trên HTTPS trong production
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: secureCookie,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            new OK({ message: 'Đăng nhập thành công', metadata: { token, refreshToken } }).send(res);
        }
    }

    async authUser(req, res) {
        const user = req.user;
        const findUser = await modelUser.findOne({ _id: user.id });
        if (!findUser) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        const userString = JSON.stringify(findUser);
        const auth = CryptoJS.AES.encrypt(userString, process.env.SECRET_CRYPTO).toString();
        new OK({ message: 'success', metadata: { auth } }).send(res);
    }

    async logout(req, res) {
        const user = req.user;
        // Chỉ xóa API key cho phiên hiện tại, không xóa tất cả API key của người dùng
        // Vì người dùng có thể đăng nhập từ nhiều thiết bị
        const userToken = req.headers.authorization?.substring(7) || req.cookies.token;

        // Xóa API key tương ứng với phiên hiện tại
        // Trong hệ thống hiện tại, mỗi khi đăng nhập sẽ tạo API key mới
        // Nên đăng xuất sẽ không xóa API key để đảm bảo các phiên khác không bị ảnh hưởng
        // Nhưng sẽ vẫn xử lý xóa cookie và phản hồi thành công

        // Xóa cookie nếu tồn tại (cho web client)
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        res.clearCookie('logged');
        res.clearCookie('tokenResetPassword'); // Xóa cả cookie reset password nếu có

        new OK({ message: 'Đăng xuất thành công' }).send(res);
    }

    async refreshToken(req, res) {
        // Trích xuất refresh token từ cả cookie và header
        let refreshToken;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            // Nếu có token trong header, giả định rằng đây là refresh token
            refreshToken = req.headers.authorization.substring(7);
        } else {
            refreshToken = req.cookies.refreshToken;
        }

        if (!refreshToken) {
            throw new BadRequestError('Refresh token không tồn tại');
        }

        try {
            const decoded = await verifyToken(refreshToken);

            const user = await modelUser.findById(decoded.id);
            if (!user) {
                throw new BadRequestError('Người dùng không tồn tại');
            }

            // Tạo token mới
            const token = await createToken({ id: user._id });
            const newRefreshToken = await createRefreshToken({ id: user._id });

            // Cập nhật refresh token trong cookie nếu sử dụng cookie
            const isDevelopment = process.env.NODE_ENV !== 'production';
            const secureCookie = !isDevelopment; // Set secure: true only in production

            res.cookie('token', token, {
                httpOnly: true,
                secure: secureCookie,
                sameSite: 'Strict',
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });

            // Cập nhật refresh token
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: secureCookie,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            // Trả token mới trong response metadata
            new OK({
                message: 'Refresh token thành công',
                metadata: {
                    token,
                    refreshToken: newRefreshToken // Trả lại refresh token mới
                }
            }).send(res);
        } catch (error) {
            // Nếu refresh token không hợp lệ, xóa cookie và trả về lỗi
            res.clearCookie('token');
            res.clearCookie('refreshToken');
            res.clearCookie('logged');

            throw new BadRequestError('Refresh token không hợp lệ hoặc đã hết hạn');
        }
    }

    async getAdminStats(req, res) {
        try {
            // Get total users count
            const totalUsers = await modelUser.countDocuments();

            // Get new users in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const newUsers = await modelUser.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
            });

            // Calculate user growth percentage
            const previousPeriodUsers = await modelUser.countDocuments({
                createdAt: {
                    $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                    $lt: thirtyDaysAgo,
                },
            });
            const userGrowth = previousPeriodUsers > 0 ? ((newUsers / previousPeriodUsers) * 100).toFixed(1) : 100;

            // Get total posts count
            const totalPosts = await modelPost.countDocuments();

            // Get active posts count
            const activePosts = await modelPost.countDocuments({ status: 'active' });

            // Get new posts in the last 30 days
            const newPosts = await modelPost.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
            });

            // Calculate post growth percentage
            const previousPeriodPosts = await modelPost.countDocuments({
                createdAt: {
                    $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                    $lt: thirtyDaysAgo,
                },
            });
            const postGrowth = previousPeriodPosts > 0 ? ((newPosts / previousPeriodPosts) * 100).toFixed(1) : 100;

            // Get total transactions and revenue
            const totalTransactions = await modelRechargeUser.countDocuments();
            const totalRevenue = await modelRechargeUser.aggregate([
                { $match: { status: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Get transactions in the last 30 days
            const recentTransactions = await modelRechargeUser.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
            });

            // Calculate transaction growth percentage
            const previousPeriodTransactions = await modelRechargeUser.countDocuments({
                createdAt: {
                    $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                    $lt: thirtyDaysAgo,
                },
            });
            const transactionGrowth =
                previousPeriodTransactions > 0
                    ? ((recentTransactions / previousPeriodTransactions) * 100).toFixed(1)
                    : 100;

            // Get revenue in the last 30 days
            const recentRevenue = await modelRechargeUser.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Calculate revenue growth percentage
            const previousPeriodRevenue = await modelRechargeUser.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                            $lt: thirtyDaysAgo,
                        },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            const revenueGrowth =
                previousPeriodRevenue.length > 0 && previousPeriodRevenue[0].total > 0
                    ? (
                          ((recentRevenue.length > 0 ? recentRevenue[0].total : 0) / previousPeriodRevenue[0].total) *
                          100
                      ).toFixed(1)
                    : 100;

            // Get posts data for the last 7 days
            const last7DaysArray = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            }).reverse();

            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate() - 7);

            const postsData = await modelPost.aggregate([
                {
                    $match: {
                        createdAt: { $gte: last7Days },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        posts: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            // Map posts data to ensure all 7 days are included
            const formattedPostsData = last7DaysArray.map((date) => {
                const dayData = postsData.find((item) => item._id === date);
                return {
                    date: date,
                    posts: dayData ? dayData.posts : 0,
                };
            });

            // Get recent transactions
            const recentTransactionsList = await modelRechargeUser
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('userId', 'fullName');

            const formattedRecentTransactions = recentTransactionsList.map((transaction) => ({
                _id: transaction._id.toString(),
                userId: transaction.userId ? (transaction.userId._id || transaction.userId) : transaction.userId,
                username: transaction.userId?.fullName || 'Unknown User',
                amount: transaction.amount,
                typePayment: transaction.typePayment,
                status: transaction.status,
                createdAt: transaction.createdAt,
            }));

            // Get top users by post count - FIXED: Filter out invalid IDs before fetching user details
            const topUsers = await modelPost.aggregate([
                {
                    $group: {
                        _id: '$userId',
                        posts: { $sum: 1 },
                    },
                },
                { $sort: { posts: -1 } },
                { $limit: 5 },
            ]);

            // Filter out invalid user IDs before fetching user details
            const validTopUsers = topUsers.filter(user => user._id && user._id !== 'admin' && mongoose.Types.ObjectId.isValid(user._id));

            const topUsersWithDetails = await Promise.all(
                validTopUsers.map(async (user) => {
                    try {
                        const userDetails = await modelUser.findById(user._id);
                        return {
                            id: user._id,
                            name: userDetails ? userDetails.fullName : 'Unknown User',
                            posts: user.posts,
                            avatar: userDetails ? userDetails.avatar : null,
                        };
                    } catch (err) {
                        console.error('Error fetching user details:', err);
                        return {
                            id: user._id,
                            name: 'Unknown User',
                            posts: user.posts,
                            avatar: null,
                        };
                    }
                }),
            );

            new OK({
                message: 'Lấy thống kê thành công',
                metadata: {
                    // User statistics
                    totalUsers,
                    newUsers,
                    userGrowth: parseFloat(userGrowth),

                    // Post statistics
                    totalPosts,
                    activePosts,
                    newPosts,
                    postGrowth: parseFloat(postGrowth),

                    // Transaction statistics
                    totalTransactions,
                    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
                    recentTransactions,
                    transactionGrowth: parseFloat(transactionGrowth),

                    // Revenue statistics
                    recentRevenue: recentRevenue.length > 0 ? recentRevenue[0].total : 0,
                    revenueGrowth: parseFloat(revenueGrowth),

                    // Posts data for chart
                    postsData: formattedPostsData,

                    // Recent transactions
                    recentTransactions: formattedRecentTransactions,

                    // Top users
                    topUsers: topUsersWithDetails,
                },
            }).send(res);
        } catch (error) {
            console.error('Error in getAdminStats:', error);
            throw new BadRequestError('Lỗi khi lấy thống kê');
        }
    }

    async changePassword(req, res) {
        const { id } = req.user;
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (!oldPassword || !newPassword || !confirmPassword) {
            throw new BadRequestError('Vui lòng nhập đày đủ thông tin');
        }

        if (newPassword !== confirmPassword) {
            throw new BadRequestError('Mật khẩu không khớp');
        }

        const user = await modelUser.findById(id);
        if (!user) {
            throw new BadRequestError('Không tìm thấy người dùng');
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestError('Mật khẩu cũ không chính xác');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();
        new OK({ message: 'Đổi mật khẩu thành công' }).send(res);
    }

    async getRechargeUser(req, res) {
        const { id } = req.user;
        const rechargeUser = await modelRechargeUser.find({ userId: id });
        new OK({ message: 'Lấy thông tin nạp tiền thành công', metadata: rechargeUser }).send(res);
    }

    async updateUser(req, res) {
        const { id } = req.user;
        const { fullName, phone, email, address, avatar } = req.body;
        const user = await modelUser.findByIdAndUpdate(id, { fullName, phone, email, address, avatar }, { new: true });
        new OK({ message: 'Cập nhật thông tin thành công', metadata: user }).send(res);
    }

    async updateUserByAdmin(req, res) {
        const { id } = req.params; // Get user ID from URL params
        const { fullName, phone, email, address, avatar, isAdmin } = req.body; // Include isAdmin in the update

        // Prepare update object without undefined values
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (address !== undefined) updateData.address = address;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (isAdmin !== undefined) updateData.isAdmin = isAdmin; // Allow admin to set isAdmin status

        const user = await modelUser.findByIdAndUpdate(
            id,
            updateData,
            { new: true } // Return updated document
        );

        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        new OK({ message: 'Cập nhật thông tin người dùng thành công', metadata: user }).send(res);
    }

    async getUsers(req, res) {
        // Extract search parameters from query
        const { search } = req.query;

        // Build query object
        let query = {};
        if (search) {
            // Search by fullName or email using regex for partial matching
            query = {
                $or: [
                    { fullName: { $regex: search, $options: 'i' } }, // Case insensitive search
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const dataUser = await modelUser.find(query);
        const data = await Promise.all(
            dataUser.map(async (user) => {
                const post = await modelPost.find({ userId: user._id, status: 'active' });
                const totalPost = post.length;
                const totalSpent = post.reduce((sum, post) => sum + post.price, 0);
                return { user, totalPost, totalSpent };
            }),
        );

        new OK({ message: 'Lấy danh sách người dùng thành công', metadata: data }).send(res);
    }

    async getRechargeStats(req, res) {
        try {
            // Extract search parameters from query
            const { fullName, email, createdAt, createdAtRange } = req.query;

            // Build query object
            let query = {};

            // Add search conditions if provided
            if (fullName) {
                // Search in user's fullName
                const users = await modelUser.find({
                    fullName: { $regex: fullName, $options: 'i' }
                });
                const userIds = users.map(user => user._id);
                if (userIds.length > 0) {
                    query.userId = { $in: userIds };
                } else {
                    // If no users match, return empty results
                    query.userId = { $in: [] };
                }
            }

            if (email) {
                // Search in user's email
                const users = await modelUser.find({
                    email: { $regex: email, $options: 'i' }
                });
                const userIds = users.map(user => user._id);
                if (userIds.length > 0) {
                    query.userId = { $in: userIds };
                } else {
                    // If no users match, return empty results
                    query.userId = { $in: [] };
                }
            }

            if (createdAt) {
                // Parse the date and add to query
                const date = new Date(createdAt);
                if (!isNaN(date.getTime())) {
                    // Match transactions created on the specific date
                    query.createdAt = {
                        $gte: new Date(date.setHours(0, 0, 0, 0)),
                        $lt: new Date(date.setHours(23, 59, 59, 999))
                    };
                }
            }

            if (createdAtRange) {
                // Parse date range (assuming format is "startDate,endDate")
                const [startDateStr, endDateStr] = createdAtRange.split(',');
                if (startDateStr && endDateStr) {
                    const startDate = new Date(startDateStr);
                    const endDate = new Date(endDateStr);

                    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                        query.createdAt = {
                            $gte: new Date(startDate.setHours(0, 0, 0, 0)),
                            $lte: new Date(endDate.setHours(23, 59, 59, 999))
                        };
                    }
                }
            }

            // Get total transactions and revenue based on the query
            const totalTransactions = await modelRechargeUser.countDocuments(query);
            const totalRevenue = await modelRechargeUser.aggregate([
                { $match: { ...query, status: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Get recent transactions (last 7 days) - only for stats calculation
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentTransactions = await modelRechargeUser.countDocuments({
                ...query,
                createdAt: { $gte: sevenDaysAgo },
            });

            // Get previous period transactions (7-14 days ago)
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const previousPeriodTransactions = await modelRechargeUser.countDocuments({
                ...query,
                createdAt: {
                    $gte: fourteenDaysAgo,
                    $lt: sevenDaysAgo,
                },
            });

            // Calculate transaction growth
            const transactionGrowth =
                previousPeriodTransactions > 0
                    ? ((recentTransactions / previousPeriodTransactions) * 100 - 100).toFixed(1)
                    : 100;

            // Get recent revenue (last 7 days)
            const recentRevenue = await modelRechargeUser.aggregate([
                {
                    $match: {
                        ...query,
                        createdAt: { $gte: sevenDaysAgo },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Get previous period revenue (7-14 days ago)
            const previousPeriodRevenue = await modelRechargeUser.aggregate([
                {
                    $match: {
                        ...query,
                        createdAt: {
                            $gte: fourteenDaysAgo,
                            $lt: sevenDaysAgo,
                        },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Calculate revenue growth
            const revenueGrowth =
                previousPeriodRevenue.length > 0 && previousPeriodRevenue[0].total > 0
                    ? (
                          ((recentRevenue.length > 0 ? recentRevenue[0].total : 0) / previousPeriodRevenue[0].total) *
                              100 -
                          100
                      ).toFixed(1)
                    : 100;

            // Get recent transactions list with user details based on the search query
            const recentTransactionsList = await modelRechargeUser
                .find(query)
                .sort({ createdAt: -1 })
                .limit(50)
                .populate('userId', 'fullName email phone');

            const formattedTransactions = recentTransactionsList.map((transaction) => ({
                key: transaction._id.toString(),
                username: transaction.userId?.fullName || 'Unknown User',
                email: transaction.userId?.email || 'N/A',
                amount: transaction.amount,
                typePayment: transaction.typePayment,
                status: transaction.status,
                createdAt: transaction.createdAt,
            }));

            new OK({
                message: 'Lấy thống kê nạp tiền thành công',
                metadata: {
                    totalTransactions,
                    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
                    recentTransactions,
                    transactionGrowth: parseFloat(transactionGrowth),
                    recentRevenue: recentRevenue.length > 0 ? recentRevenue[0].total : 0,
                    revenueGrowth: parseFloat(revenueGrowth),
                    transactions: formattedTransactions,
                },
            }).send(res);
        } catch (error) {
            console.error('Error in getRechargeStats:', error);
            throw new BadRequestError('Lỗi khi lấy thống kê nạp tiền');
        }
    }

    async getTransactionDetail(req, res) {
        try {
            const { transactionId } = req.params;

            // Find the transaction by ID and populate user information
            const transaction = await modelRechargeUser
                .findById(transactionId)
                .populate('userId', 'fullName email phone address balance createdAt');

            if (!transaction) {
                throw new BadRequestError('Giao dịch không tồn tại');
            }

            // Format the transaction data with additional user info
            const transactionDetail = {
                _id: transaction._id,
                userId: transaction.userId ? {
                    id: transaction.userId._id,
                    fullName: transaction.userId.fullName,
                    email: transaction.userId.email,
                    phone: transaction.userId.phone,
                    address: transaction.userId.address,
                    balance: transaction.userId.balance,
                    createdAt: transaction.userId.createdAt
                } : null,
                amount: transaction.amount,
                typePayment: transaction.typePayment,
                status: transaction.status,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt,
            };

            new OK({
                message: 'Lấy chi tiết giao dịch thành công',
                metadata: transactionDetail,
            }).send(res);
        } catch (error) {
            console.error('Error in getTransactionDetail:', error);
            throw new BadRequestError('Lỗi khi lấy chi tiết giao dịch');
        }
    }

    async getPublicStats(req, res) {
        try {
            // Get total public posts count (active posts)
            const totalPosts = await modelPost.countDocuments({ status: 'active' });

            // Get total users count
            const totalUsers = await modelUser.countDocuments();

            // Get new posts in the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const newPosts = await modelPost.countDocuments({
                status: 'active',
                createdAt: { $gte: sevenDaysAgo },
            });

            // Get new users in the last 7 days
            const newUsers = await modelUser.countDocuments({
                createdAt: { $gte: sevenDaysAgo },
            });

            // Get posts data for the last 7 days (public posts only)
            const last7DaysArray = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            }).reverse();

            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate() - 7);

            const postsData = await modelPost.aggregate([
                {
                    $match: {
                        status: 'active',
                        createdAt: { $gte: last7Days },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        posts: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            // Map posts data to ensure all 7 days are included
            const formattedPostsData = last7DaysArray.map((date) => {
                const dayData = postsData.find((item) => item._id === date);
                return {
                    date: date,
                    posts: dayData ? dayData.posts : 0,
                };
            });

            new OK({
                message: 'Lấy thống kê công khai thành công',
                metadata: {
                    // Public statistics
                    totalPosts,
                    totalUsers,
                    newPosts,
                    newUsers,
                    // Posts data for chart
                    postsData: formattedPostsData,
                },
            }).send(res);
        } catch (error) {
            console.error('Error in getPublicStats:', error);
            throw new BadRequestError('Lỗi khi lấy thống kê công khai');
        }
    }

    async searchKeyword(req, res) {
        const { keyword } = req.query;
        if (!keyword) {
            const hotSearch = await modelKeyWordSearch.find().sort({ count: -1 }).limit(5);
            return new OK({ message: 'Lấy từ khóa tìm kiếm thành công', metadata: hotSearch }).send(res);
        } else {
            const result = await AiSearchKeyword(keyword);
            return new OK({ message: 'Lấy từ khóa tìm kiếm thành công', metadata: result }).send(res);
        }
    }

    async addSearchKeyword(req, res) {
        const { title } = req.body;
        const keyWordSearch = await modelKeyWordSearch.findOne({ title });
        if (keyWordSearch) {
            keyWordSearch.count++;
            await keyWordSearch.save();
        } else {
            await modelKeyWordSearch.create({ title, count: 1 });
        }
        return new OK({ message: 'Thêm từ khóa tìm kiếm thành công' }).send(res);
    }

    async forgotPassword(req, res) {
        const { email } = req.body;
        if (!email) {
            throw new BadRequestError('Vui lòng nhập email');
        }

        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Email không tồn tại');
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const otp = await otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const saltRounds = 10;

        bcrypt.hash(otp, saltRounds, async function (err, hash) {
            if (err) {
                console.error('Error hashing OTP:', err);
            } else {
                await modelOtp.create({
                    email: user.email,
                    otp: hash,
                    type: 'forgotPassword',
                });
                await sendMailForgotPassword(email, otp);

                return res
                    .setHeader('Set-Cookie', [
                        `tokenResetPassword=${token};  Secure; Max-Age=300; Path=/; SameSite=Strict`,
                    ])
                    .status(200)
                    .json({ message: 'Gửi thành công !!!' });
            }
        });
    }

    async resetPassword(req, res) {
        const token = req.cookies.tokenResetPassword;
        const { otp, password } = req.body;

        if (!token) {
            throw new BadRequestError('Vui lòng gửi yêu cầu quên mật khẩu');
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        if (!decode) {
            throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
        }

        const findOTP = await modelOtp.findOne({ email: decode.email }).sort({ createdAt: -1 });
        if (!findOTP) {
            throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
        }

        // So sánh OTP
        const isMatch = await bcrypt.compare(otp, findOTP.otp);
        if (!isMatch) {
            throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
        }

        // Hash mật khẩu mới
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Tìm người dùng
        const findUser = await modelUser.findOne({ email: decode.email });
        if (!findUser) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        // Cập nhật mật khẩu mới
        findUser.password = hashedPassword;
        await findUser.save();

        // Xóa OTP sau khi đặt lại mật khẩu thành công
        await modelOtp.deleteOne({ email: decode.email });
        res.clearCookie('tokenResetPassword');
        return new OK({ message: 'Đặt lại mật khẩu thành công' }).send(res);
    }

    async deleteUser(req, res) {
        const { id } = req.body;

        // Check if user exists
        const userToDelete = await modelUser.findById(id);
        if (!userToDelete) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        // Ensure admin accounts cannot be deleted
        if (userToDelete.isAdmin === true) {
            throw new BadRequestError('Không thể xóa tài khoản quản trị viên');
        }

        // Delete the user
        await modelUser.findByIdAndDelete(id);

        new OK({
            message: 'Xóa người dùng thành công',
            metadata: { deletedUserId: id }
        }).send(res);
    }

    async createUserByAdmin(req, res) {
        const { fullName, email, password, phone, address, isAdmin = false } = req.body;

        if (!fullName || !email || !password || !phone) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        // Check if email already exists
        const existingUser = await modelUser.findOne({ email });
        if (existingUser) {
            throw new BadRequestError('Email đã tồn tại');
        }

        try {
            // Hash password
            const saltRounds = 10;
            const salt = bcrypt.genSaltSync(saltRounds);
            const passwordHash = bcrypt.hashSync(password, salt);

            // Create new user
            const newUser = await modelUser.create({
                fullName,
                email,
                password: passwordHash,
                typeLogin: 'email',
                phone,
                address: address || '', // Default to empty string if not provided
                avatar: '', // Default avatar
                isAdmin: isAdmin, // Allow setting admin status during creation
            });

            // Create API key for the user
            await createApiKey(newUser._id);

            new Created({
                message: 'Tạo người dùng thành công',
                metadata: {
                    user: {
                        _id: newUser._id,
                        fullName: newUser.fullName,
                        email: newUser.email,
                        phone: newUser.phone,
                        address: newUser.address,
                        isAdmin: newUser.isAdmin,
                        createdAt: newUser.createdAt
                    }
                }
            }).send(res);
        } catch (error) {
            console.error('Error creating user by admin:', error);
            throw new BadRequestError('Tạo người dùng thất bại');
        }
    }
}

module.exports = new controllerUsers();
