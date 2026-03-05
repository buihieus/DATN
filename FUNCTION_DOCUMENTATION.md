# TÀI LIỆU MÔ TẢ CHỨC NĂNG CÁC FILE CODE
## Dự án: PhongTro123 - Hệ thống tìm kiếm và đăng tin cho thuê phòng trọ

**Ngày tạo:** 2026-03-05  
**Mô tả:** Tài liệu này mô tả chi tiết chức năng của từng file code và hàm trong dự án (loại trừ các file .md, .txt và folder mobile-app)

---

## MỤC LỤC
1. [SERVER (Node.js/Express)](#server-nodejsexpress)
   - [File chính](#file-chính)
   - [Controllers](#controllers)
   - [Models](#models)
   - [Routes](#routes)
   - [Services](#services)
   - [Auth](#auth)
   - [Config](#config)
   - [Core](#core)
   - [Utils](#utils)
2. [CLIENT (React/Vite)](#client-reactvite)
   - [File chính](#file-chính-client)
   - [Components](#components)
   - [Pages](#pages)
   - [Hooks](#hooks)
   - [Store/Context](#storecontext)
   - [Config](#config-client)
   - [Routes](#routes-client)
   - [Utils](#utils-client)
3. [CHATBOT SERVICE (Python/Flask)](#chatbot-service-pythonflask)

---

## SERVER (Node.js/Express)

### File chính

#### `server/src/server.js`
**Chức năng:** File khởi tạo và cấu hình server Express chính

**Các hàm/biến chính:**
- **Cấu hình Express app:** Thiết lập middleware (CORS, bodyParser, cookiesParser, static files)
- **Cấu hình Socket.IO:** Thiết lập WebSocket server cho chat realtime với hỗ trợ đa nền tảng (web, mobile)
- **`app.use('/api/*')`:** Định tuyến các API routes
- **`app.post('/chat')`:** API endpoint cho chatbot AI
- **`app.get('/ai-search')`:** API endpoint cho tìm kiếm AI
- **`app.post('/api/add-search')`:** API thêm từ khóa tìm kiếm phổ biến
- **Khởi động server:** Lắng nghe trên port 3000
- **Khởi tạo RAG system:** Index bài đăng khi server khởi động
- **Khởi động PostExpirationService:** Dịch vụ kiểm tra bài đăng hết hạn

---

### Controllers

#### `server/src/controllers/posts.controller.js`
**Chức năng:** Xử lý logic nghiệp vụ cho các bài đăng (posts)

**Các hàm:**
- **`createPost(req, res)`:** Tạo bài đăng mới
  - Validate thông tin bài đăng
  - Kiểm tra số dư user để trừ phí đăng bài
  - Lưu bài đăng với status 'inactive' (chờ duyệt)
  - Lên lịch re-index RAG system

- **`createPostByAdmin(req, res)`:** Tạo bài đăng bởi admin
  - Tạo bài đăng với status 'active' ngay lập tức
  - Không trừ phí đăng bài

- **`getPosts(req, res)`:** Lấy danh sách bài đăng với bộ lọc
  - Hỗ trợ lọc theo: category, priceRange, areaRange, location, options
  - Phân trang (page, limit)
  - Chỉ lấy bài đăng còn hạn (endDate >= currentDate)
  - Kèm thông tin user đăng bài

- **`getPostById(req, res)`:** Lấy chi tiết bài đăng theo ID
  - Trả về thông tin bài đăng, user đăng, và danh sách user yêu thích

- **`getPostByUserId(req, res)`:** Lấy tất cả bài đăng của user hiện tại

- **`getNewPost(req, res)`:** Lấy bài đăng mới (trong 3 ngày gần nhất)

- **`getPostVip(req, res)`:** Lấy bài đăng VIP (đã loại bỏ chức năng phân loại VIP)

- **`deletePost(req, res)`:** Xóa bài đăng
  - Kiểm tra quyền sở hữu
  - Hoàn tiền nếu bài chưa được duyệt
  - Re-index RAG system sau khi xóa

- **`getAllPosts(req, res)`:** Lấy tất cả bài đăng (cho admin)
  - Hỗ trợ lọc theo status, category, location
  - Phân trang

- **`approvePost(req, res)`:** Duyệt bài đăng (admin)
  - Chuyển status từ 'inactive' sang 'active'
  - Gửi email thông báo duyệt bài

- **`rejectPost(req, res)`:** Từ chối bài đăng (admin)
  - Chuyển status sang 'cancel'
  - Gửi email thông báo từ chối
  - Hoàn tiền phí đăng bài

- **`updatePost(req, res)`:** Cập nhật bài đăng
  - Kiểm tra quyền sở hữu
  - Cập nhật thông tin bài đăng
  - Re-index RAG system

- **`postSuggest(req, res)`:** Lấy bài đăng gợi ý

- **`advancedSearch(req, res)`:** Tìm kiếm nâng cao
  - Hỗ trợ nhiều bộ lọc phức tạp: location, price, area, amenities
  - Tìm kiếm theo tọa độ địa lý

- **`renewPost(req, res)`:** Gia hạn bài đăng
  - Kiểm tra số dư user
  - gia hạn endDate
  - Trừ phí gia hạn

---

#### `server/src/controllers/users.controller.js`
**Chức năng:** Xử lý logic nghiệp vụ cho người dùng

**Các hàm:**
- **`register(req, res)`:** Đăng ký user mới
  - Validate thông tin
  - Mã hóa password bằng bcrypt
  - Tạo API key và token
  - Set cookies (token, refreshToken, logged)

- **`login(req, res)`:** Đăng nhập bằng email/password
  - Kiểm tra thông tin đăng nhập
  - Tạo token và refreshToken
  - Set cookies

- **`loginGoogle(req, res)`:** Đăng nhập bằng Google
  - Giải mã Google credential
  - Tạo mới hoặc đăng nhập user existing
  - Set cookies

- **`authUser(req, res)`:** Xác thực user
  - Trả về thông tin user đã mã hóa AES

- **`logout(req, res)`:** Đăng xuất
  - Xóa cookies
  - Xử lý logout cho web và mobile

- **`refreshToken(req, res)`:** Làm mới access token
  - Verify refreshToken
  - Tạo token và refreshToken mới
  - Cập nhật cookies

- **`getAdminStats(req, res)`:** Lấy thống kê cho admin dashboard
  - Thống kê users, posts, transactions, revenue
  - Tính toán tăng trưởng
  - Lấy top users, recent transactions

- **`changePassword(req, res)`:** Đổi mật khẩu
  - Kiểm tra mật khẩu cũ
  - Mã hóa và lưu mật khẩu mới

- **`getRechargeUser(req, res)`:** Lấy lịch sử nạp tiền của user

- **`updateUser(req, res)`:** Cập nhật thông tin user
  - Cập nhật: fullName, phone, email, address, avatar

- **`updateUserByAdmin(req, res)`:** Admin cập nhật thông tin user khác
  - Có thể cập nhật cả isAdmin status

- **`getUsers(req, res)`:** Lấy danh sách users (admin)
  - Hỗ trợ tìm kiếm theo fullName, email

- **`deleteUser(req, res)`:** Xóa user (admin)

- **`createUserByAdmin(req, res)`:** Tạo user mới (admin)

- **`forgotPassword(req, res)`:** Xử lý quên mật khẩu
  - Tạo OTP và gửi email

- **`resetPassword(req, res)`:** Đặt lại mật khẩu
  - Verify OTP
  - Cập nhật mật khẩu mới

- **`getHotSearch(req, res)`:** Lấy từ khóa tìm kiếm phổ biến

- **`search(req, res)`:** Tìm kiếm bài đăng theo keyword

- **`addSearchKeyword(req, res)`:** Thêm từ khóa tìm kiếm

- **`getSearchKeyword(req, res)`:** Lấy danh sách từ khóa tìm kiếm

- **`getRechargeStats(req, res)`:** Lấy thống kê nạp tiền

---

#### `server/src/controllers/messager.controller.js`
**Chức năng:** Xử lý logic nghiệp vụ cho nhắn tin

**Các hàm:**
- **`createMessage(req, res)`:** Tạo tin nhắn mới
  - Lưu tin nhắn vào database
  - Emit socket event 'new-message' cho người nhận
  - Emit 'new-conversation' để cập nhật danh sách hội thoại

- **`getMessages(req, res)`:** Lấy tin nhắn giữa 2 user
  - Đánh dấu tin nhắn đã đọc

- **`markMessageAsRead(req, res)`:** Đánh dấu 1 tin nhắn đã đọc

- **`markAllMessagesAsRead(req, res)`:** Đánh dấu tất cả tin nhắn đã đọc
  - Emit socket event 'messages-read' cho người gửi

- **`getMessagesByUserId(req, res)`:** Lấy danh sách hội thoại của user
  - Trả về danh sách user đã nhắn tin
  - Kèm unread count và last message
  - Include online/offline status

---

#### `server/src/controllers/favourite.controller.js`
**Chức năng:** Xử lý logic nghiệp vụ cho tin yêu thích

**Các hàm:**
- **`createFavourite(req, res)`:** Thêm bài đăng vào yêu thích
  - Kiểm tra trùng lặp
  - Emit socket event 'new-favourite' cho chủ bài đăng

- **`deleteFavourite(req, res)`:** Xóa bài đăng khỏi yêu thích

- **`getFavourite(req, res)`:** Lấy danh sách bài đăng yêu thích

---

#### `server/src/controllers/location.controller.js`
**Chức năng:** Xử lý logic nghiệp vụ cho địa điểm và lọc bài đăng

**Các hàm:**
- **`getLocations(req, res)`:** Lấy danh sách địa điểm (tỉnh/thành, phường/xã)
  - Lấy từ MongoDB collection 'vn-units'
  - Hỗ trợ lấy tất cả provinces hoặc wards theo province code

- **`filterPosts(req, res)`:** Lọc bài đăng theo nhiều tiêu chí
  - Lọc theo: category, location, price, area, options
  - Xử lý options filter linh hoạt (array hoặc object)
  - Chỉ lấy bài đăng còn hạn

---

#### `server/src/controllers/payments.controller.js`
**Chức năng:** Xử lý logic nghiệp vụ cho thanh toán

**Các hàm:**
- **`payments(req, res)`:** Khởi tạo thanh toán
  - Hỗ trợ MoMo và VNPay
  - Tạo payment URL và trả về client

- **`checkPaymentMomo(req, res)`:** Xử lý callback từ MoMo
  - Verify kết quả thanh toán
  - Cập nhật balance cho user
  - Lưu lịch sử giao dịch
  - Emit socket event 'new-payment'
  - Xử lý cho cả WebView (mobile) và browser

- **`checkPaymentVnpay(req, res)`:** Xử lý callback từ VNPay
  - Gọi vnpayService để verify
  - Cập nhật balance và lưu lịch sử
  - Xử lý cho cả WebView và browser

---

### Models

#### `server/src/models/post.model.js`
**Chức năng:** Schema MongoDB cho bài đăng

**Fields:**
- `title`: Tiêu đề bài đăng
- `price`: Giá thuê
- `description`: Mô tả
- `images`: Mảng URL hình ảnh
- `userId`: ID người đăng
- `category`: Danh mục (phong-tro, nha-nguyen-can, can-ho-chung-cu, can-ho-mini, o-ghep)
- `address`: Object chứa provinceCode, wardCode, street, fullAddress
- `phone`: Số điện thoại
- `username`: Tên người liên hệ
- `area`: Diện tích (m²)
- `options`: Mảng tiện nghi (String array)
- `status`: Trạng thái (active, inactive, cancel, expired)
- `typeNews`: Loại tin (vip, normal)
- `fee`: Phí đăng bài
- `feeDuration`: Số ngày đăng
- `endDate`: Ngày hết hạn
- `createdAt`, `updatedAt`: Timestamps

---

#### `server/src/models/users.model.js`
**Chức năng:** Schema MongoDB cho người dùng

**Fields:**
- `fullName`: Tên đầy đủ
- `email`: Email
- `password`: Mật khẩu mã hóa
- `address`: Địa chỉ
- `avatar`: URL avatar
- `phone`: Số điện thoại
- `isAdmin`: Có phải admin không
- `isActive`: Trạng thái hoạt động
- `balance`: Số dư tài khoản
- `typeLogin`: Loại đăng nhập (email, google)
- `createdAt`, `updatedAt`: Timestamps

---

#### `server/src/models/Messager.model.js`
**Chức năng:** Schema MongoDB cho tin nhắn

**Fields:**
- `senderId`: ID người gửi
- `receiverId`: ID người nhận
- `message`: Nội dung tin nhắn
- `status`: Trạng thái
- `isRead`: Đã đọc chưa
- `createdAt`, `updatedAt`: Timestamps

---

#### `server/src/models/favourite.model.js`
**Chức năng:** Schema MongoDB cho tin yêu thích

**Fields:**
- `userId`: ID người dùng
- `postId`: ID bài đăng
- Unique index trên (userId, postId)
- `createdAt`, `updatedAt`: Timestamps

---

#### `server/src/models/RechargeUser.model.js`
**Chức năng:** Schema MongoDB cho lịch sử nạp tiền

**Fields:**
- `userId`: ID người dùng
- `amount`: Số tiền nạp
- `typePayment`: Phương thức thanh toán (MOMO, VNPAY)
- `status`: Trạng thái giao dịch
- `createdAt`, `updatedAt`: Timestamps

---

#### `server/src/models/apiKey.model.js`
**Chức năng:** Schema MongoDB cho API keys (dùng cho JWT)

**Fields:**
- `userId`: ID người dùng
- `publicKey`: Public key RSA
- `privateKey`: Private key RSA
- `createdAt`, `updatedAt`: Timestamps

---

#### `server/src/models/province.model.js`
**Chức năng:** Schema MongoDB cho đơn vị hành chính Việt Nam

**Fields:**
- `Type`: Loại (province)
- `Code`: Mã tỉnh/thành
- `Name`: Tên
- `NameEn`: Tên tiếng Anh
- `FullName`: Tên đầy đủ
- `FullNameEn`: Tên đầy đủ tiếng Anh
- `CodeName`: Tên mã hóa
- `AdministrativeUnitId`: ID đơn vị hành chính
- `Wards`: Mảng các phường/xã (embedded schema)

**Ward Schema:**
- `Code`: Mã phường/xã
- `Name`: Tên
- `FullName`: Tên đầy đủ
- `Type`: Loại (ward)
- `ProvinceCode`: Mã tỉnh/thành

---

#### `server/src/models/otp.model.js`
**Chức năng:** Schema MongoDB cho OTP (xác thực quên mật khẩu, verify account)

**Fields:**
- `email`: Email nhận OTP
- `otp`: Mã OTP
- `time`: Thời gian tạo (tự động xóa sau 300s)
- `type`: Loại OTP (forgotPassword, verifyAccount)
- `createdAt`, `updatedAt`: Timestamps

---

#### `server/src/models/keyWordSearch.model.js`
**Chức năng:** Schema MongoDB cho từ khóa tìm kiếm phổ biến

**Fields:**
- `title`: Từ khóa
- `count`: Số lần tìm kiếm
- `createdAt`, `updatedAt`: Timestamps

---

### Routes

#### `server/src/routes/index.js`
**Chức năng:** Định tuyến tất cả các API endpoints

**Các routes chính:**
- **User routes:** `/api/register`, `/api/login`, `/api/auth`, `/api/logout`, `/api/refresh-token`, `/api/update-user`, `/api/change-password`, `/api/get-users`, `/api/get-admin-stats`, v.v.
- **Post routes:** `/api/create-post`, `/api/get-posts`, `/api/get-post-by-id`, `/api/delete-post`, `/api/update-post`, `/api/get-all-posts`, `/api/approve-post`, `/api/reject-post`, v.v.
- **Payment routes:** `/api/payments`, `/api/check-payment-vnpay`, `/api/check-payment-momo`
- **Messenger routes:** `/api/create-message`, `/api/get-messages`, `/api/get-messages-by-user-id`, v.v.
- **Favourite routes:** `/api/create-favourite`, `/api/delete-favourite`, `/api/get-favourite`
- **Location routes:** `/api/get-locations`
- **Upload routes:** `/api/upload-images`, `/api/upload-image`

**Middleware:**
- `upload.array('images')`: Xử lý upload nhiều hình ảnh
- `authUser`: Xác thực user
- `authAdmin`: Xác thực admin

---

#### `server/src/routes/users.routes.js`
**Chức năng:** Router cho các endpoints user (kết hợp với index.js)

---

#### `server/src/routes/posts.routes.js`
**Chức năng:** Router cho các endpoints posts

---

#### `server/src/routes/payments.routes.js`
**Chức năng:** Router cho các endpoints payments

---

#### `server/src/routes/messenger.routes.js`
**Chức năng:** Router cho các endpoints messenger

---

#### `server/src/routes/favourite.routes.js`
**Chức năng:** Router cho các endpoints favourite

---

#### `server/src/routes/location.routes.js`
**Chức năng:** Router cho các endpoints location

---

#### `server/src/routes/RechargeUser.routes.js`
**Chức năng:** Router cho các endpoints recharge user

---

### Services

#### `server/src/services/socketServices.js`
**Chức năng:** Xử lý kết nối WebSocket (Socket.IO)

**Các hàm:**
- **`connection(socket)`:** Xử lý khi có client kết nối
  - Xác thực token từ cookie/header/auth object
  - Hỗ trợ cả web và mobile clients
  - Lưu socket vào `usersMap` (1 user có thể có nhiều sockets)
  - Xử lý các events: `join-room`, `leave-room`, `disconnect`
  - Phát sóng user status (online/offline) cho các user khác

---

#### `server/src/services/tokenSevices.js`
**Chức năng:** Xử lý JWT tokens với RSA encryption

**Các hàm:**
- **`createApiKey(userId)`:** Tạo API key với RSA keypair cho user
- **`createToken(payload)`:** Tạo access token (hết hạn 2h)
- **`createRefreshToken(payload)`:** Tạo refresh token (hết hạn 7 ngày)
- **`verifyToken(token)`:** Xác thực token

---

#### `server/src/services/vnpay.service.js`
**Chức năng:** Xử lý tích hợp thanh toán VNPay

**Các hàm:**
- **`createPaymentUrl(paymentData)`:** Tạo URL thanh toán VNPay
  - Build payment URL với các thông tin giao dịch
  - Xử lý amount, orderInfo, returnUrl

- **`handlePaymentReturn(query)`:** Xử lý callback từ VNPay
  - Verify chữ ký VNPay
  - Xử lý kết quả thanh toán
  - Extract userId từ transaction reference

- **`processSuccessfulPayment(userId, amount)`:** Xử lý thanh toán thành công
  - Cập nhật balance user
  - Lưu lịch sử giao dịch
  - Phát socket event

- **`extractUserIdFromTxnRef(txnRef)`:** Extract userId từ transaction reference

- **`extractUserIdFromOrderInfo(orderInfo)`:** Extract userId từ order info

- **`getClientIp(req)`:** Lấy IP client

- **`generateTxnRef(userId)`:** Tạo transaction reference

---

#### `server/src/services/postExpiration.service.js`
**Chức năng:** Dịch vụ tự động kiểm tra và cập nhật bài đăng hết hạn

**Các hàm:**
- **`checkAndExpirePosts()`:** Kiểm tra và cập nhật status bài đăng hết hạn
  - Tìm bài đăng có endDate < currentDate và status = 'active'
  - Cập nhật status thành 'expired'

- **`startExpirationCheck(intervalMinutes)`:** Khởi động kiểm tra định kỳ
  - Chạy ngay khi khởi động
  - Kiểm tra mỗi N phút (mặc định 60 phút)
  - Trả về object với hàm `stop()` để dừng dịch vụ

---

### Auth

#### `server/src/auth/checkAuth.js`
**Chức năng:** Middleware xác thực người dùng

**Các hàm:**
- **`asyncHandler(fn)`:** Wrapper cho async functions để xử lý lỗi
- **`extractToken(req)`:** Trích xuất token từ header hoặc cookie
- **`authUser(req, res, next)`:** Middleware xác thực user thường
  - Verify token
  - Gán decoded user vào req.user

- **`authAdmin(req, res, next)`:** Middleware xác thực admin
  - Verify token
  - Kiểm tra isAdmin flag
  - Từ chối nếu không phải admin

---

### Config

#### `server/src/config/ConnectDB.js`
**Chức năng:** Kết nối MongoDB

**Các hàm:**
- **`connectDB()`:** Kết nối đến MongoDB
  - Sử dụng Mongoose
  - Lấy connection string từ environment variable

---

### Core

#### `server/src/core/success.response.js`
**Chức năng:** Class responses cho thành công

**Các class:**
- **`OK`:** Response thành công chung (200)
- **`Created`:** Response tạo mới thành công (201)

---

#### `server/src/core/error.response.js`
**Chức năng:** Class exceptions cho lỗi

**Các class:**
- **`BadRequestError`:** Lỗi yêu cầu không hợp lệ (400)
- **`BadUserRequestError`:** Lỗi yêu cầu người dùng (400)
- **`BadUser2RequestError`:** Lỗi yêu cầu người dùng loại 2 (400)

---

#### `server/src/core/statusCodes.js`
**Chức năng:** Định nghĩa HTTP status codes

---

#### `server/src/core/reasonPhrases.js`
**Chức năng:** Định nghĩa reason phrases cho HTTP status codes

---

### Utils

#### `server/src/utils/Chatbot/chatbot.js`
**Chức năng:** Chatbot AI với RAG system (Node.js version)

**Các hàm:**
- **`askQuestion(question)`:** Xử lý câu hỏi và trả lời
- **`reindexPosts(source)`:** Re-index bài đăng vào vector store
- **`initStore()`:** Khởi tạo vector store

---

#### `server/src/utils/AISearch/AISearch.js`
**Chức năng:** Tìm kiếm AI cho bài đăng và từ khóa

**Các hàm:**
- **`AiSearch(question)`:** Tìm kiếm bài đăng bằng AI
- **`AiSearchKeyword(keyword)`:** Tìm kiếm từ khóa bằng AI

---

#### `server/src/utils/SendMail/SendMailApprove.js`
**Chức năng:** Gửi email thông báo duyệt bài

**Các hàm:**
- **`SendMailApprove(email, postTitle)`:** Gửi email duyệt bài

---

#### `server/src/utils/SendMail/SendMailReject.js`
**Chức năng:** Gửi email thông báo từ chối bài

**Các hàm:**
- **`SendMailReject(email, postTitle, reason)`:** Gửi email từ chối bài

---

#### `server/src/utils/SendMail/sendMailForgotPassword.js`
**Chức năng:** Gửi email quên mật khẩu

**Các hàm:**
- **`sendMailForgotPassword(email, otp)`:** Gửi email với OTP

---

#### `server/src/utils/RAG/` (folder)
**Chức năng:** RAG (Retrieval-Augmented Generation) system components

**Files:**
- **`vectorStore.js`:** Lưu trữ và tìm kiếm vector embeddings
- **`documentIndexer.js`:** Index tài liệu vào vector store
- **`retrievalSystem.js`:** Hệ thống retrieval documents
- **`ragChatbot.js`:** Chatbot sử dụng RAG

---

### Test Files

#### `server/test_api.js`, `server/test_search.js`, `server/test-rag.js`
**Chức năng:** Test scripts cho API và RAG system

---

#### `server/check_data.js`, `server/check_db.js`
**Chức năng:** Scripts kiểm tra database và data

---

## CLIENT (React/Vite)

### File chính

#### `client/src/main.jsx`
**Chức năng:** Entry point của ứng dụng React

**Chức năng:**
- Render app vào DOM
- Cấu hình Router
- Wrap với Providers (Context, AuthProvider)

---

#### `client/src/App.jsx`
**Chức năng:** Component App chính

**Chức năng:**
- Setup layout chính (Header, HomePage)
- Sử dụng useSocket hook cho realtime features
- Hiển thị notifications

---

#### `client/src/ResultsPage.jsx`
**Chức năng:** Trang hiển thị kết quả tìm kiếm

**Chức năng:**
- Lấy search params từ URL
- Gọi API advanced search hoặc regular search
- Hiển thị kết quả với CardBody components
- Xử lý loading state

---

### Components

#### `client/src/Components/Header/Header.jsx`
**Chức năng:** Header component với navigation và search

**Chức năng:**
- Hiển thị logo, search bar, filter button
- User menu (dropdown với profile, admin link, logout)
- Category navigation
- Location search modal
- Filter panel integration
- Handle logout
- Sync filters với URL

---

#### `client/src/Components/HomePage/HomePage.jsx`
**Chức năng:** Trang chủ hiển thị danh sách bài đăng

**Chức năng:**
- Fetch posts với filters từ URL params
- Hiển thị filters: category, price range, area range
- Pagination
- Hiển thị bài đăng mới và gợi ý
- Sync filters với URL
- Request throttling (chống spam API calls)

---

#### `client/src/Components/CardBody/CardBody.jsx`
**Chức năng:** Card hiển thị thông tin bài đăng

**Chức năng:**
- Hiển thị thumbnail, title, price, location, area
- Format giá tiền
- Link đến chi tiết bài đăng

---

#### `client/src/Components/Chatbot/Chatbot.jsx`
**Chức năng:** Chatbot AI component

**Chức năng:**
- Giao diện chat với AI
- Gọi API chatbot
- Hiển thị câu trả lời với rooms (nếu có)

---

#### `client/src/Components/filter/FilterPanel.jsx`
**Chức năng:** Panel lọc bài đăng nâng cao

**Chức năng:**
- Tích hợp nhiều filters: location, category, price, area, options
- Range filters cho price và area
- Amenities filter
- Apply filters và update URL

---

#### `client/src/Components/filter/LocationFilter.jsx`, `HeaderLocationFilter.jsx`
**Chức năng:** Filter theo địa điểm

---

#### `client/src/Components/filter/PriceFilter.jsx`, `PriceRangeFilter.jsx`
**Chức năng:** Filter theo giá

---

#### `client/src/Components/filter/AreaFilter.jsx`, `AreaRangeFilter.jsx`
**Chức năng:** Filter theo diện tích

---

#### `client/src/Components/filter/CategoryFilter.jsx`
**Chức năng:** Filter theo danh mục

---

#### `client/src/Components/filter/OptionsFilter.jsx`
**Chức năng:** Filter theo tiện nghi

---

#### `client/src/Components/Layout/Layout.jsx`
**Chức năng:** Layout wrapper

**Chức năng:**
- Wrap header, main content, footer
- Setup structure chung

---

#### `client/src/Components/Layout/AuthProvider.jsx`
**Chức năng:** Provider cho authentication

**Chức năng:**
- Initialize token manager
- Monitor token expiration
- Auto refresh token

---

#### `client/src/Components/PostModal/PostModal.jsx`
**Chức năng:** Modal hướng dẫn đăng bài

**Chức năng:**
- Hiển thị thông tin về việc đăng bài
- Link đến trang tạo bài đăng

---

#### `client/src/Components/Footer/Footer.jsx`
**Chức năng:** Footer component

---

### Pages

#### `client/src/Pages/LoginUser/LoginUser.jsx`
**Chức năng:** Trang đăng nhập

**Chức năng:**
- Form đăng nhập (email/password)
- Google login integration
- Redirect sau khi login thành công

---

#### `client/src/Pages/RegisterUser/RegisterUser.jsx`
**Chức năng:** Trang đăng ký

**Chức năng:**
- Form đăng ký user mới
- Validate form
- Gọi API register

---

#### `client/src/Pages/InfoUser/InfoUser.jsx`
**Chức năng:** Trang thông tin cá nhân

**Chức năng:**
- Hiển thị thông tin user
- Tabs: Personal Info, Manager Post, Recharge, Change Password
- Handle payment notifications

---

#### `client/src/Pages/InfoUser/Components/PersonalInfo/PersonalInfo.jsx`
**Chức năng:** Form thông tin cá nhân

**Chức năng:**
- Hiển thị và edit thông tin user
- Upload avatar

---

#### `client/src/Pages/InfoUser/Components/ManagerPost/ManagerPost.jsx`
**Chức năng:** Quản lý bài đăng của user

**Chức năng:**
- Hiển thị danh sách bài đăng của user
- Actions: edit, delete, renew
- Stats: active, expired, pending posts

---

#### `client/src/Pages/InfoUser/Components/ManagerPost/RenewPostModal.jsx`
**Chức năng:** Modal gia hạn bài đăng

**Chức năng:**
- Chọn gói gia hạn (3, 7, 30 ngày)
- Thanh toán gia hạn

---

#### `client/src/Pages/InfoUser/Components/ManagerPost/AddPostForm.jsx`
**Chức năng:** Form thêm bài đăng

---

#### `client/src/Pages/InfoUser/Components/RechargeUser/RechargeUser.jsx`
**Chức năng:** Trang nạp tiền

**Chức năng:**
- Chọn số tiền nạp
- Chọn phương thức thanh toán (MoMo, VNPay)
- Xử lý thanh toán

---

#### `client/src/Pages/InfoUser/Components/ChangePassword/ChangePassword.jsx`
**Chức năng:** Đổi mật khẩu

**Chức năng:**
- Form đổi mật khẩu
- Validate mật khẩu cũ/mới

---

#### `client/src/Pages/CreatePost/CreatePost.jsx`
**Chức năng:** Trang tạo bài đăng mới

**Chức năng:**
- Form tạo bài đăng với đầy đủ fields
- Upload images
- Location selector (province, ward, street)
- Amenities selector
- Preview form
- Submit create post API

---

#### `client/src/Pages/DetailPost/DetailPost.jsx`
**Chức năng:** Trang chi tiết bài đăng

**Chức năng:**
- Hiển thị đầy đủ thông tin bài đăng
- Image gallery
- Thông tin người đăng
- Actions: call phone, send message, favourite
- Chat modal
- Map location

---

#### `client/src/Pages/Admin/Index.jsx`
**Chức năng:** Admin dashboard

**Chức năng:**
- Dashboard với thống kê
- Tabs: Dashboard, Manager User, Manager Post, Manager Recharge
- Admin-only access

---

#### `client/src/Pages/Admin/Components/Dashborad/Dashborad.jsx`
**Chức năng:** Admin dashboard stats

**Chức năng:**
- Hiển thị thống kê: users, posts, revenue, transactions
- Charts
- Recent transactions
- Top users

---

#### `client/src/Pages/Admin/Components/ManagerUser/ManagerUser.jsx`
**Chức năng:** Quản lý users

**Chức năng:**
- Danh sách users
- Search users
- Actions: edit, delete, toggle admin status

---

#### `client/src/Pages/Admin/Components/ManagerPost/ManagerPost.jsx`, `ManagerAllPosts.jsx`
**Chức năng:** Quản lý bài đăng

**Chức năng:**
- Danh sách bài đăng chờ duyệt
- Actions: approve, reject, delete
- Filter theo status

---

#### `client/src/Pages/Admin/Components/ManagerRechange/ManagerRechange.jsx`
**Chức năng:** Quản lý giao dịch nạp tiền

---

#### `client/src/Pages/ForgotPassword/ForgotPassword.jsx`
**Chức năng:** Trang quên mật khẩu

**Chức năng:**
- Form nhập email
- Gửi OTP
- Form nhập OTP và mật khẩu mới

---

#### `client/src/Pages/AISearch/AISearch.jsx`
**Chức năng:** Trang tìm kiếm AI

**Chức năng:**
- Chat interface với AI
- Tìm kiếm bài đăng bằng ngôn ngữ tự nhiên
- Hiển thị kết quả với rooms

---

#### `client/src/routes/NotFoundPage.jsx`
**Chức năng:** Trang 404

---

#### `client/src/routes/ProtectedRoute.jsx`
**Chức năng:** Route bảo vệ cho user đã đăng nhập

**Chức năng:**
- Check authentication
- Redirect to login if not authenticated

---

#### `client/src/routes/ProtectedRouteAdmin.jsx`
**Chức năng:** Route bảo vệ cho admin

**Chức năng:**
- Check authentication và admin status
- Redirect if not admin

---

#### `client/src/routes/index.jsx`
**Chức năng:** Định nghĩa routes

**Chức năng:**
- Cấu hình public routes
- Nested routes với Layout
- Protected routes

---

### Hooks

#### `client/src/hooks/useSocket.jsx`
**Chức năng:** Hook cho Socket.IO connection

**Chức năng:**
- Khởi tạo socket connection
- Listen events: `new-payment`, `new-favourite`, `new-message`, `messages-read`
- Fetch messages
- Update conversation list
- Export socket methods: `joinRoom`, `leaveRoom`

---

#### `client/src/hooks/useStore.jsx`
**Chức năng:** Hook để access Context store

**Chức năng:**
- Return context value (dataUser, setDataUser, etc.)

---

#### `client/src/hooks/useDebounce.jsx`
**Chức năng:** Hook debounce cho search

**Chức năng:**
- Delay value changes để tránh spam API calls

---

### Store/Context

#### `client/src/store/Context.jsx`
**Chức năng:** Tạo React Context

---

#### `client/src/store/Provider.jsx`
**Chức năng:** Context Provider

**Chức năng:**
- Cung cấp global state: dataUser, dataPayment, dataMessages, dataSearch
- Fetch auth user on mount
- Handle search functionality
- Expose methods: fetchAuth, setValueSearch

---

### Config

#### `client/src/config/request.jsx`
**Chức năng:** Cấu hình Axios và API requests

**Chức năng:**
- Tạo axios instance với baseURL và credentials
- Tạo chatbotRequest instance cho Python chatbot service
- Request interceptor
- Response interceptor với token refresh logic
- Export tất cả API request functions

**API functions:**
- User: `requestRegister`, `requestLogin`, `requestLogout`, `requestAuth`, `requestRefreshToken`, `requestUpdateUser`, `requestChangePassword`, v.v.
- Post: `requestCreatePost`, `requestGetPosts`, `requestUpdatePost`, `requestDeletePost`, `requestApprovePost`, v.v.
- Payment: `requestPayments`, `requestGetRechargeUser`
- Messenger: `requestCreateMessage`, `requestGetMessages`, `requestGetMessagesByUserId`, v.v.
- Favourite: `requestCreateFavourite`, `requestDeleteFavourite`, `requestGetFavourite`
- Location: `requestGetLocations`, `requestFilterPosts`
- Admin: `requestGetAdminStats`, `requestGetUsers`, `requestDeleteUser`, v.v.
- Chatbot: `requestChatbot`, `requestAISearch`

---

### Utils

#### `client/src/utils/tokenManager.js`
**Chức năng:** Quản lý token expiration và auto-refresh

**Các hàm:**
- **`decodeToken(token)`:** Giải mã JWT token
- **`isTokenExpiringSoon(token)`:** Kiểm tra token có sắp hết hạn không (trong 5 phút)
- **`refreshTokenIfNeeded()`:** Refresh token nếu cần
- **`startMonitoring()`:** Bắt đầu monitoring token (check mỗi 1 phút)
- **`stopMonitoring()`:** Dừng monitoring
- **`initialize()`:** Khởi tạo token manager

---

#### `client/src/utils/ChatButton/ChatButton.jsx`
**Chức năng:** Button mở chat

---

#### `client/src/utils/ChatMiniList/ChatMiniList.jsx`
**Chức năng:** Danh sách chat thu nhỏ

---

#### `client/src/utils/GlobalMessaging/GlobalMessaging.jsx`
**Chức năng:** Component messaging global

---

#### `client/src/utils/Messager/Messager.jsx`
**Chức năng:** Component nhắn tin

---

## CHATBOT SERVICE (Python/Flask)

### File chính

#### `chatbot_service/main.py`
**Chức năng:** Flask app chính cho chatbot service

**Chức năng:**
- Khởi tạo Flask app với CORS
- Khởi tạo VectorStore và ChatBot
- Setup routes: `/`, `/chat`, `/reindex`, `/health`
- Start periodic reindexing thread (mỗi 6 giờ)
- Run Flask server trên port 8000

**Routes:**
- **`/` (GET):** API information
- **`/health` (GET):** Health check endpoint
- **`/chat` (POST):** Chat với RAG-based chatbot
- **`/reindex` (POST):** Reindex tất cả bài đăng vào vector database

---

#### `chatbot_service/chatbot.py`
**Chức năng:** Chatbot AI với RAG system

**Class: ChatBot**

**Các hàm:**
- **`__init__(vector_store)`:** Khởi tạo chatbot với vector store
- **`init_chatbot()`:** Khởi tạo LLM client (OpenAI hoặc Gemini)
- **`_call_llm(prompt)`:** Gọi LLM với prompt
- **`_extract_category_from_question(question)`:** Extract danh mục từ câu hỏi
- **`_extract_area_range_from_question(question)`:** Extract diện tích từ câu hỏi
- **`_extract_amenities_from_question(question)`:** Extract tiện nghi từ câu hỏi
- **`_extract_location_from_question(question)`:** Extract địa điểm từ câu hỏi
- **`_extract_price_range_from_question(question)`:** Extract khoảng giá từ câu hỏi
- **`_is_rental_request(question)`:** Xác định xem có phải yêu cầu tìm phòng không
- **`_filter_documents_by_criteria(docs, location, price, area, category, amenities)`:** Filter documents theo tiêu chí
- **`process_question(question, user_id, session_id)`:** Xử lý câu hỏi chính
  - Extract criteria từ question
  - Search vector store
  - Filter results
  - Create prompt cho LLM
  - Format response với rooms (nếu có)

- **`_format_room_for_response(doc)`:** Format room data cho response
- **`_format_room_response(response_text, docs)`:** Extract và format rooms từ LLM response

---

#### `chatbot_service/vector_store.py`
**Chức năng:** Vector store với ChromaDB và OpenAI embeddings

**Class: VectorStore**

**Các hàm:**
- **`__init__(db_handler)`:** Khởi tạo vector store
- **`init_store()`:** Khởi tạo ChromaDB client và collection
- **`embed_text(text)`:** Tạo embedding cho text bằng OpenAI
- **`embed_texts(texts)`:** Tạo embeddings cho nhiều texts
- **`simple_text_embedding(text)`:** Fallback embedding khi OpenAI không available
- **`index_posts(force)`:** Index posts từ database vào vector store
- **`index_posts_from_api(force)`:** Index posts từ API vào vector store
- **`fetch_posts_from_api()`:** Fetch posts từ Node.js API
- **`search(query, top_k)`:** Search documents trong vector store
- **`get_document_by_id(doc_id)`:** Lấy document theo ID

---

#### `chatbot_service/database.py`
**Chức năng:** MongoDB handler cho chatbot service

**Class: MongoDBHandler**

**Các hàm:**
- **`__init__()`:** Khởi tạo MongoDB handler
- **`connect()`:** Kết nối MongoDB
- **`close()`:** Đóng kết nối
- **`get_all_posts()`:** Lấy tất cả posts
- **`get_posts_by_ids(post_ids)`:** Lấy posts theo IDs
- **`get_posts_by_filters(filters)`:** Lấy posts theo filters

---

#### `chatbot_service/simple_chatbot.py`, `enhanced_simple_chatbot.py`
**Chức năng:** Simple chatbot implementations (không dùng RAG)

---

#### `chatbot_service/test_*.py`
**Chức năng:** Test scripts cho chatbot service

- **`test_simple_chatbot.py`:** Test simple chatbot
- **`test_image_parsing.py`:** Test image parsing
- **`test_persistence.py`:** Test persistence
- **`test_images.py`:** Test images
- **`check_vector_db.py`:** Check vector database
- **`debug_chatbot_db.py`:** Debug chatbot database

---

#### `chatbot_service/start.bat`, `chatbot_service/start.sh`
**Chức năng:** Scripts khởi động chatbot service (Windows/Linux)

---

## TEST FILES (Root level)

#### `test_auth.js`, `test_route.js`, `test_transaction_detail.js`
**Chức năng:** Test scripts cho authentication, routes, và transaction details

---

## TÓM TẮT KIẾN TRÚC

### Server (Node.js/Express)
- **Port:** 3000
- **Database:** MongoDB
- **Authentication:** JWT với RSA encryption
- **Realtime:** Socket.IO
- **Payment:** MoMo, VNPay integration
- **AI:** RAG system với OpenAI/Gemini

### Client (React/Vite)
- **Port:** 5173
- **State Management:** React Context
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Realtime:** Socket.IO client
- **UI Library:** Ant Design

### Chatbot Service (Python/Flask)
- **Port:** 8000
- **Framework:** Flask
- **Vector Store:** ChromaDB
- **Embeddings:** OpenAI
- **LLM:** OpenAI GPT hoặc Google Gemini

---

## LUỒNG DỮ LIỆU CHÍNH

### 1. User Registration/Login
```
Client → POST /api/register or /api/login → Server
→ Create API key → Create JWT tokens → Set cookies → Response
```

### 2. Create Post
```
Client → POST /api/create-post (with images) → Server
→ Validate → Check balance → Create post (status: inactive)
→ Schedule RAG reindex → Response
→ Admin approves → status: active
```

### 3. Search Posts
```
Client → GET /api/get-posts or /api/advanced-search (with filters) → Server
→ Build query → Filter MongoDB → Response with posts
```

### 4. AI Search
```
Client → POST /chat (question) → Python Chatbot Service
→ Extract criteria → Search vector store → Build prompt
→ Call LLM → Format response with rooms → Response
```

### 5. Realtime Messaging
```
Client A → Connect Socket.IO → Server
→ Client A → POST /api/create-message → Server
→ Save message → Emit 'new-message' event → Client B receives
```

### 6. Payment Flow
```
Client → POST /api/payments → Server → Create payment URL → Response
Client → Redirect to payment gateway (MoMo/VNPay)
→ User pays → Gateway callback → Server
→ Verify → Update balance → Save transaction → Emit socket event
→ Redirect back to Client
```

---

**END OF DOCUMENTATION**
