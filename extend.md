# Hướng Dẫn Triển Khai Chức Năng Gia Hạn Bài Đăng

## Giới thiệu

Trong dự án phòng trọ 123, chức năng gia hạn bài đăng là một tính năng thương mại quan trọng giúp người đăng bài có thể kéo dài thời gian hiển thị của bài đăng trên nền tảng. Tài liệu này sẽ hướng dẫn bạn từng bước triển khai chức năng này từ đầu đến cuối.

## Bước 1: Cài đặt Thư Viện Liên Quan

Trước tiên, chúng ta cần cài đặt các thư viện cần thiết cho chức năng gia hạn bài đăng:

```bash
# Backend dependencies
npm install express mongoose jsonwebtoken bcryptjs dotenv stripe
npm install --save-dev nodemon

# Validation
npm install joi express-validator

# Payment processing (optional)
npm install stripe
```

## Bước 2: Thiết Kế Schema Dữ Liệu

Chúng ta cần cập nhật schema cho bài đăng để hỗ trợ chức năng gia hạn. Tạo hoặc cập nhật file `models/post.model.js`:

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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  typeNews: {
    type: String,
    enum: ['normal', 'vip'],
    default: 'normal',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled'],
    default: 'active',
    index: true
  },
  dateStart: {
    type: Date,
    default: Date.now,
    index: true
  },
  dateEnd: {
    type: Date,
    required: true,
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

// Tạo indexes để tối ưu hiệu suất tìm kiếm và lọc
postSchema.index({ userId: 1, dateEnd: 1 });
postSchema.index({ status: 1, dateEnd: 1 });

module.exports = mongoose.model('Post', postSchema);
```

Cũng cần tạo schema cho lịch sử gia hạn:

```javascript
// models/extensionHistory.model.js
const mongoose = require('mongoose');

const extensionHistorySchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  previousDateEnd: {
    type: Date,
    required: true
  },
  newDateEnd: {
    type: Date,
    required: true
  },
  extensionDays: {
    type: Number,
    required: true
  },
  typeNewsBefore: {
    type: String,
    enum: ['normal', 'vip']
  },
  typeNewsAfter: {
    type: String,
    enum: ['normal', 'vip']
  },
  amountPaid: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['balance', 'credit_card', 'vnpay', 'paypal']
  },
  transactionId: String,
  status: {
    type: String,
    enum: ['completed', 'failed', 'pending'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('ExtensionHistory', extensionHistorySchema);
```

## Bước 3: Tạo Controller Xử Lý Gia Hạn

Tạo file `controllers/extension.controller.js` để xử lý logic gia hạn:

```javascript
const Post = require('../models/post.model');
const ExtensionHistory = require('../models/extensionHistory.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');

class ExtensionController {
  // Hàm xử lý gia hạn bài đăng
  async renewPost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { postId, dateEnd, newTypeNews } = req.body;
      const userId = req.user.id; // Lấy từ middleware xác thực

      // Kiểm tra bài đăng có tồn tại và thuộc về người dùng
      const post = await Post.findOne({ _id: postId, userId: userId });
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Bài đăng không tồn tại hoặc không thuộc quyền sở hữu của bạn'
        });
      }

      // Kiểm tra trạng thái bài đăng
      if (post.status === 'cancelled') {
        return res.status(400).json({
          success: true,
          message: 'Không thể gia hạn bài đăng đã bị hủy'
        });
      }

      // Xác định thời gian gia hạn hợp lệ
      const validExtensions = [3, 7, 30];
      if (!validExtensions.includes(dateEnd)) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian gia hạn không hợp lệ. Chỉ hỗ trợ: 3, 7, 30 ngày'
        });
      }

      // Xác định loại tin (mặc định là loại hiện tại nếu không có newTypeNews)
      const targetTypeNews = newTypeNews || post.typeNews;

      // Tính toán giá tiền dựa trên loại tin và thời gian
      const price = this.calculateExtensionPrice(targetTypeNews, dateEnd);
      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá tiền tính toán không hợp lệ'
        });
      }

      // Lấy thông tin người dùng để kiểm tra số dư
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Người dùng không tồn tại'
        });
      }

      // Kiểm tra số dư
      if (user.balance < price) {
        return res.status(400).json({
          success: false,
          message: 'Số dư không đủ để thực hiện gia hạn',
          requiredAmount: price,
          currentBalance: user.balance
        });
      }

      // Tính toán ngày hết hạn mới
      const currentDate = new Date();
      let startDate = post.dateEnd > currentDate ? post.dateEnd : currentDate;
      const newDateEnd = new Date(startDate.getTime() + dateEnd * 24 * 60 * 60 * 1000);

      // Cập nhật số dư người dùng
      user.balance -= price;
      await user.save();

      // Cập nhật bài đăng
      const previousDateEnd = post.dateEnd;
      const typeNewsBefore = post.typeNews;
      
      post.dateEnd = newDateEnd;
      post.typeNews = targetTypeNews;
      post.status = 'inactive'; // Đặt lại trạng thái để chờ duyệt lại
      
      await post.save();

      // Tạo bản ghi lịch sử gia hạn
      await ExtensionHistory.create({
        postId: post._id,
        userId: userId,
        previousDateEnd: previousDateEnd,
        newDateEnd: newDateEnd,
        extensionDays: dateEnd,
        typeNewsBefore: typeNewsBefore,
        typeNewsAfter: targetTypeNews,
        amountPaid: price,
        paymentMethod: 'balance',
        status: 'completed'
      });

      res.status(200).json({
        success: true,
        message: 'Gia hạn bài đăng thành công',
        data: {
          postId: post._id,
          newDateEnd: newDateEnd,
          typeNews: targetTypeNews,
          amountPaid: price,
          status: post.status
        }
      });
    } catch (error) {
      console.error('Renew post error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi gia hạn bài đăng',
        error: error.message
      });
    }
  }

  // Hàm tính giá gia hạn dựa trên loại tin và số ngày
  calculateExtensionPrice(typeNews, days) {
    const prices = {
      normal: {
        3: 10000,
        7: 60000,
        30: 1000000
      },
      vip: {
        3: 50000,
        7: 315000,
        30: 1200000
      }
    };

    if (prices[typeNews] && prices[typeNews][days] !== undefined) {
      return prices[typeNews][days];
    }

    return 0; // Trả về 0 nếu không tìm thấy giá hợp lệ
  }

  // Hàm lấy lịch sử gia hạn của người dùng
  async getUserExtensionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const history = await ExtensionHistory.find({ userId: userId })
        .populate('postId', 'title dateEnd typeNews')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ExtensionHistory.countDocuments({ userId: userId });

      res.status(200).json({
        success: true,
        data: {
          history,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalResults: total
          }
        }
      });
    } catch (error) {
      console.error('Get extension history error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy lịch sử gia hạn',
        error: error.message
      });
    }
  }

  // Hàm lấy giá gia hạn cho các gói
  async getExtensionPrices(req, res) {
    try {
      const prices = {
        normal: {
          3: 10000,
          7: 60000,
          30: 1000000
        },
        vip: {
          3: 50000,
          7: 315000,
          30: 1200000
        }
      };

      res.status(200).json({
        success: true,
        data: {
          prices,
          validExtensions: [3, 7, 30]
        }
      });
    } catch (error) {
      console.error('Get extension prices error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy bảng giá',
        error: error.message
      });
    }
  }

  // Hàm kiểm tra xem bài đăng có thể gia hạn không
  async canExtendPost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user.id;

      const post = await Post.findOne({ _id: postId, userId: userId });
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Bài đăng không tồn tại hoặc không thuộc quyền sở hữu của bạn'
        });
      }

      // Kiểm tra trạng thái bài đăng
      const canExtend = post.status !== 'cancelled';

      // Tính toán ngày còn lại
      const currentDate = new Date();
      let remainingDays = 0;
      if (post.dateEnd > currentDate) {
        const timeDiff = post.dateEnd.getTime() - currentDate.getTime();
        remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }

      res.status(200).json({
        success: true,
        data: {
          canExtend,
          postStatus: post.status,
          remainingDays,
          dateEnd: post.dateEnd,
          typeNews: post.typeNews
        }
      });
    } catch (error) {
      console.error('Check extension eligibility error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi kiểm tra khả năng gia hạn',
        error: error.message
      });
    }
  }
}

