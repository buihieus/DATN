# Hệ Thống Chat Real-time Trong Ứng Dụng Phòng Trọ 123

## Tổng Quan

Hệ thống chat real-time trong ứng dụng phòng trọ 123 cho phép người dùng (chủ trọ và người thuê) giao tiếp trực tiếp với nhau theo thời gian thực. Hệ thống sử dụng Socket.IO để thiết lập kết nối hai chiều giữa client và server, đảm bảo tin nhắn được truyền tải nhanh chóng và đáng tin cậy.

## Kiến Trúc Hệ Thống

### Backend (Node.js + Socket.IO + MongoDB)

#### 1. Socket Services
- **Vị trí**: `server/src/services/socketServices.js`
- **Chức năng**: Quản lý kết nối socket, xác thực người dùng, theo dõi trạng thái người dùng (online/offline)

#### 2. Message Controller
- **Vị trí**: `server/src/controllers/messager.controller.js`
- **Chức năng**: Xử lý logic tạo, lấy, đọc tin nhắn

#### 3. Message Model
- **Vị trí**: `server/src/models/Messager.model.js`
- **Cấu trúc**:
  ```javascript
  {
    senderId: ObjectId,      // ID người gửi
    receiverId: ObjectId,    // ID người nhận
    message: String,         // Nội dung tin nhắn
    createdAt: Date,         // Thời gian tạo
    isRead: Boolean,         // Trạng thái đã đọc
    updatedAt: Date          // Thời gian cập nhật
  }
  ```

#### 4. Server Configuration
- **Vị trí**: `server/src/server.js`
- **Chức năng**: Khởi tạo Socket.IO server và kết nối với các service

### Frontend (React + Socket.IO Client)

#### 1. Socket Hook
- **Vị trí**: `client/src/hooks/useSocket.jsx`
- **Chức năng**: Quản lý kết nối socket, lắng nghe sự kiện, xử lý tin nhắn mới

#### 2. Chat Components
- **Vị trí**: `client/src/utils/Messager/`
- **Chức năng**: Giao diện chat, gửi/nhận tin nhắn

## Cơ Chế Hoạt Động

### 1. Thiết Lập Kết Nối

#### Quá trình kết nối:
1. Client gửi yêu cầu kết nối đến server với token xác thực
2. Server xác thực token để xác định người dùng
3. Server lưu trữ socket vào `usersMap` với key là userId
4. Client nhận được sự kiện `connect` khi kết nối thành công

#### Xác thực kết nối:
- Ưu tiên token từ header (cho mobile)
- Fallback đến cookie (cho web)
- Xác thực token JWT để xác định userId

### 2. Quản Lý Kết Nối Người Dùng

#### usersMap:
- Cấu trúc: `Map<userId, Array<socket>>`
- Cho phép một người dùng có nhiều kết nối (web, mobile, nhiều tab)
- Mỗi userId có thể có nhiều socket (đa thiết bị)

#### socketRooms:
- Cấu trúc: `Map<socketId, Set<roomIds>>`
- Theo dõi các phòng mà mỗi socket đang tham gia

### 3. Gửi Tin Nhắn

#### Quá trình gửi tin nhắn:
1. Client gửi yêu cầu tạo tin nhắn đến server qua API
2. Server lưu tin nhắn vào MongoDB
3. Server phát sự kiện `new-message` đến các socket liên quan
4. Server phát sự kiện `new-user-message` như dự phòng
5. Server phát sự kiện `new-conversation` cho người nhận

#### Phát tin nhắn đến người nhận:
- Phát đến tất cả socket của người nhận (đa thiết bị)
- Phát đến tất cả socket của người gửi (đa thiết bị)
- Phát đến các socket trong phòng chat (nếu có)

### 4. Nhận Tin Nhắn

#### Các sự kiện được lắng nghe:
- `new-message`: Tin nhắn mới
- `new-user-message`: Tin nhắn mới (dự phòng)
- `new-conversation`: Cuộc trò chuyện mới
- `messages-read`: Cập nhật trạng thái đọc tin nhắn

#### Xử lý tin nhắn mới:
- Cập nhật trạng thái người dùng (online/offline)
- Hiển thị thông báo nếu cần
- Cập nhật giao diện chat

### 5. Quản Lý Trạng Thái Đọc Tin Nhắn

#### Đánh dấu đã đọc:
- Khi người dùng mở cuộc trò chuyện, hệ thống tự động đánh dấu tin nhắn là đã đọc
- Gửi yêu cầu đến server để cập nhật trạng thái trong MongoDB
- Phát sự kiện `messages-read` đến các thiết bị khác

### 6. Quản Lý Trạng Thái Người Dùng

