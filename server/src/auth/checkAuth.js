const { BadUserRequestError, BadUser2RequestError } = require('../core/error.response');
const { verifyToken } = require('../services/tokenSevices');
const modelUser = require('../models/users.model');

const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

// Hàm trích xuất token từ cả cookie và header
const extractToken = (req) => {
    // Kiểm tra từ header Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return req.headers.authorization.substring(7);
    }
    // Nếu không có header, kiểm tra từ cookie
    else if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    return null;
};

const authUser = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) throw new BadUserRequestError('Vui lòng đăng nhập');
        const decoded = await verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

const authAdmin = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) throw new BadUserRequestError('Bạn không có quyền truy cập - Không tìm thấy token');
        const decoded = await verifyToken(token);
        const { id } = decoded;
        const findUser = await modelUser.findById(id);
        if (!findUser) {
            throw new BadUser2RequestError('Không tìm thấy người dùng');
        }
        if (!findUser.isAdmin) {
            console.log(`Access denied: User ${findUser._id} (${findUser.email || findUser.username}) is not an admin. isAdmin value: ${findUser.isAdmin}`);
            throw new BadUser2RequestError('Bạn không có quyền truy cập - Tài khoản không phải là quản trị viên');
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.error('AuthAdmin middleware error:', error.message);
        next(error);
    }
};

module.exports = {
    asyncHandler,
    authUser,
    authAdmin,
};