module.exports = new ExtensionController();
```

## Bước 4: Tạo Route Cho Chức Năng Gia Hạn

Tạo file `routes/extension.route.js`:

```javascript
const express = require('express');
const router = express.Router();
const ExtensionController = require('../controllers/extension.controller');
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth'); // Middleware xác thực người dùng

// Validation middleware cho các tham số gia hạn
const validateExtensionParams = [
  body('postId')
    .isMongoId()
    .withMessage('ID bài đăng không hợp lệ'),
  body('dateEnd')
    .isInt({ min: 1 })
    .withMessage('Số ngày gia hạn phải là số nguyên dương')
    .custom(value => {
      if (![3, 7, 30].includes(value)) {
        throw new Error('Chỉ hỗ trợ gia hạn 3, 7 hoặc 30 ngày');
      }
      return true;
    }),
  body('newTypeNews')
    .optional()
    .isIn(['normal', 'vip'])
    .withMessage('Loại tin phải là normal hoặc vip')
];

// Route gia hạn bài đăng
router.post('/renew', auth, validateExtensionParams, ExtensionController.renewPost);

// Route kiểm tra khả năng gia hạn
router.get('/can-extend/:postId', auth, ExtensionController.canExtendPost);

// Route lấy lịch sử gia hạn
router.get('/history', auth, ExtensionController.getUserExtensionHistory);

