const express = require('express');
const router = express.Router();

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

const controllerLocation = require('../controllers/location.controller');

// Get all provinces
router.get('/api/provinces', authAdmin, asyncHandler(controllerLocation.getAllProvinces));

// Get wards by province code
router.get('/api/provinces/:provinceCode/wards', authAdmin, asyncHandler(controllerLocation.getWardsByProvince));

// Get locations for public use (for filters) - no auth required
router.get('/get-locations', asyncHandler(controllerLocation.getLocations));

// Filter posts by various criteria
router.post('/filter-posts', asyncHandler(controllerLocation.filterPosts));

module.exports = router;