# MÔ TẢ MỤC ĐÍCH CÁC FILE CODE TRONG DỰ ÁN
## Dự án: PhongTro123 - Hệ thống tìm kiếm và đăng tin cho thuê phòng trọ

**Ngày tạo:** 2026-03-05

**Lưu ý:** Tài liệu này mô tả ngắn gọn mục đích chính của từng file code trong dự án (loại trừ các file .md, .txt và folder mobile-app)

---

## 📁 SERVER (Node.js/Express) - Backend API

### 📄 File Server Chính

| File | Mục đích |
|------|----------|
| `server/src/server.js` | **File khởi tạo server chính** - Khởi chạy Express app, Socket.IO server, cấu hình middleware, định tuyến API, khởi động RAG system và dịch vụ kiểm tra bài đăng hết hạn |

---

### 📂 Controllers - Xử lý logic nghiệp vụ

| File | Mục đích |
|------|----------|
| `server/src/controllers/posts.controller.js` | **Xử lý nghiệp vụ bài đăng** - Tạo, đọc, cập nhật, xóa bài đăng; duyệt/bài từ chối (admin); gia hạn; tìm kiếm nâng cao |
| `server/src/controllers/users.controller.js` | **Xử lý nghiệp vụ người dùng** - Đăng ký, đăng nhập, đăng xuất, quên mật khẩu, cập nhật thông tin, thống kê admin |
| `server/src/controllers/messager.controller.js` | **Xử lý nghiệp vụ nhắn tin** - Tạo tin nhắn, lấy tin nhắn, đánh dấu đã đọc, emit socket events |
| `server/src/controllers/favourite.controller.js` | **Xử lý nghiệp vụ yêu thích** - Thêm/xóa bài vào yêu thích, lấy danh sách yêu thích |
| `server/src/controllers/location.controller.js` | **Xử lý nghiệp vụ địa điểm** - Lấy danh sách tỉnh/phường, lọc bài đăng theo vị trí và tiện nghi |
| `server/src/controllers/payments.controller.js` | **Xử lý nghiệp vụ thanh toán** - Khởi tạo thanh toán MoMo/VNPay, xử lý callback, cập nhật balance |

---

### 📂 Models - Schema MongoDB

| File | Mục đích |
|------|----------|
| `server/src/models/post.model.js` | **Schema bài đăng** - Định nghĩa cấu trúc dữ liệu cho bài đăng (title, price, images, location, options, status, endDate, etc.) |
| `server/src/models/users.model.js` | **Schema người dùng** - Định nghĩa cấu trúc dữ liệu cho user (fullName, email, password, avatar, balance, isAdmin, etc.) |
| `server/src/models/Messager.model.js` | **Schema tin nhắn** - Định nghĩa cấu trúc cho tin nhắn chat (senderId, receiverId, message, isRead) |
| `server/src/models/favourite.model.js` | **Schema yêu thích** - Định nghĩa quan hệ user-post yêu thích (userId, postId) |
| `server/src/models/RechargeUser.model.js` | **Schema nạp tiền** - Lưu lịch sử giao dịch nạp tiền (userId, amount, typePayment, status) |
| `server/src/models/apiKey.model.js` | **Schema API key** - Lưu RSA keypair cho JWT authentication (userId, publicKey, privateKey) |
| `server/src/models/province.model.js` | **Schema địa danh VN** - Lưu dữ liệu đơn vị hành chính Việt Nam (tỉnh, phường với Code, Name, Wards) |
| `server/src/models/otp.model.js` | **Schema OTP** - Lưu mã OTP cho quên mật khẩu/xác thực (email, otp, type, time-to-live 5 phút) |
| `server/src/models/keyWordSearch.model.js` | **Schema từ khóa tìm kiếm** - Lưu từ khóa tìm kiếm phổ biến (title, count) |

---

### 📂 Routes - Định tuyến API