// Route lấy bảng giá gia hạn
router.get('/prices', ExtensionController.getExtensionPrices);

module.exports = router;
```

## Bước 5: Cập Nhật Main Server File

Cập nhật file `server.js` hoặc `app.js` để thêm route gia hạn:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const extensionRoutes = require('./routes/extension.route');
const auth = require('./middleware/auth'); // Middleware xác thực

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

// Middleware xác thực (nếu cần cho toàn bộ API)
// app.use(auth);

// Routes
app.use('/api/extension', extensionRoutes);

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

## Bước 6: Tạo Middleware Xác Thực (Nếu chưa có)

Tạo file `middleware/auth.js` để xác thực người dùng:

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
    
    // Lấy thông tin người dùng từ database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // Gán thông tin người dùng vào request
    req.user = user;
    
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid token.',
      error: error.message
    });
  }
};

module.exports = auth;
```

## Bước 7: Tạo Service Helper (Tùy chọn)

Tạo file `services/extension.service.js` để tách biệt logic xử lý phức tạp:

```javascript
const Post = require('../models/post.model');
const ExtensionHistory = require('../models/extensionHistory.model');
const User = require('../models/user.model');

class ExtensionService {
  // Hàm kiểm tra tính hợp lệ của yêu cầu gia hạn
  static async validateExtensionRequest(postId, userId, dateEnd, newTypeNews) {
    // Kiểm tra bài đăng có tồn tại và thuộc về người dùng
    const post = await Post.findOne({ _id: postId, userId: userId });
    if (!post) {
      throw new Error('Bài đăng không tồn tại hoặc không thuộc quyền sở hữu của bạn');
    }

    // Kiểm tra trạng thái bài đăng
    if (post.status === 'cancelled') {
      throw new Error('Không thể gia hạn bài đăng đã bị hủy');
    }

    // Xác định thời gian gia hạn hợp lệ
    const validExtensions = [3, 7, 30];
    if (!validExtensions.includes(dateEnd)) {
      throw new Error('Thời gian gia hạn không hợp lệ. Chỉ hỗ trợ: 3, 7, 30 ngày');
    }

    // Xác định loại tin hợp lệ
    const validTypes = ['normal', 'vip'];
    if (newTypeNews && !validTypes.includes(newTypeNews)) {
      throw new Error('Loại tin không hợp lệ. Chỉ hỗ trợ: normal, vip');
    }

    return post;
  }

  // Hàm tính giá gia hạn
  static calculateExtensionPrice(typeNews, days) {
    const prices = {
      normal: {
        3: 10000,
        7: 60000,
        30: 1000000
      },
      vip: {
        3: 50000,
        7: 315000,
        30: 1200000
      }
    };

    if (prices[typeNews] && prices[typeNews][days] !== undefined) {
      return prices[typeNews][days];
    }

    return 0; // Trả về 0 nếu không tìm thấy giá hợp lệ
  }

  // Hàm xử lý quá trình gia hạn
  static async processExtension(post, user, dateEnd, targetTypeNews, price) {
    // Cập nhật số dư người dùng
    user.balance -= price;
    await user.save();

    // Tính toán ngày hết hạn mới
    const currentDate = new Date();
    let startDate = post.dateEnd > currentDate ? post.dateEnd : currentDate;
    const newDateEnd = new Date(startDate.getTime() + dateEnd * 24 * 60 * 60 * 1000);

    // Cập nhật bài đăng
    const previousDateEnd = post.dateEnd;
    const typeNewsBefore = post.typeNews;
    
    post.dateEnd = newDateEnd;
    post.typeNews = targetTypeNews;
    post.status = 'inactive'; // Đặt lại trạng thái để chờ duyệt lại
    
    await post.save();

    // Tạo bản ghi lịch sử gia hạn
    await ExtensionHistory.create({
      postId: post._id,
      userId: user._id,
      previousDateEnd: previousDateEnd,
      newDateEnd: newDateEnd,
      extensionDays: dateEnd,
      typeNewsBefore: typeNewsBefore,
      typeNewsAfter: targetTypeNews,
      amountPaid: price,
      paymentMethod: 'balance',
      status: 'completed'
    });

    return {
      postId: post._id,
      newDateEnd: newDateEnd,
      typeNews: targetTypeNews,
      amountPaid: price,
      status: post.status
    };
  }

  // Hàm gửi thông báo sau khi gia hạn thành công
  static async sendExtensionNotification(postId, userId, result) {
    // Logic gửi thông báo (email, push notification, v.v.)
    console.log(`Gửi thông báo gia hạn thành công cho người dùng ${userId} về bài đăng ${postId}`);
    
    // Ví dụ: Gửi email thông báo
    // await EmailService.sendExtensionSuccessEmail(userId, result);
  }

  // Hàm cập nhật lại chỉ mục tìm kiếm (nếu có hệ thống RAG)
  static async updateSearchIndex(postId) {
    // Logic cập nhật lại chỉ mục tìm kiếm cho bài đăng
    console.log(`Cập nhật lại chỉ mục tìm kiếm cho bài đăng ${postId}`);
    
    // Ví dụ: Gọi API cập nhật RAG
    // await RagService.updatePostIndex(postId);
  }
}

module.exports = ExtensionService;
```

