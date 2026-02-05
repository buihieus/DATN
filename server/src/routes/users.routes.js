const express = require('express');
const router = express.Router();

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

const controllerUsers = require('../controllers/users.controller');
const modelUser = require('../models/users.model');
const { BadRequestError } = require('../core/error.response');

router.post('/api/register', asyncHandler(controllerUsers.register));
router.post('/api/login', asyncHandler(controllerUsers.login));
router.post('/api/login-google', asyncHandler(controllerUsers.loginGoogle));
router.get('/api/auth', authUser, asyncHandler(controllerUsers.authUser));
router.get('/api/logout', authUser, asyncHandler(controllerUsers.logout));
router.get('/api/refresh-token', asyncHandler(controllerUsers.refreshToken));
router.get('/api/recharge-user', authUser, asyncHandler(controllerUsers.getRechargeUser));
router.post('/api/update-user', authUser, asyncHandler(controllerUsers.updateUser));
router.post('/api/change-password', authUser, asyncHandler(controllerUsers.changePassword));
router.post('/api/forgot-password', asyncHandler(controllerUsers.forgotPassword));
router.post('/api/reset-password', asyncHandler(controllerUsers.resetPassword));

router.get('/api/get-hot-search', asyncHandler(controllerUsers.getHotSearch));
router.get('/api/search', asyncHandler(controllerUsers.searchKeyword));

router.post('/api/add-search-keyword', asyncHandler(controllerUsers.addSearchKeyword));
router.get('/api/get-search-keyword', asyncHandler(controllerUsers.searchKeyword));

// User management endpoints
router.get('/api/get-users', authAdmin, asyncHandler(controllerUsers.getUsers));
router.get('/api/get-admin-stats', authAdmin, asyncHandler(controllerUsers.getAdminStats));
router.get('/api/get-public-stats', asyncHandler(controllerUsers.getPublicStats)); // Public stats that don't require admin
router.get('/api/get-recharge-stats', authAdmin, asyncHandler(controllerUsers.getRechargeStats));
router.put('/api/update-user-by-admin/:id', authAdmin, asyncHandler(controllerUsers.updateUserByAdmin));
router.post('/api/delete-user', authAdmin, asyncHandler(controllerUsers.deleteUser));
router.post('/api/create-user-by-admin', authAdmin, asyncHandler(controllerUsers.createUserByAdmin));

router.get('/admin', authAdmin, (req, res) => {
    return res.status(200).json({ message: true });
});

// Temporary route to make a user an admin - REMOVE THIS AFTER SETTING UP ADMIN
router.post('/api/make-admin', asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await modelUser.findOne({ email });
    if (!user) {
        throw new BadRequestError('User not found');
    }
    user.isAdmin = true;
    await user.save();
    return res.status(200).json({ message: 'User made admin successfully', user: { email: user.email, isAdmin: user.isAdmin } });
}));

module.exports = router;
