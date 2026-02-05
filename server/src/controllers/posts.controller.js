const mongoose = require("mongoose");
const modelPost = require('../models/post.model');
const modelUser = require('../models/users.model');
const modelFavourite = require('../models/favourite.model');

const { OK, Created } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');
const SendMailApprove = require('../utils/SendMail/SendMailApprove');
const SendMailReject = require('../utils/SendMail/SendMailReject');

// Import the reindex function for RAG system
const { reindexPosts } = require('../utils/Chatbot/chatbot');

// Debounce utility function to batch reindexing operations
let reindexTimeout = null;
let pendingReindex = false;

// Debounced reindex function to avoid frequent reindexing
function debouncedReindex() {
    pendingReindex = true;

    if (reindexTimeout) {
        clearTimeout(reindexTimeout);
    }

    // Wait 5 seconds before reindexing to batch multiple operations
    reindexTimeout = setTimeout(async () => {
        if (pendingReindex) {
            try {
                console.log('Starting batch reindexing of posts...');
                await reindexPosts();
                console.log('Completed batch reindexing of posts');
                pendingReindex = false;
            } catch (error) {
                console.error('Error during batch reindexing:', error);
                pendingReindex = false;
            }
        }
    }, 5000); // 5 seconds delay to batch operations
}

// Mapping between filter values and actual data values
const OPTIONS_MAP = {
    'day-du-noi-that': 'Đầy đủ nội thất',
    'co-may-lanh': 'Có máy lạnh',
    'co-gac': 'Có gác',
    'co-ke-bep': 'Có kệ bếp',
    'co-tu-lanh': 'Có tủ lạnh',
    'co-may-giat': 'Có máy giặt',
    'co-thang-may': 'Có thang máy',
    'khong-chung-chu': 'Không chung chủ',
    'gio-giac-tu-do': 'Giờ giấc tự do',
    'co-bao-ve': 'Có bảo vệ 24/24',
    'co-ham-de-xe': 'Có hầm để xe',
    'co-ban-cong': 'Có ban công',
    'co-noi-that': 'Có nội thất',
    'co-an-ninh': 'Có an ninh'
};

const pricePostVip = [
    { date: 3, price: 50000 },
    { date: 7, price: 315000 },
    { date: 30, price: 1200000 },
];

const pricePostNormal = [
    { date: 3, price: 10000 },
    { date: 7, price: 60000 },
    { date: 30, price: 1000000 },
];