## Bước 8: Cập Nhật Controller Sử Dụng Service

Cập nhật lại controller để sử dụng service:

```javascript
const Post = require('../models/post.model');
const ExtensionHistory = require('../models/extensionHistory.model');
const User = require('../models/user.model');
const ExtensionService = require('../services/extension.service');
const { validationResult } = require('express-validator');

class ExtensionController {
  // Hàm xử lý gia hạn bài đăng
  async renewPost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { postId, dateEnd, newTypeNews } = req.body;
      const userId = req.user.id; // Lấy từ middleware xác thực

      // Xác định loại tin (mặc định là loại hiện tại nếu không có newTypeNews)
      const targetTypeNews = newTypeNews || 'normal'; // Mặc định là 'normal' nếu không có newTypeNews

      // Kiểm tra tính hợp lệ của yêu cầu gia hạn
      const post = await ExtensionService.validateExtensionRequest(postId, userId, dateEnd, targetTypeNews);

      // Tính toán giá tiền
      const price = ExtensionService.calculateExtensionPrice(targetTypeNews, dateEnd);
      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá tiền tính toán không hợp lệ'
        });
      }

      // Lấy thông tin người dùng để kiểm tra số dư
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Người dùng không tồn tại'
        });
      }

      // Kiểm tra số dư
      if (user.balance < price) {
        return res.status(400).json({
          success: false,
          message: 'Số dư không đủ để thực hiện gia hạn',
          requiredAmount: price,
          currentBalance: user.balance
        });
      }

      // Xử lý quá trình gia hạn
      const result = await ExtensionService.processExtension(post, user, dateEnd, targetTypeNews, price);

      // Gửi thông báo
      await ExtensionService.sendExtensionNotification(postId, userId, result);

      // Cập nhật lại chỉ mục tìm kiếm
      await ExtensionService.updateSearchIndex(postId);

      res.status(200).json({
        success: true,
        message: 'Gia hạn bài đăng thành công',
        data: result
      });
    } catch (error) {
      console.error('Renew post error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi gia hạn bài đăng',
        error: error.message
      });
    }
  }

  // Các phương thức khác giữ nguyên...
  async getUserExtensionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const history = await ExtensionHistory.find({ userId: userId })
        .populate('postId', 'title dateEnd typeNews')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ExtensionHistory.countDocuments({ userId: userId });

      res.status(200).json({
        success: true,
        data: {
          history,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalResults: total
          }
        }
      });
    } catch (error) {
      console.error('Get extension history error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy lịch sử gia hạn',
        error: error.message
      });
    }
  }

  async getExtensionPrices(req, res) {
    try {
      const prices = {
        normal: {
          3: 10000,
          7: 60000,
          30: 1000000
        },
        vip: {
          3: 50000,
          7: 315000,
          30: 1200000
        }
      };

      res.status(200).json({
        success: true,
        data: {
          prices,
          validExtensions: [3, 7, 30]
        }
      });
    } catch (error) {
      console.error('Get extension prices error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy bảng giá',
        error: error.message
      });
    }
  }

  async canExtendPost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user.id;

      const post = await Post.findOne({ _id: postId, userId: userId });
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Bài đăng không tồn tại hoặc không thuộc quyền sở hữu của bạn'
        });
      }

      // Kiểm tra trạng thái bài đăng
      const canExtend = post.status !== 'cancelled';

      // Tính toán ngày còn lại
      const currentDate = new Date();
      let remainingDays = 0;
      if (post.dateEnd > currentDate) {
        const timeDiff = post.dateEnd.getTime() - currentDate.getTime();
        remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }

      res.status(200).json({
        success: true,
        data: {
          canExtend,
          postStatus: post.status,
          remainingDays,
          dateEnd: post.dateEnd,
          typeNews: post.typeNews
        }
      });
    } catch (error) {
      console.error('Check extension eligibility error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi kiểm tra khả năng gia hạn',
        error: error.message
      });
    }
  }
}

module.exports = new ExtensionController();
```