| File | Mục đích |
|------|----------|
| `server/src/routes/index.js` | **Router chính** - Định tuyến tất cả API endpoints cho users, posts, payments, messenger, favourites, locations, uploads |
| `server/src/routes/users.routes.js` | **Router users** - Xử lý các route cho user (register, login, auth, logout, update, admin operations) |
| `server/src/routes/posts.routes.js` | **Router posts** - Xử lý các route cho posts (get, approve, reject, create-by-admin) |
| `server/src/routes/payments.routes.js` | **Router payments** - Xử lý route cho payments |
| `server/src/routes/messenger.routes.js` | **Router messenger** - Xử lý route cho messenger |
| `server/src/routes/favourite.routes.js` | **Router favourite** - Xử lý route cho favourite |
| `server/src/routes/location.routes.js` | **Router location** - Sử dụng LocationController |
| `server/src/routes/RechargeUser.routes.js` | **Router recharge** - Xử lý route cho recharge user |

---

### 📂 Services - Dịch vụ xử lý

| File | Mục đích |
|------|----------|
| `server/src/services/socketServices.js` | **Xử lý WebSocket** - Quản lý kết nối Socket.IO, xác thực socket, join/leave rooms, phát sóng user status |
| `server/src/services/tokenSevices.js` | **Xử lý JWT tokens** - Tạo API key, access token (2h), refresh token (7 ngày), verify token với RSA encryption |
| `server/src/services/vnpay.service.js` | **Xử lý VNPay** - Tạo payment URL, verify callback, xử lý thanh toán thành công/thất bại |
| `server/src/services/postExpiration.service.js` | **Xử lý bài hết hạn** - Tự động kiểm tra và cập nhật status bài đăng hết hạn thành 'expired' (chạy mỗi 60 phút) |

---

### 📂 Auth - Xác thực

| File | Mục đích |
|------|----------|
| `server/src/auth/checkAuth.js` | **Middleware xác thực** - Kiểm tra token, phân quyền user/admin, async handler wrapper |

---

### 📂 Config - Cấu hình

| File | Mục đích |
|------|----------|
| `server/src/config/ConnectDB.js` | **Kết nối MongoDB** - Thiết lập connection đến MongoDB bằng Mongoose |

---

### 📂 Core - Xử lý response/error

| File | Mục đích |
|------|----------|
| `server/src/core/success.response.js` | **Response thành công** - Định nghĩa class OK (200) và Created (201) cho responses |
| `server/src/core/error.response.js` | **Xử lý lỗi** - Định nghĩa các error classes (BadRequestError, BadUserRequestError, etc.) |
| `server/src/core/statusCodes.js` | **HTTP status codes** - Định nghĩa mã trạng thái HTTP |
| `server/src/core/reasonPhrases.js` | **Reason phrases** - Định nghĩa mô tả cho HTTP status codes |

---

### 📂 Utils - Tiện ích

| File | Mục đích |
|------|----------|
| `server/src/utils/Chatbot/chatbot.js` | **Chatbot Node.js** - Xử lý câu hỏi chatbot, reindex posts vào vector store |
| `server/src/utils/AISearch/AISearch.js` | **Tìm kiếm AI** - AI search cho bài đăng và từ khóa |
| `server/src/utils/SendMail/SendMailApprove.js` | **Email duyệt bài** - Gửi email thông báo bài đăng được duyệt |
| `server/src/utils/SendMail/SendMailReject.js` | **Email từ chối bài** - Gửi email thông báo bài đăng bị từ chối |
| `server/src/utils/SendMail/sendMailForgotPassword.js` | **Email quên mật khẩu** - Gửi email với OTP cho quên mật khẩu |
| `server/src/utils/RAG/vectorStore.js` | **RAG Vector Store** - Lưu trữ và tìm kiếm vector embeddings |
| `server/src/utils/RAG/documentIndexer.js` | **RAG Document Indexer** - Index tài liệu vào vector store |
| `server/src/utils/RAG/retrievalSystem.js` | **RAG Retrieval** - Hệ thống retrieval documents cho chatbot |
| `server/src/utils/RAG/ragChatbot.js` | **RAG Chatbot** - Chatbot sử dụng RAG system |

---

### 📂 Test Files - Kiểm tra

