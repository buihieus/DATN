
const express = require('express');
const router = express.Router();

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

const controllerPosts = require('../controllers/posts.controller');

// For routes handled by the router (these must still have full paths since they're individually mounted)
// NOTE: /api/create-post, /api/delete-post, and /api/update-post/:id are handled directly in index.js
router.post('/api/create-post-by-admin', authAdmin, asyncHandler(controllerPosts.createPostByAdmin));
router.get('/api/get-posts', asyncHandler(controllerPosts.getPosts));
router.get('/api/get-post-by-id', asyncHandler(controllerPosts.getPostById));
router.get('/api/get-post-by-user-id', authUser, asyncHandler(controllerPosts.getPostByUserId));
router.get('/api/get-new-post', asyncHandler(controllerPosts.getNewPost));
router.get('/api/get-post-vip', asyncHandler(controllerPosts.getPostVip));

router.get('/api/get-all-posts', authAdmin, asyncHandler(controllerPosts.getAllPosts));
router.post('/api/approve-post', authAdmin, asyncHandler(controllerPosts.approvePost));
router.post('/api/reject-post', authAdmin, asyncHandler(controllerPosts.rejectPost));

router.get('/api/post-suggest', authUser, asyncHandler(controllerPosts.postSuggest));

// Advanced search filter route
router.get('/api/advanced-search', asyncHandler(controllerPosts.getFilteredPosts));

// Post renewal route
router.post('/api/renew-post', authUser, asyncHandler(controllerPosts.renewPost));

module.exports = router;