## Bước 9: Cập Nhật Model User (Nếu cần)

Cập nhật model người dùng để hỗ trợ số dư:

```javascript
// models/user.model.js (nếu chưa có trường balance)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: String,
  fullName: String,
  avatar: String,
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
```

## Bước 10: Tích Hợp Với Frontend

Tạo file ví dụ cho frontend (React):

```jsx
// client/src/components/ExtensionModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Radio, Space, Typography, Alert, Spin } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

const ExtensionModal = ({ visible, onCancel, postId, currentType, currentDateEnd }) => {
  const [extensionDays, setExtensionDays] = useState(3);
  const [newTypeNews, setNewTypeNews] = useState(currentType);
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchPrices();
    }
  }, [visible]);

  const fetchPrices = async () => {
    try {
      const response = await axios.get('/api/extension/prices');
      setPrices(response.data.data);
    } catch (err) {
      setError('Không thể tải bảng giá. Vui lòng thử lại sau.');
    }
  };

  const calculatePrice = () => {
    if (!prices) return 0;
    return prices[newTypeNews]?.[extensionDays] || 0;
  };

  const handleRenew = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post('/api/extension/renew', {
        postId,
        dateEnd: extensionDays,
        newTypeNews
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onCancel();
          window.location.reload(); // Reload để cập nhật thông tin
        }, 2000);
      } else {
        setError(response.data.message || 'Gia hạn thất bại');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gia hạn bài đăng');
    } finally {
      setLoading(false);
    }
  };

  const price = calculatePrice();

  return (
    <Modal
      title="Gia hạn bài đăng"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleRenew}
          disabled={loading}
        >
          Gia hạn ngay
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 20 }}>
        <Title level={5}>Thông tin bài đăng hiện tại:</Title>
        <Text strong>Loại tin: </Text>
        <Text>{currentType === 'normal' ? 'Tin thường' : 'Tin VIP'}</Text>
        <br />
        <Text strong>Ngày hết hạn: </Text>
        <Text>{new Date(currentDateEnd).toLocaleDateString('vi-VN')}</Text>
      </div>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {success && <Alert message="Gia hạn thành công!" type="success" showIcon style={{ marginBottom: 16 }} />}

      <div style={{ marginBottom: 20 }}>
        <Title level={5}>Chọn thời gian gia hạn:</Title>
        <Radio.Group 
          onChange={(e) => setExtensionDays(e.target.value)} 
          value={extensionDays}
          style={{ width: '100%' }}
        >
          <Space direction="vertical">
            {prices && prices.validExtensions.map(day => (
              <Radio key={day} value={day}>
                {day} ngày - {prices[newTypeNews]?.[day]?.toLocaleString('vi-VN')}đ
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Title level={5}>Chọn loại tin:</Title>
        <Radio.Group 
          onChange={(e) => setNewTypeNews(e.target.value)} 
          value={newTypeNews}
        >
          <Radio value="normal">Tin thường</Radio>
          <Radio value="vip">Tin VIP</Radio>
        </Radio.Group>
      </div>

      <div style={{ padding: '10px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
        <Text strong>Tổng cộng: </Text>
        <Text strong style={{ color: '#ff4d4f' }}>
          {price.toLocaleString('vi-VN')}đ
        </Text>
      </div>

      {loading && <Spin style={{ marginTop: 16, display: 'block' }} tip="Đang xử lý..." />}
    </Modal>
  );
};

export default ExtensionModal;
```

