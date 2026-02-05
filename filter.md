# Hướng Dẫn Triển Khai Chức Năng Lọc Tìm Kiếm Nâng Cao

## Giới thiệu

Trong dự án phòng trọ 123, việc triển khai một hệ thống lọc tìm kiếm nâng cao là rất quan trọng để giúp người dùng tìm được phòng trọ phù hợp với các tiêu chí cụ thể. Tài liệu này sẽ hướng dẫn bạn từng bước triển khai chức năng này từ đầu đến cuối.

## Bước 1: Cài đặt Thư Viện Liên Quan

Trước tiên, chúng ta cần cài đặt các thư viện cần thiết cho chức năng lọc tìm kiếm nâng cao. Trong dự án Node.js/Express, chúng ta sẽ sử dụng các thư viện sau:

```bash
npm install express mongoose body-parser cors helmet
npm install --save-dev nodemon
```

Nếu bạn muốn tích hợp tìm kiếm全文 (full-text search), bạn cũng nên cài đặt:

```bash
npm install elastic-builder elasticsearch
```

## Bước 2: Thiết Kế Schema Dữ Liệu

Chúng ta cần thiết kế schema cho bài đăng phòng trọ để hỗ trợ các tiêu chí lọc. Tạo file `models/post.model.js`:

```javascript
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    index: true
  },
  area: {
    type: Number,
    required: true,
    index: true
  },
  address: {
    province: {
      type: String,
      required: true,
      index: true
    },
    district: {
      type: String,
      required: true,
      index: true
    },
    ward: {
      type: String,
      required: true,
      index: true
    },
    street: String,
    detail: String
  },
  category: {
    type: String,
    enum: ['phong-tro', 'nha-nguyen-can', 'can-ho', 'mat-bang'],
    required: true,
    index: true
  },
  images: [String],
  amenities: [{
    type: String,
    enum: [
      'may-lanh', 'noi-that', 'gac-xep', 'bep', 'tu-lanh', 
      'may-giat', 'thang-may', 'bao-ve', 'gio-giac-tu-do', 
      'khong-chung-chu', 'ban-cong', 'an-ninh'
    ],
    index: true
  }],
  utilities: {
    wifi: Boolean,
    parking: Boolean,
    elevator: Boolean,
    security: Boolean,
    kitchen: Boolean,
    air_conditioner: Boolean,
    balcony: Boolean
  },
  contact: {
    name: String,
    phone: String,
    email: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'rented'],
    default: 'active',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo indexes để tối ưu hiệu suất tìm kiếm
postSchema.index({ 
  'address.province': 1, 
  'address.district': 1, 
  'address.ward': 1 
});
postSchema.index({ price: 1 });
postSchema.index({ area: 1 });
postSchema.index({ category: 1 });
postSchema.index({ amenities: 1 });

module.exports = mongoose.model('Post', postSchema);
```

## Bước 3: Tạo Controller Xử Lý Lọc

Tạo file `controllers/filter.controller.js` để xử lý logic lọc:

```javascript
const Post = require('../models/post.model');
const { validationResult } = require('express-validator');

class FilterController {
  // Hàm xử lý lọc bài đăng
  async filterPosts(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Lấy các tham số lọc từ request
      const {
        category,
        province,
        district,
        ward,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        amenities,
        utilities,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = req.query;

      // Tạo đối tượng điều kiện lọc
      let filter = {};

      // Lọc theo danh mục
      if (category) {
        filter.category = category;
      }

      // Lọc theo địa điểm
      if (province) {
        filter['address.province'] = province;
      }
      if (district) {
        filter['address.district'] = district;
      }
      if (ward) {
        filter['address.ward'] = ward;
      }

      // Lọc theo giá tiền
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) {
          filter.price.$gte = parseFloat(minPrice);
        }
        if (maxPrice) {
          filter.price.$lte = parseFloat(maxPrice);
        }
      }

      // Lọc theo diện tích
      if (minArea || maxArea) {
        filter.area = {};
        if (minArea) {
          filter.area.$gte = parseFloat(minArea);
        }
        if (maxArea) {
          filter.area.$lte = parseFloat(maxArea);
        }
      }

      // Lọc theo tiện nghi
      if (amenities) {
        const amenitiesArray = Array.isArray(amenities) ? amenities : amenities.split(',');
        filter.amenities = { $all: amenitiesArray };
      }

      // Lọc theo tiện ích
      if (utilities) {
        const utilitiesObj = typeof utilities === 'string' ? JSON.parse(utilities) : utilities;
        
        Object.keys(utilitiesObj).forEach(key => {
          if (utilitiesObj[key]) {
            filter[`utilities.${key}`] = true;
          }
        });
      }

      // Lọc theo trạng thái
      filter.status = 'active';

      // Tính toán phân trang
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Sắp xếp
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Thực hiện truy vấn
      const posts = await Post.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

      // Đếm tổng số kết quả
      const total = await Post.countDocuments(filter);

      // Trả về kết quả
      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalResults: total,
            hasNextPage: parseInt(page) * parseInt(limit) < total,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      console.error('Filter posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Hàm tìm kiếm nâng cao với fuzzy matching
  async advancedSearch(req, res) {
    try {
      const { keyword, category, location, priceRange, amenities, page = 1, limit = 10 } = req.query;

      // Tạo điều kiện tìm kiếm
      let filter = { status: 'active' };

      // Tìm kiếm theo từ khóa trong tiêu đề hoặc mô tả
      if (keyword) {
        filter.$or = [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } }
        ];
      }

      // Lọc theo danh mục
      if (category) {
        filter.category = category;
      }

      // Lọc theo vị trí
      if (location) {
        filter.$or = [
          ...(filter.$or || []),
          { 'address.province': { $regex: location, $options: 'i' } },
          { 'address.district': { $regex: location, $options: 'i' } },
          { 'address.ward': { $regex: location, $options: 'i' } },
          { 'address.detail': { $regex: location, $options: 'i' } }
        ];
      }

      // Lọc theo khoảng giá
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (!isNaN(min)) {
          filter.price = { ...filter.price, $gte: min };
        }
        if (!isNaN(max) && max > 0) {
          filter.price = { ...filter.price, $lte: max };
        }
      }

      // Lọc theo tiện nghi
      if (amenities) {
        const amenitiesArray = Array.isArray(amenities) ? amenities : amenities.split(',');
        filter.amenities = { $all: amenitiesArray };
      }

      // Tính toán phân trang
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Thực hiện truy vấn
      const posts = await Post.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .exec();

      // Đếm tổng số kết quả
      const total = await Post.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalResults: total,
            hasNextPage: parseInt(page) * parseInt(limit) < total,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      console.error('Advanced search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Hàm lấy các tùy chọn lọc phổ biến
  async getFilterOptions(req, res) {
    try {
      // Lấy danh sách tỉnh thành phố
      const provinces = await Post.distinct('address.province');
      
      // Lấy danh sách danh mục
      const categories = await Post.distinct('category');
      
      // Lấy các mức giá phổ biến
      const priceRanges = [
        { label: 'Dưới 1 triệu', range: '0-1000000' },
        { label: '1 - 2 triệu', range: '1000000-2000000' },
        { label: '2 - 3 triệu', range: '2000000-3000000' },
        { label: '3 - 5 triệu', range: '3000000-5000000' },
        { label: '5 - 7 triệu', range: '5000000-7000000' },
        { label: '7 - 10 triệu', range: '7000000-10000000' },
        { label: 'Trên 10 triệu', range: '10000000-' }
      ];
      
      // Lấy các mức diện tích phổ biến
      const areaRanges = [
        { label: 'Dưới 20m²', range: '0-20' },
        { label: '20 - 30m²', range: '20-30' },
        { label: '30 - 50m²', range: '30-50' },
        { label: '50 - 70m²', range: '50-70' },
        { label: '70 - 90m²', range: '70-90' },
        { label: 'Trên 90m²', range: '90-' }
      ];

      // Lấy danh sách tiện nghi phổ biến
      const amenities = await Post.distinct('amenities');

      res.status(200).json({
        success: true,
        data: {
          provinces,
          categories,
          priceRanges,
          areaRanges,
          amenities
        }
      });
    } catch (error) {
      console.error('Get filter options error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new FilterController();
```

## Bước 4: Tạo Route Cho Chức Năng Lọc

Tạo file `routes/filter.route.js`:

```javascript
const express = require('express');
const router = express.Router();
const FilterController = require('../controllers/filter.controller');
const { query, validationResult } = require('express-validator');

// Validation middleware cho các tham số lọc
const validateFilterParams = [
  query('category')
    .optional()
    .isIn(['phong-tro', 'nha-nguyen-can', 'can-ho', 'mat-bang'])
    .withMessage('Category must be one of: phong-tro, nha-nguyen-can, can-ho, mat-bang'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),
    
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
    
  query('minArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min area must be a positive number'),
    
  query('maxArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max area must be a positive number'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Route lọc bài đăng cơ bản
router.get('/filter', validateFilterParams, FilterController.filterPosts);

// Route tìm kiếm nâng cao
router.get('/search', validateFilterParams, FilterController.advancedSearch);

// Route lấy tùy chọn lọc
router.get('/options', FilterController.getFilterOptions);

module.exports = router;
```

## Bước 5: Cập Nhật Main Server File

Cập nhật file `server.js` hoặc `app.js` để thêm route lọc:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const filterRoutes = require('./routes/filter.route');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phongtro123', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Routes
app.use('/api', filterRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

## Bước 6: Tạo Service Helper (Tùy chọn)

Tạo file `services/filter.service.js` để tách biệt logic xử lý phức tạp:

```javascript
class FilterService {
  // Hàm xây dựng điều kiện lọc phức tạp
  static buildComplexFilter(filters) {
    const conditions = [];

    // Điều kiện địa điểm
    if (filters.location) {
      const locationConditions = [];
      
      if (filters.location.province) {
        locationConditions.push({ 'address.province': filters.location.province });
      }
      
      if (filters.location.district) {
        locationConditions.push({ 'address.district': filters.location.district });
      }
      
      if (filters.location.ward) {
        locationConditions.push({ 'address.ward': filters.location.ward });
      }
      
      if (locationConditions.length > 0) {
        conditions.push({ $and: locationConditions });
      }
    }

    // Điều kiện giá
    if (filters.price) {
      const priceCondition = {};
      if (filters.price.min !== undefined) {
        priceCondition.$gte = filters.price.min;
      }
      if (filters.price.max !== undefined) {
        priceCondition.$lte = filters.price.max;
      }
      
      if (Object.keys(priceCondition).length > 0) {
        conditions.push({ price: priceCondition });
      }
    }

    // Điều kiện diện tích
    if (filters.area) {
      const areaCondition = {};
      if (filters.area.min !== undefined) {
        areaCondition.$gte = filters.area.min;
      }
      if (filters.area.max !== undefined) {
        areaCondition.$lte = filters.area.max;
      }
      
      if (Object.keys(areaCondition).length > 0) {
        conditions.push({ area: areaCondition });
      }
    }

    // Điều kiện tiện nghi
    if (filters.amenities && filters.amenities.length > 0) {
      conditions.push({ amenities: { $all: filters.amenities } });
    }

    // Điều kiện tiện ích
    if (filters.utilities) {
      const utilityConditions = [];
      
      Object.entries(filters.utilities).forEach(([key, value]) => {
        if (value) {
          utilityConditions.push({ [`utilities.${key}`]: value });
        }
      });
      
      if (utilityConditions.length > 0) {
        conditions.push({ $and: utilityConditions });
      }
    }

    // Kết hợp tất cả điều kiện với $and
    return conditions.length > 0 ? { $and: conditions } : {};
  }

  // Hàm tính toán phân trang
  static calculatePagination(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      currentPage: page,
      totalPages,
      totalResults: total,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    };
  }

  // Hàm chuẩn hóa tham số lọc
  static normalizeFilterParams(params) {
    const normalized = { ...params };

    // Chuẩn hóa giá trị boolean
    if (normalized.utilities) {
      Object.keys(normalized.utilities).forEach(key => {
        if (typeof normalized.utilities[key] === 'string') {
          normalized.utilities[key] = normalized.utilities[key].toLowerCase() === 'true';
        }
      });
    }

    // Chuẩn hóa khoảng giá
    if (normalized.minPrice !== undefined) {
      normalized.minPrice = parseFloat(normalized.minPrice);
    }
    if (normalized.maxPrice !== undefined) {
      normalized.maxPrice = parseFloat(normalized.maxPrice);
    }

    // Chuẩn hóa khoảng diện tích
    if (normalized.minArea !== undefined) {
      normalized.minArea = parseFloat(normalized.minArea);
    }
    if (normalized.maxArea !== undefined) {
      normalized.maxArea = parseFloat(normalized.maxArea);
    }

    return normalized;
  }
}

module.exports = FilterService;
```

## Bước 7: Cập Nhật Controller Sử Dụng Service

Cập nhật lại controller để sử dụng service:

```javascript
const Post = require('../models/post.model');
const FilterService = require('../services/filter.service');
const { validationResult } = require('express-validator');

class FilterController {
  async filterPosts(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Lấy và chuẩn hóa tham số
      const params = FilterService.normalizeFilterParams(req.query);
      
      // Xây dựng điều kiện lọc
      const filter = FilterService.buildComplexFilter({
        location: {
          province: params.province,
          district: params.district,
          ward: params.ward
        },
        price: {
          min: params.minPrice,
          max: params.maxPrice
        },
        area: {
          min: params.minArea,
          max: params.maxArea
        },
        amenities: params.amenities ? 
          (Array.isArray(params.amenities) ? params.amenities : params.amenities.split(',')) : [],
        utilities: params.utilities
      });

      // Thêm điều kiện trạng thái
      filter.status = 'active';

      // Tính toán phân trang
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 10;
      const skip = (page - 1) * limit;

      // Sắp xếp
      const sort = {};
      sort[params.sortBy || 'createdAt'] = params.sortOrder === 'asc' ? 1 : -1;

      // Thực hiện truy vấn
      const posts = await Post.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();

      // Đếm tổng số kết quả
      const total = await Post.countDocuments(filter);

      // Tính toán thông tin phân trang
      const pagination = FilterService.calculatePagination(page, limit, total);

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination
        }
      });
    } catch (error) {
      console.error('Filter posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Các phương thức khác giữ nguyên...
  async advancedSearch(req, res) {
    try {
      const { keyword, category, location, priceRange, amenities, page = 1, limit = 10 } = req.query;

      // Tạo điều kiện tìm kiếm
      let filter = { status: 'active' };

      // Tìm kiếm theo từ khóa trong tiêu đề hoặc mô tả
      if (keyword) {
        filter.$or = [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } }
        ];
      }

      // Lọc theo danh mục
      if (category) {
        filter.category = category;
      }

      // Lọc theo vị trí
      if (location) {
        filter.$or = [
          ...(filter.$or || []),
          { 'address.province': { $regex: location, $options: 'i' } },
          { 'address.district': { $regex: location, $options: 'i' } },
          { 'address.ward': { $regex: location, $options: 'i' } },
          { 'address.detail': { $regex: location, $options: 'i' } }
        ];
      }

      // Lọc theo khoảng giá
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (!isNaN(min)) {
          filter.price = { ...filter.price, $gte: min };
        }
        if (!isNaN(max) && max > 0) {
          filter.price = { ...filter.price, $lte: max };
        }
      }

      // Lọc theo tiện nghi
      if (amenities) {
        const amenitiesArray = Array.isArray(amenities) ? amenities : amenities.split(',');
        filter.amenities = { $all: amenitiesArray };
      }

      // Tính toán phân trang
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Thực hiện truy vấn
      const posts = await Post.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .exec();

      // Đếm tổng số kết quả
      const total = await Post.countDocuments(filter);

      // Tính toán thông tin phân trang
      const pagination = FilterService.calculatePagination(page, limit, total);

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination
        }
      });
    } catch (error) {
      console.error('Advanced search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  async getFilterOptions(req, res) {
    try {
      // Lấy danh sách tỉnh thành phố
      const provinces = await Post.distinct('address.province');
      
      // Lấy danh sách danh mục
      const categories = await Post.distinct('category');
      
      // Lấy các mức giá phổ biến
      const priceRanges = [
        { label: 'Dưới 1 triệu', range: '0-1000000' },
        { label: '1 - 2 triệu', range: '1000000-2000000' },
        { label: '2 - 3 triệu', range: '2000000-3000000' },
        { label: '3 - 5 triệu', range: '3000000-5000000' },
        { label: '5 - 7 triệu', range: '5000000-7000000' },
        { label: '7 - 10 triệu', range: '7000000-10000000' },
        { label: 'Trên 10 triệu', range: '10000000-' }
      ];
      
      // Lấy các mức diện tích phổ biến
      const areaRanges = [
        { label: 'Dưới 20m²', range: '0-20' },
        { label: '20 - 30m²', range: '20-30' },
        { label: '30 - 50m²', range: '30-50' },
        { label: '50 - 70m²', range: '50-70' },
        { label: '70 - 90m²', range: '70-90' },
        { label: 'Trên 90m²', range: '90-' }
      ];

      // Lấy danh sách tiện nghi phổ biến
      const amenities = await Post.distinct('amenities');

      res.status(200).json({
        success: true,
        data: {
          provinces,
          categories,
          priceRanges,
          areaRanges,
          amenities
        }
      });
    } catch (error) {
      console.error('Get filter options error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new FilterController();
```

## Bước 8: Tạo File Validation (Tùy chọn)

Tạo file `validators/filter.validator.js` để quản lý validation riêng:

```javascript
const { query, body } = require('express-validator');

const filterValidator = [
  query('category')
    .optional()
    .isIn(['phong-tro', 'nha-nguyen-can', 'can-ho', 'mat-bang'])
    .withMessage('Danh mục phải là một trong các giá trị: phong-tro, nha-nguyen-can, can-ho, mat-bang'),
  
  query('province')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Tỉnh/Thành phố không hợp lệ'),
    
  query('district')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Quận/Huyện không hợp lệ'),
    
  query('ward')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Phường/Xã không hợp lệ'),
    
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá tối thiểu phải là số dương'),
    
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá tối đa phải là số dương'),
    
  query('minArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Diện tích tối thiểu phải là số dương'),
    
  query('maxArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Diện tích tối đa phải là số dương'),
    
  query('amenities')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const amenities = value.split(',');
        // Thêm validation cho từng tiện nghi nếu cần
        return true;
      }
      return Array.isArray(value);
    })
    .withMessage('Tiện nghi phải là chuỗi phân cách bởi dấu phẩy hoặc mảng'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1 đến 100')
];

module.exports = {
  filterValidator
};
```

## Bước 9: Cập Nhật Route Sử Dụng Validator Mới

Cập nhật lại route để sử dụng validator mới:

```javascript
const express = require('express');
const router = express.Router();
const FilterController = require('../controllers/filter.controller');
const { filterValidator } = require('../validators/filter.validator');

// Route lọc bài đăng cơ bản
router.get('/filter', filterValidator, FilterController.filterPosts);

// Route tìm kiếm nâng cao
router.get('/search', filterValidator, FilterController.advancedSearch);

// Route lấy tùy chọn lọc
router.get('/options', FilterController.getFilterOptions);

module.exports = router;
```

## Bước 10: Tối Ưu Hóa Hiệu Suất

Để tối ưu hiệu suất, bạn nên thêm các chỉ mục (indexes) vào MongoDB như đã được định nghĩa trong schema ở Bước 2. Ngoài ra, bạn có thể thêm caching bằng Redis:

```bash
npm install redis
```

Tạo file `middleware/cache.middleware.js`:

```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

await client.connect();

const cacheMiddleware = async (req, res, next) => {
  try {
    // Tạo cache key từ URL và query params
    const key = `filter:${JSON.stringify(req.query)}`;
    
    // Kiểm tra cache
    const cachedResult = await client.get(key);
    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }
    
    // Nếu không có trong cache, tiếp tục xử lý
    // Gắn hàm để lưu kết quả vào cache sau khi xử lý xong
    res.sendResponse = res.json;
    res.json = (body) => {
      // Chỉ cache nếu request thành công
      if (body.success && req.method === 'GET') {
        client.setEx(key, 300, JSON.stringify(body)); // Cache trong 5 phút
      }
      res.sendResponse(body);
    };
    
    next();
  } catch (error) {
    console.error('Cache middleware error:', error);
    next();
  }
};

module.exports = cacheMiddleware;
```

## Cách Sử Dụng API

Sau khi triển khai xong, bạn có thể sử dụng các endpoint sau:

### Lọc bài đăng cơ bản:
```
GET /api/filter?category=phong-tro&province=Hanoi&minPrice=2000000&maxPrice=5000000&amenities=may-lanh,noi-that&page=1&limit=10
```

### Tìm kiếm nâng cao:
```
GET /api/search?keyword=phong tro dep&location=Thanh Xuan&priceRange=2000000-4000000&amenities=may-lanh,gac-xep
```

### Lấy tùy chọn lọc:
```
GET /api/options
```

## Kết Luận

Chúng ta đã hoàn thành việc triển khai chức năng lọc tìm kiếm nâng cao với các bước:

1. Cài đặt các thư viện cần thiết
2. Thiết kế schema dữ liệu phù hợp
3. Tạo controller xử lý logic lọc
4. Tạo route cho các chức năng
5. Tạo service helper để tách biệt logic phức tạp
6. Thêm validation cho các tham số đầu vào
7. Tối ưu hiệu suất với indexing và caching

Hệ thống lọc này có thể mở rộng dễ dàng để thêm các tiêu chí lọc mới trong tương lai.