| File | Mục đích |
|------|----------|
| `server/test_api.js` | **Test API** - Script kiểm tra API endpoints |
| `server/test_search.js` | **Test search** - Script kiểm tra chức năng tìm kiếm |
| `server/test-rag.js` | **Test RAG** - Script kiểm tra RAG system |
| `server/check_data.js` | **Check data** - Script kiểm tra dữ liệu trong database |
| `server/check_db.js` | **Check DB** - Script kiểm tra kết nối database |

---

## 📁 CLIENT (React/Vite) - Frontend Web App

### 📄 File Client Chính

| File | Mục đích |
|------|----------|
| `client/src/main.jsx` | **Entry point** - Điểm khởi đầu app React, setup Router và Providers |
| `client/src/App.jsx` | **App component** - Component chính với Header, HomePage, socket integration |
| `client/src/ResultsPage.jsx` | **Trang kết quả** - Hiển thị kết quả tìm kiếm với filters từ URL params |
| `client/src/App.css` | **Styles App** - CSS styles cho App component |

---

### 📂 Components - Components UI

| File | Mục đích |
|------|----------|
| `client/src/Components/Header/Header.jsx` | **Header** - Thanh điều hướng với logo, search, filter, user menu, category links, post button |
| `client/src/Components/HomePage/HomePage.jsx` | **Trang chủ** - Hiển thị danh sách bài đăng với filters, pagination, sorting |
| `client/src/Components/CardBody/CardBody.jsx` | **Card bài đăng** - Card hiển thị thumbnail, title, price, location của bài đăng |
| `client/src/Components/Chatbot/Chatbot.jsx` | **Chatbot UI** - Giao diện chat với AI, hiển thị câu trả lời và rooms |
| `client/src/Components/filter/FilterPanel.jsx` | **Panel lọc** - Panel lọc nâng cao với location, category, price, area, amenities |
| `client/src/Components/filter/LocationFilter.jsx` | **Filter địa điểm** - Component lọc theo tỉnh/phường |
| `client/src/Components/filter/HeaderLocationFilter.jsx` | **Filter địa điểm Header** - Location filter trên header |
| `client/src/Components/filter/PriceFilter.jsx` | **Filter giá** - Component lọc theo khoảng giá |
| `client/src/Components/filter/PriceRangeFilter.jsx` | **Filter khoảng giá** - Component lọc theo range giá cụ thể |
| `client/src/Components/filter/AreaFilter.jsx` | **Filter diện tích** - Component lọc theo diện tích |
| `client/src/Components/filter/AreaRangeFilter.jsx` | **Filter khoảng diện tích** - Component lọc theo range diện tích |
| `client/src/Components/filter/CategoryFilter.jsx` | **Filter danh mục** - Component lọc theo loại phòng |
| `client/src/Components/filter/OptionsFilter.jsx` | **Filter tiện nghi** - Component lọc theo amenities (máy lạnh, gác, etc.) |
| `client/src/Components/Layout/Layout.jsx` | **Layout** - Component bao quanh header, main content, footer |
| `client/src/Components/Layout/AuthProvider.jsx` | **Auth Provider** - Provider quản lý authentication, token refresh |
| `client/src/Components/PostModal/PostModal.jsx` | **Modal đăng bài** - Modal hướng dẫn/thông tin về việc đăng bài |
| `client/src/Components/Footer/Footer.jsx` | **Footer** - Chân trang với thông tin liên hệ, links |

---

### 📂 Pages - Trang chức năng

