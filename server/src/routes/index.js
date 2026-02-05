const userRoutes = require('./users.routes');
const postRoutes = require('./posts.routes');
const paymentsRoutes = require('./payments.routes');
const messengerRoutes = require('./messenger.routes');
const favouriteRoutes = require('./favourite.routes');
const locationRoutes = require('./location.routes');
const rechargeUserRoutes = require('./RechargeUser.routes');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

var upload = multer({ storage: storage });

function routes(app) {
    app.post('/api/register', userRoutes);
    app.post('/api/login', userRoutes);
    app.post('/api/login-google', userRoutes);
    app.get('/api/auth', userRoutes);
    app.get('/api/logout', userRoutes);
    app.get('/api/refresh-token', userRoutes);
    app.get('/api/recharge-user', userRoutes);
    app.post('/api/update-user', userRoutes);
    app.post('/api/change-password', userRoutes);

    app.get('/api/get-users', userRoutes);
    app.get('/api/get-admin-stats', userRoutes);
    app.get('/api/get-recharge-stats', userRoutes);
    app.use('/', rechargeUserRoutes);

    app.get('/api/get-hot-search', userRoutes);
    app.get('/api/search', userRoutes);

    app.post('/api/add-search-keyword', userRoutes);
    app.get('/api/get-search-keyword', userRoutes);

    app.post('/api/forgot-password', userRoutes);
    app.post('/api/reset-password', userRoutes);

    // User management endpoints
    app.put('/api/update-user-by-admin/:id', userRoutes);
    app.post('/api/delete-user', userRoutes);
    app.post('/api/create-user-by-admin', userRoutes);

    /// posts
    // Fix the create-post route to avoid double prefix issue - use direct route instead of router
    // Also add multer middleware to handle image uploads with the post data
    const { authUser, asyncHandler } = require('../auth/checkAuth');
    const controllerPosts = require('../controllers/posts.controller');
    app.post('/api/create-post',
        upload.array('images'),
        authUser,
        (req, res, next) => {
            console.log('Create post route - files received:', req.files ? req.files.length : 0);
            console.log('Create post route - body keys:', Object.keys(req.body));

            // Process uploaded images to add them to req.body in the format expected by the controller
            // If multer successfully processed files, use those URLs
            if (req.files && req.files.length > 0) {
                console.log('Processing uploaded files:', req.files.length);
                // Create image URLs for the uploaded files
                const host = req.get('host');
                const protocol = req.secure ? 'https' : 'http';
                req.body.images = req.files.map((file) => `${protocol}://${host}/uploads/images/${file.filename}`);
                console.log('Created image URLs:', req.body.images);
            }
            // If no files were uploaded but there were images in the original req.body,
            // ensure the images field is properly handled
            else if (req.body.images) {
                console.log('Using existing images from req.body:', req.body.images);
                // If frontend sent images in req.body but multer didn't process any files,
                // it means request might not have been multipart/form-data
                // We'll keep the original images or ensure it's an array
                req.body.images = Array.isArray(req.body.images) ? req.body.images : (req.body.images ? [req.body.images] : []);
            }
            else {
                console.log('No images provided, setting empty array');
                req.body.images = []; // Ensure images field exists as an array
            }

            // Map field names that differ between frontend and backend
            // Frontend sends 'duration', backend expects 'dateEnd'
            if (req.body.duration !== undefined && req.body.dateEnd === undefined) {
                req.body.dateEnd = req.body.duration;
            }

            // Frontend may send 'endDate' as well; if not present, we may need to calculate it
            if (!req.body.endDate) {
                // Create endDate based on current time + duration (in days)
                const durationInDays = parseInt(req.body.dateEnd) || 30; // Default to 30 days
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + durationInDays);
                req.body.endDate = endDate.toISOString();
            }

            // Completely remove coordinates field to avoid geospatial index issues
            if (req.body.address) {
                // Delete the coordinates field entirely since you don't need it for filtering
                delete req.body.address.coordinates;
            }

            next();
        },
        asyncHandler(controllerPosts.createPost)
    );

    // For other post routes, continue using the router approach (though it's suboptimal)
    app.get('/api/get-posts', postRoutes);
    app.get('/api/get-post-by-id', postRoutes);
    app.get('/api/get-post-by-user-id', postRoutes);
    app.get('/api/get-new-post', postRoutes);
    app.get('/api/get-post-vip', postRoutes);
    app.post('/api/delete-post', authUser, asyncHandler(controllerPosts.deletePost));
    app.put('/api/update-post/:id', authUser, asyncHandler(controllerPosts.updatePost));

    //// admin post
    app.get('/api/get-all-posts', postRoutes);
    app.post('/api/approve-post', postRoutes);
    app.post('/api/reject-post', postRoutes);

    /// payments
    app.post('/api/payments', paymentsRoutes);
    app.get('/api/check-payment-vnpay', paymentsRoutes);
    app.get('/api/check-payment-momo', paymentsRoutes);

    /// post suggest
    app.get('/api/post-suggest', postRoutes);
    app.post('/api/create-post-by-admin', postRoutes);
    app.get('/api/advanced-search', postRoutes);
    app.post('/api/renew-post', postRoutes);

    /// location routes
    app.use('/api', locationRoutes);

    /// messenger
    app.post('/api/create-message', messengerRoutes);
    app.get('/api/get-messages', messengerRoutes);
    app.get('/api/get-messages-by-user-id', messengerRoutes);
    app.post('/api/mark-message-read', messengerRoutes);
    app.post('/api/mark-all-messages-read', messengerRoutes);

    //// favourite
    app.post('/api/create-favourite', favouriteRoutes);
    app.post('/api/delete-favourite', favouriteRoutes);
    app.get('/api/get-favourite', favouriteRoutes);

    ///// uploads
    app.post('/api/upload-images', upload.array('images'), (req, res) => {
        // Use the host from the request or default to localhost
        const host = req.get('host');
        const protocol = req.secure ? 'https' : 'http';
        return res.status(200).json({
            message: 'Images uploaded successfully',
            images: req.files.map((file) => `${protocol}://${host}/uploads/images/${file.filename}`),
        });
    });

    app.post('/api/upload-image', upload.single('avatar'), (req, res) => {
        const file = req.file;
        // Use the host from the request or default to localhost
        const host = req.get('host');
        const protocol = req.secure ? 'https' : 'http';
        return res.status(200).json({
            message: 'Image uploaded successfully',
            image: `${protocol}://${host}/uploads/images/${file.filename}`,
        });
    });

    app.get('/admin', userRoutes);
}

module.exports = routes;