#### Cập nhật trạng thái online/offline:
- Khi người dùng kết nối: phát sự kiện `user-status-update` với status `online`
- Khi người dùng ngắt kết nối: phát sự kiện `user-status-update` với status `offline`
- Chỉ phát sự kiện cho các người dùng khác, không phát cho chính người đó

## API Endpoints

### 1. Tạo tin nhắn
```
POST /api/create-message
Headers: Authorization: Bearer {token}
Body: {
  receiverId: string,
  message: string
}
```

### 2. Lấy tin nhắn
```
GET /api/get-messages?receiverId={receiverId}
Headers: Authorization: Bearer {token}
```

### 3. Lấy danh sách cuộc trò chuyện
```
GET /api/get-messages-by-user-id
Headers: Authorization: Bearer {token}
```

### 4. Đánh dấu tin nhắn đã đọc
```
POST /api/mark-message-read
Headers: Authorization: Bearer {token}
Body: { messageId: string }
```

### 5. Đánh dấu tất cả tin nhắn đã đọc
```
POST /api/mark-all-messages-read
Headers: Authorization: Bearer {token}
Body: { senderId: string }
```

## Xử Lý Sự Cố Và Cải Tiến

### 1. Vấn Đề Đã Được Khắc Phục

#### Vấn đề gốc:
- SocketIOService chỉ có một handler duy nhất
- Khi nhiều component subscribe/unsubscribe, handler bị ghi đè
- Tin nhắn đến nhưng không có handler để xử lý

#### Giải pháp:
- Thay đổi sang hệ thống multi-subscriber
- Mỗi component có ID đăng ký riêng
- Quản lý nhiều handler thay vì một handler duy nhất

### 2. Cải Tiến Hiệu Suất

#### Quản lý kết nối đa thiết bị:
- Hỗ trợ một người dùng có nhiều socket kết nối
- Ngắt kết nối đúng cách khi không còn socket nào cho người dùng

#### Phát tin nhắn hiệu quả:
- Phát đến tất cả thiết bị của người dùng
- Sử dụng cả room-based và user-based phát tin nhắn
- Cơ chế dự phòng để đảm bảo tin nhắn được nhận

### 3. Xử Lý Ngắt Kết Nối

#### Quy trình ngắt kết nối:
1. Xóa socket khỏi socketRooms
2. Xóa socket khỏi usersMap
3. Nếu không còn socket nào cho người dùng, phát sự kiện offline
4. Cập nhật trạng thái cho các người dùng khác

## Bảo Trì Và Mở Rộng

### 1. Thêm Tính Năng Mới

#### Gửi file/ảnh:
- Mở rộng model Messager để hỗ trợ file đính kèm
- Thêm endpoint upload file
- Cập nhật giao diện chat để hiển thị file

#### Nhắn tin nhóm:
- Thêm room-based messaging
- Mở rộng model để hỗ trợ nhiều người nhận
- Cập nhật logic phát tin nhắn

### 2. Cải Thiện Hiệu Suất

#### Phân trang tin nhắn:
- Thêm phân trang cho API lấy tin nhắn
- Hỗ trợ tải thêm tin nhắn khi scroll

#### Bộ nhớ đệm:
- Cache tin nhắn thường xuyên truy cập
- Cache trạng thái người dùng

## Ví Dụ Sử Dụng

### 1. Gửi tin nhắn:
```javascript
// Client gửi tin nhắn
socket.emit('create-message', {
  receiverId: 'user123',
  message: 'Xin chào, tôi muốn thuê phòng của bạn'
});

// Server xử lý và phát tin nhắn
// - Lưu vào MongoDB
// - Phát đến tất cả socket của người nhận
// - Phát đến tất cả socket của người gửi
```

### 2. Nhận tin nhắn:
```javascript
// Client lắng nghe sự kiện
socket.on('new-message', (data) => {
  // Hiển thị tin nhắn mới
  updateChatUI(data.message);
});

socket.on('user-status-update', (data) => {
  // Cập nhật trạng thái người dùng
  updateUserStatus(data.userId, data.status);
});
```

## Kết Luận

Hệ thống chat real-time trong ứng dụng phòng trọ 123 là một hệ thống mạnh mẽ, hỗ trợ giao tiếp thời gian thực giữa người dùng. Hệ thống được thiết kế để xử lý nhiều thiết bị, đảm bảo tin nhắn được truyền tải đáng tin cậy và hỗ trợ các tính năng như trạng thái online/offline, đánh dấu đã đọc, và quản lý nhiều cuộc trò chuyện đồng thời. Với kiến trúc được cải tiến, hệ thống có thể mở rộng dễ dàng trong tương lai.