| File | Mục đích |
|------|----------|
| `client/src/Pages/LoginUser/LoginUser.jsx` | **Trang đăng nhập** - Form đăng nhập email/password và Google login |
| `client/src/Pages/RegisterUser/RegisterUser.jsx` | **Trang đăng ký** - Form đăng ký user mới |
| `client/src/Pages/InfoUser/InfoUser.jsx` | **Trang cá nhân** - Dashboard user với tabs: info, posts, recharge, password |
| `client/src/Pages/InfoUser/Components/PersonalInfo/PersonalInfo.jsx` | **Thông tin cá nhân** - Form xem/sửa thông tin user, upload avatar |
| `client/src/Pages/InfoUser/Components/ManagerPost/ManagerPost.jsx` | **Quản lý bài đăng** - Danh sách bài đăng của user với actions (edit, delete, renew) |
| `client/src/Pages/InfoUser/Components/ManagerPost/RenewPostModal.jsx` | **Modal gia hạn** - Modal chọn gói và thanh toán gia hạn bài đăng |
| `client/src/Pages/InfoUser/Components/ManagerPost/AddPostForm.jsx` | **Form thêm bài** - Form để thêm bài đăng mới |
| `client/src/Pages/InfoUser/Components/RechargeUser/RechargeUser.jsx` | **Nạp tiền** - Form chọn số tiền và phương thức thanh toán (MoMo/VNPay) |
| `client/src/Pages/InfoUser/Components/ChangePassword/ChangePassword.jsx` | **Đổi mật khẩu** - Form đổi mật khẩu (old, new, confirm) |
| `client/src/Pages/CreatePost/CreatePost.jsx` | **Tạo bài đăng** - Form tạo bài đăng mới với upload images, location selector, amenities |
| `client/src/Pages/DetailPost/DetailPost.jsx` | **Chi tiết bài đăng** - Hiển thị đầy đủ thông tin bài đăng, images, map, actions (call, message, favourite) |
| `client/src/Pages/Admin/Index.jsx` | **Admin dashboard** - Trang quản trị với thống kê và quản lý users/posts/transactions |
| `client/src/Pages/Admin/Components/Dashborad/Dashborad.jsx` | **Dashboard stats** - Thống kê tổng quan: users, posts, revenue, charts |
| `client/src/Pages/Admin/Components/ManagerUser/ManagerUser.jsx` | **Quản lý users** - Danh sách users với search, edit, delete, toggle admin |
| `client/src/Pages/Admin/Components/ManagerPost/ManagerPost.jsx` | **Quản lý bài (pending)** - Danh sách bài chờ duyệt với approve/reject actions |
| `client/src/Pages/Admin/Components/ManagerPost/ManagerAllPosts.jsx` | **Quản lý tất cả bài** - Danh sách tất cả bài đăng với filters |
| `client/src/Pages/Admin/Components/ManagerRechange/ManagerRechange.jsx` | **Quản lý giao dịch** - Lịch sử giao dịch nạp tiền |
| `client/src/Pages/ForgotPassword/ForgotPassword.jsx` | **Quên mật khẩu** - Form nhập email, OTP và đặt lại mật khẩu |
| `client/src/Pages/AISearch/AISearch.jsx` | **Tìm kiếm AI** - Chat interface với AI để tìm bài đăng bằng ngôn ngữ tự nhiên |

---

### 📂 Routes - Định tuyến

| File | Mục đích |
|------|----------|
| `client/src/routes/index.jsx` | **Router config** - Định nghĩa tất cả routes (public, protected, admin) |
| `client/src/routes/NotFoundPage.jsx` | **404 Page** - Trang không tìm thấy |
| `client/src/routes/ProtectedRoute.jsx` | **Protected Route** - HOC bảo vệ route cho user đã đăng nhập |
| `client/src/routes/ProtectedRouteAdmin.jsx` | **Admin Protected Route** - HOC bảo vệ route cho admin |

---

### 📂 Hooks - Custom React Hooks

| File | Mục đích |
|------|----------|
| `client/src/hooks/useSocket.jsx` | **Socket Hook** - Hook kết nối Socket.IO, listen events (payment, favourite, message), manage conversations |
| `client/src/hooks/useStore.jsx` | **Store Hook** - Hook để access Context store (dataUser, setDataUser, etc.) |
| `client/src/hooks/useDebounce.jsx` | **Debounce Hook** - Hook debounce value (dùng cho search input) |

---

### 📂 Store - Context/State Management

| File | Mục đích |
|------|----------|
| `client/src/store/Context.jsx` | **Context creation** - Tạo React Context cho global state |
| `client/src/store/Provider.jsx` | **Context Provider** - Provider cung cấp global state: user, payment, messages, search |

---

### 📂 Config - Cấu hình

| File | Mục đích |
|------|----------|
| `client/src/config/request.jsx` | **API config** - Cấu hình Axios instance, interceptors, token refresh logic, export 40+ API functions |

---

### 📂 Utils - Tiện ích