## Cách Sử Dụng API

Sau khi triển khai xong, bạn có thể sử dụng các endpoint sau:

### Gia hạn bài đăng:
```
POST /api/extension/renew
Headers: Authorization: Bearer <jwt_token>
Body: {
  "postId": "ID của bài đăng cần gia hạn",
  "dateEnd": 7,
  "newTypeNews": "vip"
}
```

### Kiểm tra khả năng gia hạn:
```
GET /api/extension/can-extend/:postId
Headers: Authorization: Bearer <jwt_token>
```

### Lấy lịch sử gia hạn:
```
GET /api/extension/history?page=1&limit=10
Headers: Authorization: Bearer <jwt_token>
```

### Lấy bảng giá gia hạn:
```
GET /api/extension/prices
```

## Kết Luận

Chúng ta đã hoàn thành việc triển khai chức năng gia hạn bài đăng với các bước:

1. Cài đặt các thư viện cần thiết
2. Thiết kế schema dữ liệu phù hợp
3. Tạo controller xử lý logic gia hạn
4. Tạo route cho các chức năng
5. Tạo service helper để tách biệt logic phức tạp
6. Thêm validation cho các tham số đầu vào
7. Tích hợp với frontend

Hệ thống gia hạn này đảm bảo tính toàn vẹn dữ liệu, bảo mật người dùng và có thể mở rộng dễ dàng trong tương lai.