class controllerPosts {
    async createPost(req, res) {
        const { id } = req.user;
        const {
            title,
            description,
            price,
            images,
            category,
            area,
            username,
            phone,
            options,
            location, // Keep for backward compatibility
            address, // New address object
            endDate,
            typeNews = 'normal', // Mặc định là 'normal' nếu không được chỉ định
            dateEnd,
        } = req.body;

        console.log('CreatePost controller - received images:', images);
        console.log('CreatePost controller - received body:', { title, description, price, category, area, username, phone, options, location, address, endDate, typeNews, dateEnd });

        // Validate required fields based on new structure, without coordinates
        if (
            !title ||
            !description ||
            !price ||
            !images ||
            !category ||
            !area ||
            !username ||
            !phone ||
            !options ||
            !endDate ||
            !dateEnd ||
            // Validate either old location or new address structure (without coordinates requirement)
            (!(location || (address && address.provinceCode && address.wardCode && address.street && address.fullAddress)))
        ) {
            console.log('Validation failed - missing required fields');
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        // Ensure images is an array
        const processedImages = Array.isArray(images) ? images : (images ? [images] : []);

        if (processedImages.length === 0) {
            console.log('Warning: No images provided for post creation');
            throw new BadRequestError('Vui lòng cung cấp ít nhất một hình ảnh cho bài đăng');
        }

        const user = await modelUser.findById(id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Bỏ phân loại tin VIP/Thường, tất cả đều tính theo giá tin thường
        const pricePost = pricePostNormal.find((item) => item.date === dateEnd);

        if (user.balance < pricePost.price) {
            throw new BadRequestError('Số dư không đủ');
        }

        // Create address object without coordinates to avoid geospatial issues
        let finalAddress;
        if (address && address.provinceCode && address.wardCode && address.street) {
            finalAddress = {
                provinceCode: address.provinceCode,
                wardCode: address.wardCode,
                street: address.street,
                fullAddress: address.fullAddress
            };
        } else {
            // Fallback to old location field if new address is not provided
            finalAddress = { fullAddress: location };
        }

        const post = await modelPost.create({
            title,
            description,
            price,
            address: finalAddress,
            images: processedImages,
            category,
            area,
            username,
            phone,
            options,
            status: 'inactive',
            userId: id,
            endDate: endDate ? endDate : null,
            typeNews,
        });
        await modelUser.findByIdAndUpdate(id, { $inc: { balance: -pricePost.price } });

        // Schedule re-indexing using the debounced function
        try {
            debouncedReindex();
            console.log('Scheduled re-indexing after creating new post');
        } catch (error) {
            console.error('Error scheduling re-indexing after creating post:', error);
        }

        return new Created({
            message: 'Post created successfully',
            metadata: post,
        }).send(res);
    }

    async createPostByAdmin(req, res) {
        const {
            title,
            description,
            price,
            images,
            category = 'phong-tro', // Default category for admin created posts
            area,
            username,
            phone,
            options,
            location, // Keep for backward compatibility
            address, // New address object
            endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
            typeNews = 'normal', // Default to normal if not specified
        } = req.body;

        if (
            !title ||
            !description ||
            !price ||
            !images ||
            !area ||
            !username ||
            !phone ||
            !options ||
            // Validate either old location or new address structure (without coordinates requirement)
            (!(location || (address && address.provinceCode && address.wardCode && address.street && address.fullAddress)))
        ) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        // Create address object without coordinates to avoid geospatial issues
        let finalAddress;
        if (address && address.provinceCode && address.wardCode && address.street) {
            finalAddress = {
                provinceCode: address.provinceCode,
                wardCode: address.wardCode,
                street: address.street,
                fullAddress: address.fullAddress
            };
        } else {
            // Fallback to old location field if new address is not provided
            finalAddress = { fullAddress: location };
        }

        const post = await modelPost.create({
            title,
            description,
            price,
            address: finalAddress,
            images,
            category,
            area,
            username,
            phone,
            options,
            status: 'active', // Admin created posts are active by default
            userId: 'admin', // Special ID for admin created posts
            endDate: endDate,
            typeNews,
        });

        // Re-index RAG system after creating a new post
        try {
            await reindexPosts();
            console.log('RAG system re-indexed after creating new post by admin');
        } catch (error) {
            console.error('Error re-indexing RAG system after creating post by admin:', error);
        }

        return new Created({
            message: 'Post created successfully by admin',
            metadata: post,
        }).send(res);
    }

    async getPosts(req, res) {
        const { category, priceRange, areaRange, /* typeNews, */ page = 1, limit = 12, province, district, ward, options } = req.query;

        // Thêm điều kiện kiểm tra ngày hết hạn - chỉ hiển thị bài đăng còn hạn
        const currentDate = new Date();
        const filter = {
            status: 'active',
            endDate: { $gte: currentDate } // Chỉ lấy bài đăng có endDate >= ngày hiện tại (chưa hết hạn)
        };

        if (category) {
            filter.category = category;
        }

        // Bỏ lọc theo typeNews vì không còn phân biệt tin VIP và thường
        // if (typeNews) {
        //     filter.typeNews = typeNews;
        // }

        if (priceRange) {
            const priceConditions = {
                'duoi-1-trieu': { $lt: 1000000 },
                'tu-1-2-trieu': { $gte: 1000000, $lt: 2000000 },
                'tu-2-3-trieu': { $gte: 2000000, $lt: 3000000 },
                'tu-3-5-trieu': { $gte: 3000000, $lt: 5000000 },
                'tu-5-7-trieu': { $gte: 5000000, $lt: 7000000 },
                'tu-7-10-trieu': { $gte: 7000000, $lt: 10000000 },
                'tu-10-15-trieu': { $gte: 10000000, $lt: 15000000 },
                'tren-15-trieu': { $gte: 15000000 },
            };
            if (priceConditions[priceRange]) {
                filter.price = priceConditions[priceRange];
            }
        }

        // Implement area filtering now that 'area' field is Number type
        if (areaRange) {
            const areaConditions = {
                'duoi-20': { $lt: 20 },
                'tu-20-30': { $gte: 20, $lt: 30 },
                'tu-30-50': { $gte: 30, $lt: 50 },
                'tu-50-70': { $gte: 50, $lt: 70 },
                'tu-70-90': { $gte: 70, $lt: 90 },
                'tren-90': { $gte: 90 },
            };
            if (areaConditions[areaRange]) {
                filter.area = areaConditions[areaRange];
            }
        }

        // Location filter - updated to work with the new address structure
        if (province || district || ward) {
            // Create conditions for new address structure
            const addressConditions = [];
            if (province) {
                addressConditions.push({ 'address.provinceCode': province });
            }
            if (district) {
                // Note: district không được lưu trong address object hiện tại, nên tạm thời dùng regex trên fullAddress
                // hoặc bạn có thể thêm districtCode vào address schema trong tương lai
            }
            if (ward) {
                addressConditions.push({ 'address.wardCode': ward });
            }

            // For backward compatibility, also search in the old location field
            const legacyConditions = [];
            if (province || district || ward) {
                const locationTerms = [];
                if (ward) locationTerms.push(ward);
                if (district) locationTerms.push(district);
                if (province) locationTerms.push(province);

                if (locationTerms.length > 0) {
                    const locationPattern = locationTerms.join('|');
                    legacyConditions.push({ 'location': { $regex: new RegExp(locationPattern, 'i') } });
                    legacyConditions.push({ 'address.fullAddress': { $regex: new RegExp(locationPattern, 'i') } });
                }
            }

            // Combine location conditions for new address structure
            if (addressConditions.length > 0) {
                if (addressConditions.length === 1) {
                    // Add single condition directly to main filter
                    Object.assign(filter, addressConditions[0]);
                } else {
                    // Combine multiple address conditions with $and
                    filter.$and = filter.$and || [];
                    filter.$and.push({ $and: addressConditions });
                }
            }

            // Add legacy search conditions if they exist
            if (legacyConditions.length > 0) {
                if (legacyConditions.length === 1) {
                    filter.$or = filter.$or ? [...filter.$or, legacyConditions[0]] : [legacyConditions[0]];
                } else {
                    if (!filter.$or) {
                        filter.$or = legacyConditions;
                    } else {
                        filter.$or = [...filter.$or, ...legacyConditions];
                    }
                }
            }
        }

        // Options filter - handle options as a comma-separated string from query params
        if (options) {
            try {
                // Check if options is a JSON string (from advanced filter)
                let selectedOptions = [];
                if (options.startsWith('[') && options.endsWith(']')) {
                    selectedOptions = JSON.parse(options);
                } else if (typeof options === 'string' && options.includes(',')) {
                    // If it's a comma-separated string
                    selectedOptions = options.split(',').map(opt => opt.trim());
                } else {
                    // If it's a single option
                    selectedOptions = [options];
                }

                if (selectedOptions && Array.isArray(selectedOptions) && selectedOptions.length > 0) {
                    // Map filter options to actual data values
                    const mappedOptions = selectedOptions.map(option => OPTIONS_MAP[option] || option);

                    // Find posts that have ALL the selected options in their options array
                    filter.$and = filter.$and || [];
                    filter.$and.push(...mappedOptions.map(option => ({
                        "options": { $in: [option] }
                    })));
                }
            } catch (e) {
                console.error('Error parsing options filter:', e);
                // If parsing fails, continue without options filter
            }
        }

        // Tính toán phân trang - Ensure page and limit are valid numbers
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 12;
        const skip = (pageNum - 1) * limitNum;

        // Lấy tổng số bài viết phù hợp với bộ lọc
        const totalPosts = await modelPost.countDocuments(filter);

        const dataPost = await modelPost.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const data = await Promise.all(
            dataPost.map(async (item) => {
                try {
                    // Special handling for admin-created posts (userId: 'admin')
                    if (item.userId === 'admin') {
                        const userData = {
                            _id: item.userId,
                            fullName: 'Quản trị viên', // Display as "Admin"
                            avatar: '' // Empty avatar
                        };
                        return { ...item._doc, user: userData };
                    }

                    const user = await modelUser.findById(item.userId);
                    // Check if user exists before accessing user properties
                    const userData = user ? {
                        _id: user._id,
                        fullName: user.fullName,
                        avatar: user.avatar
                    } : {
                        _id: item.userId, // Use the userId from the post if user not found
                        fullName: 'Người dùng đã bị xóa',
                        avatar: '' // Empty avatar
                    };
                    return { ...item._doc, user: userData };
                } catch (error) {
                    // If there's an error getting the user, still return the post with placeholder user data
                    console.error('Error fetching user for post:', item._id, error);
                    return {
                        ...item._doc,
                        user: {
                            _id: item.userId,
                            fullName: 'Người dùng đã bị xóa',
                            avatar: ''
                        }
                    };
                }
            }),
        );

        // Tính tổng số trang
        const totalPages = Math.ceil(totalPosts / limitNum);

        return new OK({
            message: 'Posts fetched successfully',
            metadata: {
                posts: data,
                currentPage: pageNum,
                totalPages: totalPages,
                totalPosts: totalPosts,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
        }).send(res);
    }

    async getPostById(req, res) {
        const { id } = req.query;
        const data = await modelPost.findById(id);

        // Handle case where userId is 'admin' or user doesn't exist
        let findUser = null;
        let dataUser = null;

        if (data.userId === 'admin') {
            // For admin-created posts, create a placeholder user object
            dataUser = {
                _id: 'admin',
                username: 'Quản trị viên', // Admin display name
                avatar: '', // Empty avatar or you could set a default admin avatar
                createdAt: data.createdAt, // Use post creation date
                phone: data.phone, // Use the phone from the post
                lengthPost: 0, // No posts count for admin posts
                status: 'Đang hoạt động', // Assume admin is active
            };
        } else {
            findUser = await modelUser.findById(data.userId);
            if (findUser) {
                const lengthPost = await modelPost.countDocuments({ userId: data.userId });
                let statusUser = '';
                const userSockets = global.usersMap.get(findUser._id.toString());

                if (userSockets && Array.isArray(userSockets) && userSockets.length > 0) {
                    statusUser = 'Đang hoạt động';
                } else {
                    statusUser = 'Đang offline';
                }
                dataUser = {
                    _id: findUser._id,
                    username: findUser.fullName,
                    avatar: findUser.avatar,
                    createdAt: findUser.createdAt,
                    phone: findUser.phone,
                    lengthPost,
                    status: statusUser,
                };
            } else {
                // User not found (deleted account)
                dataUser = {
                    _id: data.userId,
                    username: 'Người dùng đã bị xóa',
                    avatar: '',
                    createdAt: data.createdAt,
                    phone: data.phone,
                    lengthPost: 0,
                    status: 'Đang offline',
                };
            }
        }

        const findFavourite = await modelFavourite.find({ postId: id });
        const userFavourite = findFavourite.map((item) => item.userId);

        return new OK({
            message: 'Post fetched successfully',
            metadata: {
                data,
                dataUser,
                userFavourite,
            },
        }).send(res);
    }

    async getPostByUserId(req, res) {
        const { id } = req.user;
        const data = await modelPost.find({ userId: id });
        return new OK({
            message: 'Post fetched successfully',
            metadata: data,
        }).send(res);
    }

    async getNewPost(req, res) {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 3);
        const currentDate = new Date();

        const data = await modelPost
            .find({
                createdAt: { $gte: fiveDaysAgo },
                status: 'active',
                endDate: { $gte: currentDate } // Chỉ lấy bài đăng chưa hết hạn
            })
            .sort({ createdAt: -1 })
            .limit(8);

        return new OK({
            message: 'Post fetched successfully',
            metadata: data,
        }).send(res);
    }

    async getPostVip(req, res) {
        const currentDate = new Date();
        // Không còn phân biệt tin VIP và thường, trả về tất cả bài đăng còn hạn
        const data = await modelPost.find({
            endDate: { $gte: currentDate } // Chỉ lấy bài đăng chưa hết hạn
        }).limit(5);
        return new OK({
            message: 'Post fetched successfully',
            metadata: data,
        }).send(res);
    }

    async deletePost(req, res) {
        const { id } = req.body;
        const findPost = await modelPost.findById(id);
        if (!findPost) {
            throw new BadRequestError('Post not found');
        }
        await modelPost.findByIdAndDelete(id);
        await modelFavourite.deleteMany({ postId: id });
        await modelUser.findByIdAndUpdate(findPost.userId, { $inc: { balance: findPost.price } });

        // Schedule re-indexing using the debounced function
        try {
            debouncedReindex();
            console.log('Scheduled re-indexing after deleting post');
        } catch (error) {
            console.error('Error scheduling re-indexing after deleting post:', error);
        }

        return new OK({
            message: 'Xoá bài viết thành công',
            metadata: findPost,
        }).send(res);
    }

    async getAllPosts(req, res) {
        const { status, page = 1, limit = 20, category, location, province, ward } = req.query; // Default pagination: page 1, 20 posts per page
        let filter = {};

        // Apply filters based on query parameters
        if (status !== undefined) {
            filter.status = status;
        }

        if (category) {
            filter.category = category;
        }

        if (location) {
            // Search in both the old location field and the new address.fullAddress field
            filter.$or = [
                { 'location': { $regex: location, $options: 'i' } },
                { 'address.fullAddress': { $regex: location, $options: 'i' } }
            ];
        }

        // Location filter - updated to work with the new address structure for province and ward
        if (province || ward) {
            // Create conditions for new address structure
            const addressConditions = [];
            if (province) {
                addressConditions.push({ 'address.provinceCode': province });
            }
            if (ward) {
                addressConditions.push({ 'address.wardCode': ward });
            }

            // For backward compatibility, also search in the old location field
            const legacyConditions = [];
            if (province || ward) {
                const locationTerms = [];
                if (ward) locationTerms.push(ward);
                if (province) locationTerms.push(province);

                if (locationTerms.length > 0) {
                    const locationPattern = locationTerms.join('|');
                    legacyConditions.push({ 'location': { $regex: new RegExp(locationPattern, 'i') } });
                    legacyConditions.push({ 'address.fullAddress': { $regex: new RegExp(locationPattern, 'i') } });
                }
            }

            // Combine all location conditions using $or to match either new or old structure
            const allLocationConditions = [];

            // Add address conditions if they exist (AND between province and ward)
            if (addressConditions.length > 0) {
                if (addressConditions.length === 1) {
                    allLocationConditions.push(addressConditions[0]);
                } else {
                    allLocationConditions.push({ $and: addressConditions });
                }
            }

            // Add legacy conditions if they exist
            if (legacyConditions.length > 0) {
                allLocationConditions.push(...legacyConditions);
            }

            // If we have location conditions, add them to the main filter
            if (allLocationConditions.length > 0) {
                if (allLocationConditions.length === 1) {
                    // If only one condition, add it directly
                    Object.assign(filter, allLocationConditions[0]);
                } else {
                    // If multiple conditions, use $or to match any of them
                    if (filter.$or) {
                        // If filter already has $or conditions, merge them
                        filter.$or = [...filter.$or, ...allLocationConditions];
                    } else {
                        filter.$or = allLocationConditions;
                    }
                }
            }
        }

        // Tính toán phân trang - Ensure page and limit are valid numbers
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const skip = (pageNum - 1) * limitNum;

        // Lấy tổng số bài viết phù hợp với bộ lọc
        const totalPosts = await modelPost.countDocuments(filter);

        const data = await modelPost.find(filter)
            .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo mới nhất trước
            .skip(skip)
            .limit(limitNum);

        // Tính tổng số trang
        const totalPages = Math.ceil(totalPosts / limitNum);

        return new OK({
            message: 'Posts fetched successfully',
            metadata: {
                posts: data,
                currentPage: pageNum,
                totalPages: totalPages,
                totalPosts: totalPosts,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
        }).send(res);
    }

    async approvePost(req, res) {
        const { id } = req.body;
        const findPost = await modelPost.findById(id);
        if (!findPost) {
            throw new BadRequestError('Post not found');
        }

        // Handle admin posts - don't try to send email to admin
        if (findPost.userId !== 'admin') {
            const findUser = await modelUser.findById(findPost.userId);
            if (findUser) {
                await SendMailApprove(findUser.email, findPost);
            }
        }

        // Check if the post is still within its end date when approving
        const postToApprove = await modelPost.findById(id);
        const currentDate = new Date();

        // If the post has expired, set its status to 'expired' instead of 'active'
        const newStatus = postToApprove.endDate >= currentDate ? 'active' : 'expired';

        await modelPost.findByIdAndUpdate(id, { status: newStatus });

        // Schedule re-indexing using the debounced function
        try {
            debouncedReindex();
            console.log('Scheduled re-indexing after approving post');
        } catch (error) {
            console.error('Error scheduling re-indexing after approving post:', error);
        }

        return new OK({
            message: 'Duyệt bài viết thành công',
            metadata: findPost,
        }).send(res);
    }

    async rejectPost(req, res) {
        const { id, reason } = req.body;
        const findPost = await modelPost.findById(id);
        // Handle admin posts - don't try to send email to admin
        if (findPost.userId !== 'admin') {
            const findUser = await modelUser.findById(findPost.userId);
            if (findUser) {
                await SendMailReject(findUser.email, findPost, reason);
            }
        }
        await modelPost.findByIdAndUpdate(id, { status: 'cancel' });
        return new OK({
            message: 'Từ chối bài viết thành công',
            metadata: findPost,
        }).send(res);
    }

    async updatePost(req, res) {
        const { id } = req.params;
        const {
            title,
            description,
            price,
            images,
            category,
            area,
            username,
            phone,
            options,
            location,
            typeNews,
            endDate,  // Added to allow date updates
            dateEnd   // Added to handle duration for renewal
        } = req.body;

        const findPost = await modelPost.findById(id);
        if (!findPost) {
            throw new BadRequestError('Post not found');
        }

        // Check if this is a date extension request (renewal)
        if (dateEnd) {
            // This is a renewal request - handle payment and date extension
            const { id: userId } = req.user;

            // Check if the post belongs to the current user
            if (findPost.userId !== userId.toString()) {
                throw new BadRequestError('Bạn không có quyền cập nhật bài đăng này');
            }

            // Only posts with status 'cancel' cannot be renewed
            if (findPost.status === 'cancel') {
                throw new BadRequestError('Bài đăng đã bị hủy và không thể gia hạn');
            }

            // Validate dateEnd is one of the allowed values
            const allowedDateEnds = [3, 7, 30];
            if (!allowedDateEnds.includes(dateEnd)) {
                throw new BadRequestError(`Số ngày gia hạn không hợp lệ. Chỉ hỗ trợ: ${allowedDateEnds.join(', ')} ngày`);
            }

            // Determine price based on post type (vip or normal)
            const pricePost =
                findPost.typeNews === 'vip'
                    ? pricePostVip.find((item) => item.date === dateEnd)
                    : pricePostNormal.find((item) => item.date === dateEnd);

            if (!pricePost) {
                throw new BadRequestError('Gói gia hạn không tồn tại');
            }

            // Check user balance
            const user = await modelUser.findById(userId);
            if (!user) {
                throw new BadRequestError('Người dùng không tồn tại');
            }

            if (user.balance < pricePost.price) {
                throw new BadRequestError('Số dư không đủ để gia hạn bài đăng');
            }

            // Calculate new end date based on current end date (if still valid) or current date
            const currentDate = new Date();
            let startDate = currentDate;
            if (findPost.endDate > currentDate) {
                // If post is still active, extend from current end date
                startDate = findPost.endDate;
            }

            const newEndDate = new Date(startDate);
            newEndDate.setDate(newEndDate.getDate() + dateEnd);

            // Update user balance
            await modelUser.findByIdAndUpdate(userId, { $inc: { balance: -pricePost.price } });

            // Update post with new end date and set status to inactive (requires admin approval)
            const updatedPost = await modelPost.findByIdAndUpdate(
                id,
                {
                    title,
                    description,
                    price,
                    images,
                    category,
                    area,
                    username,
                    phone,
                    options,
                    location,
                    typeNews,
                    endDate: newEndDate,  // Updated end date
                    status: 'inactive'   // Set to inactive to require admin approval after renewal
                },
                { new: true }
            );

            // Schedule re-indexing using the debounced function
            try {
                debouncedReindex();
                console.log('Scheduled re-indexing after updating and renewing post');
            } catch (error) {
                console.error('Error scheduling re-indexing after updating and renewing post:', error);
            }

            return new OK({
                message: 'Cập nhật và gia hạn bài viết thành công',
                metadata: updatedPost,
            }).send(res);
        } else {
            // Regular update without date extension
            const updatedPost = await modelPost.findByIdAndUpdate(
                id,
                {
                    title,
                    description,
                    price,
                    images,
                    category,
                    area,
                    username,
                    phone,
                    options,
                    location,
                    typeNews,
                    endDate: endDate || findPost.endDate, // Keep existing endDate if not provided
                    status: 'inactive' // Reset status to inactive for re-approval
                },
                { new: true }
            );

            // Schedule re-indexing using the debounced function
            try {
                debouncedReindex();
                console.log('Scheduled re-indexing after updating post');
            } catch (error) {
                console.error('Error scheduling re-indexing after updating post:', error);
            }

            return new OK({
                message: 'Cập nhật bài viết thành công',
                metadata: updatedPost,
            }).send(res);
        }
    }

    async postSuggest(req, res) {
        const { id } = req.user;
        const findUser = await modelUser.findById(id);
        const address = findUser.address;
        const currentDate = new Date();

        if (address) {
            // Lấy phần quận/huyện + tỉnh/thành
            const addressParts = address.split(',');
            const districtCity = addressParts.slice(-2).join(',').trim(); // "Hoàng Mai, Hà Nội"

            // Tìm bài viết có location chứa "Hoàng Mai, Hà Nội"
            const data = await modelPost.find({
                location: { $regex: new RegExp(districtCity, 'i') },
                status: 'active',
                endDate: { $gte: currentDate } // Chỉ lấy bài đăng chưa hết hạn
            });

            return new OK({
                message: 'Post fetched successfully',
                metadata: data.length ? data : await modelPost.find({ status: 'active', endDate: { $gte: currentDate } }),
            }).send(res);
        } else {
            const data = await modelPost.find({
                status: 'active',
                endDate: { $gte: currentDate } // Chỉ lấy bài đăng chưa hết hạn
            });
            return new OK({
                message: 'Post fetched successfully',
                metadata: data,
            }).send(res);
        }
    }

    // async getFilteredPosts(req, res) {
    //     try {
    //         const {
    //             category,
    //             minPrice,
    //             maxPrice,
    //             minArea,
    //             cityCode,
    //             wardCode,
    //             selectedAmenities
    //         } = req.query;

    //         // Build filter query dynamically from query params
    //         const filterQuery = {
    //             status: 'active',
    //             endDate: { $gte: new Date() } // Only show posts that haven't expired
    //         };

    //         // Category filter - exact match
    //         if (category && category !== "") {
    //             filterQuery.category = category;
    //         }

    //         // Price range filter with strict validation
    //         if (minPrice !== undefined || maxPrice !== undefined) {
    //             filterQuery.price = {};

    //             if (minPrice !== undefined && minPrice !== "" && !isNaN(Number(minPrice)) && Number(minPrice) >= 0) {
    //                 filterQuery.price.$gte = Number(minPrice);
    //             }

    //             if (maxPrice !== undefined && maxPrice !== "" && !isNaN(Number(maxPrice)) && Number(maxPrice) >= 0) {
    //                 filterQuery.price.$lte = Number(maxPrice);
    //             }

    //             // Clean up if price object is empty due to invalid values
    //             if (Object.keys(filterQuery.price).length === 0) {
    //                 delete filterQuery.price;
    //             }
    //         }

    //         // Area filter with strict validation
    //         if (minArea !== undefined && minArea !== "" && !isNaN(Number(minArea)) && Number(minArea) >= 0) {
    //             filterQuery.area = { $gte: Number(minArea) };
    //         }

    //         // Geographic filters - match cityCode with address.provinceCode and wardCode with address.wardCode
    //         // Only add to filter if they exist and are not empty strings
    //         if (cityCode && cityCode !== "") {
    //             filterQuery['address.provinceCode'] = cityCode;
    //         }

    //         if (wardCode && wardCode !== "") {
    //             filterQuery['address.wardCode'] = wardCode;
    //         }

    //         // Amenities filter - use $all operator to match all selected amenities
    //         if (selectedAmenities && selectedAmenities !== "") {
    //             try {
    //                 let amenitiesArray = [];

    //                 // Handle different formats of selectedAmenities
    //                 if (typeof selectedAmenities === 'string') {
    //                     if (selectedAmenities.startsWith('[') && selectedAmenities.endsWith(']')) {
    //                         // If it's a JSON string array
    //                         amenitiesArray = JSON.parse(selectedAmenities);
    //                     } else if (selectedAmenities.includes(',')) {
    //                         // If it's a comma-separated string
    //                         amenitiesArray = selectedAmenities.split(',').map(amenity => amenity.trim()).filter(amenity => amenity !== "");
    //                     } else {
    //                         // Single amenity
    //                         amenitiesArray = [selectedAmenities];
    //                     }
    //                 } else if (Array.isArray(selectedAmenities)) {
    //                     // Already an array
    //                     amenitiesArray = selectedAmenities;
    //                 }

    //                 // Map filter values to actual data values using OPTIONS_MAP
    //                 // Filter to only keep mapped values that exist in the OPTIONS_MAP or have valid original values
    //                 const mappedAmenities = amenitiesArray
    //                     .map(amenity => OPTIONS_MAP[amenity])
    //                     .filter(mappedValue => mappedValue !== undefined && mappedValue !== null); // Only keep successfully mapped values

    //                 // Only add to filter if we have valid mapped amenities
    //                 if (mappedAmenities.length > 0) {
    //                     filterQuery.options = { $all: mappedAmenities };
    //                 }
    //             } catch (error) {
    //                 console.error('Error parsing selectedAmenities:', error);
    //                 // Continue without amenities filter if parsing fails
    //             }
    //         }

    //         // Execute the query with the constructed filter
    //         const posts = await modelPost.find(filterQuery).sort({ createdAt: -1 });

    //         // Populate user data for each post
    //         const populatedPosts = await Promise.all(
    //             posts.map(async (item) => {
    //                 try {
    //                     // Special handling for admin-created posts (userId: 'admin')
    //                     if (item.userId === 'admin') {
    //                         const userData = {
    //                             _id: item.userId,
    //                             fullName: 'Quản trị viên', // Display as "Admin"
    //                             avatar: '' // Empty avatar
    //                         };
    //                         return { ...item._doc, user: userData };
    //                     }

    //                     const user = await modelUser.findById(item.userId);
    //                     // Check if user exists before accessing user properties
    //                     const userData = user ? {
    //                         _id: user._id,
    //                         fullName: user.fullName,
    //                         avatar: user.avatar
    //                     } : {
    //                         _id: item.userId, // Use the userId from the post if user not found
    //                         fullName: 'Người dùng đã bị xóa',
    //                         avatar: '' // Empty avatar
    //                     };
    //                     return { ...item._doc, user: userData };
    //                 } catch (error) {
    //                     // If there's an error getting the user, still return the post with placeholder user data
    //                     console.error('Error fetching user for post:', item._id, error);
    //                     return {
    //                         ...item._doc,
    //                         user: {
    //                             _id: item.userId,
    //                             fullName: 'Người dùng đã bị xóa',
    //                             avatar: ''
    //                         }
    //                     };
    //                 }
    //             }),
    //         );

    //         return new OK({
    //             message: 'Filtered posts fetched successfully',
    //             metadata: populatedPosts,
    //         }).send(res);
    //     } catch (error) {
    //         console.error('Error in getFilteredPosts:', error);
    //         throw new BadRequestError('Error filtering posts: ' + error.message);
    //     }
    // }
    async getFilteredPosts(req, res) {
        try {
            const {
                category,
                minPrice,
                maxPrice,
                minArea,
                maxArea,
                cityCode,
                wardCode,
                selectedAmenities,
                // Support for URL parameter format (e.g., from your example: gia_tu, gia_den, dien_tich_tu, dien_tich_den)
                gia_tu,
                gia_den,
                dien_tich_tu,
                dien_tich_den
            } = req.query;

            console.log('=== FILTER INFO RECEIVED ===');
            console.log('Category:', category);
            console.log('Min Price:', minPrice);
            console.log('Max Price:', maxPrice);
            console.log('Min Area:', minArea);
            console.log('Max Area:', maxArea);
            console.log('City Code:', cityCode);
            console.log('Ward Code:', wardCode);
            console.log('Selected Amenities:', selectedAmenities);
            // Log the URL-style parameters
            console.log('Gia tu:', gia_tu);
            console.log('Gia den:', gia_den);
            console.log('Dien tich tu:', dien_tich_tu);
            console.log('Dien tich den:', dien_tich_den);
            console.log('============================');

            // 1. Khởi tạo filterQuery với điều kiện mặc định
            const filterQuery = {
                status: 'active',
                endDate: { $gte: new Date() } // Chỉ show posts chưa hết hạn
            };

            // 2. Lọc Category và Địa lý (Khớp chính xác BẰNG CODE)
            // Kiểm tra tồn tại và không phải chuỗi rỗng
            if (category && category !== "") {
                filterQuery.category = category;
            }
            if (cityCode && cityCode !== "") {
                filterQuery['address.provinceCode'] = cityCode;
            }
            if (wardCode && wardCode !== "") {
                filterQuery['address.wardCode'] = wardCode;
            }

            // 3. Lọc Khoảng Giá (Range) - Support both formats
            let finalMinPrice = minPrice;
            let finalMaxPrice = maxPrice;

            // Check for URL-style parameters first (gia_tu, gia_den)
            if (gia_tu !== undefined || gia_den !== undefined) {
                if (gia_tu !== undefined && gia_tu !== "" && !isNaN(Number(gia_tu)) && Number(gia_tu) >= 0) {
                    finalMinPrice = Number(gia_tu);
                }
                if (gia_den !== undefined && gia_den !== "" && !isNaN(Number(gia_den)) && Number(gia_den) >= 0) {
                    finalMaxPrice = Number(gia_den);
                }
            } else {
                // Fallback to original minPrice/maxPrice format
                if (minPrice !== undefined && minPrice !== "" && !isNaN(Number(minPrice)) && Number(minPrice) >= 0) {
                    finalMinPrice = Number(minPrice);
                }
                if (maxPrice !== undefined && maxPrice !== "" && !isNaN(Number(maxPrice)) && Number(maxPrice) >= 0) {
                    finalMaxPrice = Number(maxPrice);
                }
            }

            if (finalMinPrice !== undefined || finalMaxPrice !== undefined) {
                filterQuery.price = {};

                if (finalMinPrice !== undefined && finalMinPrice >= 0) {
                    filterQuery.price.$gte = Number(finalMinPrice);
                }
                if (finalMaxPrice !== undefined && finalMaxPrice >= 0) {
                    filterQuery.price.$lte = Number(finalMaxPrice);
                }

                if (Object.keys(filterQuery.price).length === 0) {
                    delete filterQuery.price;
                }
            }

            // 4. Lọc Diện tích (Range) - Support both formats
            let finalMinArea = minArea;
            let finalMaxArea = maxArea;

            // Check for URL-style parameters first (dien_tich_tu, dien_tich_den)
            if (dien_tich_tu !== undefined || dien_tich_den !== undefined) {
                if (dien_tich_tu !== undefined && dien_tich_tu !== "" && !isNaN(Number(dien_tich_tu)) && Number(dien_tich_tu) >= 0) {
                    finalMinArea = Number(dien_tich_tu);
                }
                if (dien_tich_den !== undefined && dien_tich_den !== "" && !isNaN(Number(dien_tich_den)) && Number(dien_tich_den) >= 0) {
                    finalMaxArea = Number(dien_tich_den);
                }
            } else {
                // Fallback to original minArea/maxArea format
                if (minArea !== undefined && minArea !== "" && !isNaN(Number(minArea)) && Number(minArea) >= 0) {
                    finalMinArea = Number(minArea);
                }
                if (maxArea !== undefined && maxArea !== "" && !isNaN(Number(maxArea)) && Number(maxArea) >= 0) {
                    finalMaxArea = Number(maxArea);
                }
            }

            if (finalMinArea !== undefined || finalMaxArea !== undefined) {
                filterQuery.area = {};

                if (finalMinArea !== undefined && finalMinArea >= 0) {
                    filterQuery.area.$gte = Number(finalMinArea);
                }
                if (finalMaxArea !== undefined && finalMaxArea >= 0) {
                    filterQuery.area.$lte = Number(finalMaxArea);
                }

                if (Object.keys(filterQuery.area).length === 0) {
                    delete filterQuery.area;
                }
            }

            // 5. Lọc Tiện nghi ($all - LỌC CỘNG DỒN CHÍNH XÁC)
            if (selectedAmenities && selectedAmenities !== "") {
                try {
                    let amenitiesArray = [];

                    if (typeof selectedAmenities === 'string') {
                        // Check if it's the URL-style format (features[])
                        if (selectedAmenities.startsWith('[') && selectedAmenities.endsWith(']')) {
                            amenitiesArray = JSON.parse(selectedAmenities);
                        } else if (selectedAmenities.includes(',')) {
                            // If it's a comma-separated string
                            amenitiesArray = selectedAmenities.split(',').map(amenity => amenity.trim()).filter(amenity => amenity !== "");
                        } else {
                            // Single amenity
                            amenitiesArray = [selectedAmenities];
                        }
                    } else if (Array.isArray(selectedAmenities)) {
                        // Already an array
                        amenitiesArray = selectedAmenities;
                    }

                    // Log the original amenities before mapping
                    console.log('Original amenities array:', amenitiesArray);

                    // Also check for individual features parameters (features[0], features[1], etc.)
                    // When query string includes features[0]=value&features[1]=value2, etc.
                    // This would appear in the query object as req.query['features[0]'], req.query['features[1]'], etc.
                    // Or if array format is used, it might be req.query.features as an array
                    let featureValues = [];

                    // Handle features as an array (if query string is features[]=value1&features[]=value2)
                    if (Array.isArray(req.query.features)) {
                        featureValues = req.query.features.filter(value => value !== '');
                    }
                    // Handle features as separate parameters with brackets (features[0]=value&features[1]=value2)
                    else {
                        const featureKeys = Object.keys(req.query).filter(key => {
                            // Check if the key matches the features[index] pattern
                            return /^features\[\d+\]$/.test(key);
                        });

                        if (featureKeys.length > 0) {
                            // Use features[] parameters from URL
                            featureValues = featureKeys.map(key => req.query[key]).filter(value => value !== '');
                        }
                    }

                    if (featureValues.length > 0) {
                        amenitiesArray = [...new Set([...amenitiesArray, ...featureValues])]; // Combine and deduplicate
                    }

                    // Ánh xạ và CHỈ GIỮ LẠI các giá trị đã được map thành công.
                    const mappedAmenities = amenitiesArray
                        .map(amenity => OPTIONS_MAP[amenity])
                        .filter(mappedValue => mappedValue !== undefined && mappedValue !== null);

                    if (mappedAmenities.length > 0) {
                        // Dùng $all: Đảm bảo bài đăng có TẤT CẢ các tiện nghi được chọn.
                        filterQuery.options = { $all: mappedAmenities };
                    }

                    console.log('Amenities Array:', amenitiesArray);
                    console.log('Mapped Amenities:', mappedAmenities);
                } catch (error) {
                    console.error('Error parsing selectedAmenities:', error);
                    // Nếu lỗi nặng, trả về lỗi Bad Request
                    throw new BadRequestError('Lỗi định dạng tiện nghi');
                }
            }

            console.log('Final Filter Query:', JSON.stringify(filterQuery, null, 2));
            console.log('============================');

            // 6. Thực thi truy vấn
            const posts = await modelPost.find(filterQuery).sort({ createdAt: -1 });

            // 7. Populate user data (giữ nguyên logic của bạn)
            const populatedPosts = await Promise.all(
                posts.map(async (item) => {
                    try {
                        // Special handling for admin-created posts (userId: 'admin')
                        if (item.userId === 'admin') {
                            const userData = {
                                _id: item.userId,
                                fullName: 'Quản trị viên', // Display as "Admin"
                                avatar: '' // Empty avatar
                            };
                            return { ...item._doc, user: userData };
                        }

                        const user = await modelUser.findById(item.userId);
                        // Check if user exists before accessing user properties
                        const userData = user ? {
                            _id: user._id,
                            fullName: user.fullName,
                            avatar: user.avatar
                        } : {
                            _id: item.userId, // Use the userId from the post if user not found
                            fullName: 'Người dùng đã bị xóa',
                            avatar: '' // Empty avatar
                        };
                        return { ...item._doc, user: userData };
                    } catch (error) {
                        // If there's an error getting the user, still return the post with placeholder user data
                        console.error('Error fetching user for post:', item._id, error);
                        return {
                            ...item._doc,
                            user: {
                                _id: item.userId,
                                fullName: 'Người dùng đã bị xóa',
                                avatar: ''
                            }
                        };
                    }
                }),
            );

            return new OK({
                message: 'Filtered posts fetched successfully',
                metadata: populatedPosts,
            }).send(res);
        } catch (error) {
            console.error('Error in getFilteredPosts:', error);
            if (error instanceof BadRequestError) {
                throw error;
            }
            throw new BadRequestError('Error filtering posts: ' + error.message);
        }
    }

    // Renew/Extend post functionality
    async renewPost(req, res) {
        const { id: userId } = req.user;
        const { postId, dateEnd } = req.body; // Bỏ newTypeNews vì không còn nâng cấp loại tin

        if (!postId || !dateEnd) {
            throw new BadRequestError('Vui lòng cung cấp postId và số ngày gia hạn');
        }

        // Find the post to renew
        const post = await modelPost.findById(postId);
        if (!post) {
            throw new BadRequestError('Bài đăng không tồn tại');
        }

        // Check if the post belongs to the current user
        if (post.userId !== userId.toString()) {
            throw new BadRequestError('Bạn không có quyền gia hạn bài đăng này');
        }

        // Only posts with status 'cancel' cannot be renewed
        // Expired posts (status 'expired') can be renewed
        if (post.status === 'cancel') {
            throw new BadRequestError('Bài đăng đã bị hủy và không thể gia hạn');
        }

        // Validate dateEnd is one of the allowed values
        const allowedDateEnds = [3, 7, 30];
        if (!allowedDateEnds.includes(dateEnd)) {
            throw new BadRequestError(`Số ngày gia hạn không hợp lệ. Chỉ hỗ trợ: ${allowedDateEnds.join(', ')} ngày`);
        }

        // Bỏ phân loại tin VIP/Thường, tất cả đều tính theo giá tin thường
        const pricePost = pricePostNormal.find((item) => item.date === dateEnd);

        if (!pricePost) {
            throw new BadRequestError('Gói gia hạn không tồn tại');
        }

        // Check user balance
        const user = await modelUser.findById(userId);
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        if (user.balance < pricePost.price) {
            throw new BadRequestError('Số dư không đủ để gia hạn bài đăng');
        }

        // Calculate new end date based on current end date (if still valid) or current date
        const currentDate = new Date();
        let startDate = currentDate;
        if (post.endDate > currentDate) {
            // If post is still active, extend from current end date
            startDate = post.endDate;
        }

        const newEndDate = new Date(startDate);
        newEndDate.setDate(newEndDate.getDate() + dateEnd);

        // Update user balance
        await modelUser.findByIdAndUpdate(userId, { $inc: { balance: -pricePost.price } });

        // Update post with new end date, set status to inactive (requires admin approval)
        const updateData = {
            endDate: newEndDate,
            status: 'inactive'  // Set to inactive to require admin approval after renewal
        };

        // Không còn cập nhật typeNews vì tất cả bài đăng đều là 'normal'
        // Không cho phép thay đổi loại tin đăng

        const updatedPost = await modelPost.findByIdAndUpdate(
            postId,
            updateData,
            { new: true }
        );

        // Schedule re-indexing using the debounced function
        try {
            debouncedReindex();
            console.log('Scheduled re-indexing after renewing post');
        } catch (error) {
            console.error('Error scheduling re-indexing after renewing post:', error);
        }

        return new OK({
            message: 'Gia hạn bài đăng thành công',
            metadata: updatedPost,
        }).send(res);
    }
}

module.exports = new controllerPosts();