| File | Mục đích |
|------|----------|
| `client/src/utils/tokenManager.js` | **Token Manager** - Quản lý token expiration, auto-refresh token trước khi hết hạn (check mỗi 1 phút) |
| `client/src/utils/ChatButton/ChatButton.jsx` | **Chat Button** - Button mở chat floating |
| `client/src/utils/ChatMiniList/ChatMiniList.jsx` | **Chat Mini List** - Danh sách chat thu nhỏ |
| `client/src/utils/GlobalMessaging/GlobalMessaging.jsx` | **Global Messaging** - Component messaging global |
| `client/src/utils/Messager/Messager.jsx` | **Messager** - Component nhắn tin chat |

---

### 📂 Assets - Tài nguyên

| File | Mục đích |
|------|----------|
| `client/src/assets/images/logo.svg` | **Logo** - Logo của ứng dụng |

---

### 📂 Config Files - File cấu hình

| File | Mục đích |
|------|----------|
| `client/vite.config.js` | **Vite config** - Cấu hình Vite build tool |
| `client/eslint.config.js` | **ESLint config** - Cấu hình ESLint linting |
| `client/package.json` | **Dependencies** - Khai báo dependencies và scripts cho client |
| `client/.env.example` | **Env example** - Ví dụ biến môi trường |
| `client/index.html` | **HTML template** - HTML template cho Vite |

---

## 📁 CHATBOT SERVICE (Python/Flask) - AI Chatbot

### 📄 File Chatbot Chính

| File | Mục đích |
|------|----------|
| `chatbot_service/main.py` | **Flask app chính** - Khởi chạy Flask server, setup routes (/chat, /reindex, /health), periodic reindexing |
| `chatbot_service/chatbot.py` | **Chatbot AI** - Xử lý câu hỏi với RAG: extract criteria, search vector store, call LLM, format response |
| `chatbot_service/vector_store.py` | **Vector Store** - ChromaDB vector store với OpenAI embeddings, index/search posts |
| `chatbot_service/database.py` | **MongoDB Handler** - Kết nối và fetch posts từ MongoDB cho chatbot |
| `chatbot_service/simple_chatbot.py` | **Simple Chatbot** - Chatbot đơn giản không dùng RAG |
| `chatbot_service/enhanced_simple_chatbot.py` | **Enhanced Chatbot** - Chatbot đơn giản cải tiến |
| `chatbot_service/check_vector_db.py` | **Check Vector DB** - Script kiểm tra vector database |
| `chatbot_service/debug_chatbot_db.py` | **Debug Chatbot DB** - Script debug chatbot database |
| `chatbot_service/test_simple_chatbot.py` | **Test Chatbot** - Test simple chatbot functionality |
| `chatbot_service/test_image_parsing.py` | **Test Images** - Test image parsing từ posts |
| `chatbot_service/test_persistence.py` | **Test Persistence** - Test persistence functionality |
| `chatbot_service/test_images.py` | **Test Images** - Test images handling |
| `chatbot_service/start.bat` | **Start Windows** - Script khởi động chatbot service trên Windows |
| `chatbot_service/start.sh` | **Start Linux** - Script khởi động chatbot service trên Linux |
| `chatbot_service/requirements.txt` | **Python Dependencies** - Khai báo Python packages |
| `chatbot_service/.env.example` | **Env example** - Ví dụ biến môi trường cho chatbot |

---

## 📁 ROOT TEST FILES - Test Scripts

| File | Mục đích |
|------|----------|
| `test_auth.js` | **Test Auth** - Script kiểm tra authentication flow |
| `test_route.js` | **Test Routes** - Script kiểm tra routing |
| `test_transaction_detail.js` | **Test Transactions** - Script kiểm tra chi tiết giao dịch |

---

## 📁 APP-MOBILE (React Native) - Mobile App

*Lưu ý: Folder này không được phân tích chi tiết theo yêu cầu*

| File | Mục đích |
|------|----------|
| `app-mobile/` | **Mobile App** - React Native mobile application (không được phân tích chi tiết) |

---

## 📊 LUỒNG DỮ LIỆU CHÍNH

### 1. **User Authentication Flow**
```
LoginUser.jsx → requestLogin() → POST /api/login → users.controller.js
→ createToken() → tokenSevices.js → Set cookies → Response
→ AuthProvider.jsx → tokenManager.js (monitor & refresh)
```

### 2. **Create Post Flow**
```
CreatePost.jsx → requestCreatePost() → POST /api/create-post
→ posts.controller.js (createPost) → Validate → Check balance
→ post.model.js (save) → postExpiration.service.js (schedule)
→ RAG reindex → Response
```

### 3. **Search & Filter Flow**
```
HomePage.jsx / Header.jsx → URL params → requestGetPosts() / requestGetFilteredPosts()
→ GET /api/get-posts or /api/advanced-search → posts.controller.js
→ Build MongoDB query → post.model.js (find) → Response
→ Render CardBody.jsx components
```

### 4. **AI Chat Flow**
```
AISearch.jsx / Chatbot.jsx → requestChatbot() → POST /chat (Python:8000)
→ main.py → chatbot.py (process_question)
→ vector_store.py (search) → LLM API (OpenAI/Gemini)
→ Format response → Response → Display with rooms
```

### 5. **Realtime Message Flow**
```
DetailPost.jsx → useSocket.jsx → socketRef.current.emit()
→ server: socketServices.js → messager.controller.js (createMessage)
→ Save to Messager.model.js → Emit 'new-message' event
→ Receiver's useSocket.jsx receives → Update conversation
```

### 6. **Payment Flow**
```
RechargeUser.jsx → requestPayments() → POST /api/payments
→ payments.controller.js → vnpayService.js / MoMo API
→ Redirect to payment gateway → User pays
→ Callback: checkPaymentVnpay() / checkPaymentMomo()
→ Update balance (users.model.js) → Save transaction (RechargeUser.model.js)
→ Emit 'new-payment' socket event → Redirect back
```

### 7. **Admin Approval Flow**
```
Admin/ManagerPost.jsx → requestApprovePost() → POST /api/approve-post
→ posts.controller.js (approvePost) → Update status to 'active'
→ SendMailApprove.js (send email) → Response
```

### 8. **Post Expiration Flow**
```
postExpiration.service.js (interval: 60min) → checkAndExpirePosts()
→ post.model.js (find expired) → Update status to 'expired'
→ Log results
```

---

## 🔧 CÁC DỊCH VỤ BÊN THỨ BA

| Dịch vụ | File tích hợp | Mục đích |
|---------|--------------|----------|
| **MongoDB** | ConnectDB.js | Database lưu trữ dữ liệu |
| **Socket.IO** | socketServices.js, useSocket.jsx | Realtime messaging & notifications |
| **JWT (RSA)** | tokenSevices.js | Authentication tokens |
| **MoMo Payment** | payments.controller.js | Thanh toán qua ví MoMo |
| **VNPay** | vnpay.service.js | Thanh toán qua cổng VNPay |
| **OpenAI API** | chatbot.py, vector_store.py | Embeddings & LLM cho chatbot |
| **Google Gemini** | chatbot.py | Alternative LLM cho chatbot |
| **ChromaDB** | vector_store.py | Vector database cho RAG |
| **Google OAuth** | users.controller.js, LoginUser.jsx | Đăng nhập bằng Google |
| **Nodemailer** | sendMail*.js | Gửi email thông báo |

---

## 📈 THỐNG KÊ SỐ LƯỢNG FILE

| Category | Số file |
|----------|---------|
| **Server Controllers** | 6 |
| **Server Models** | 9 |
| **Server Routes** | 8 |
| **Server Services** | 4 |
| **Server Utils** | 9 |
| **Server Core** | 4 |
| **Server Test Files** | 5 |
| **Client Components** | 18 |
| **Client Pages** | 18 |
| **Client Routes** | 4 |
| **Client Hooks** | 3 |
| **Client Store** | 2 |
| **Client Config** | 1 |
| **Client Utils** | 5 |
| **Chatbot Service** | 13 |
| **Root Test Files** | 3 |
| **TOTAL** | **~112 files** |

---

**END OF FILE PURPOSES DOCUMENTATION**
