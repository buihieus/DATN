# Hướng Dẫn Sửa Lỗi Chat Real-time Giữa Web và Mobile

## Vấn Đề
- Tin nhắn từ web gửi sang mobile không nhận được ngay lập tức
- Người dùng mobile phải thoát và vào lại màn hình chat mới thấy tin nhắn
- Ngược lại, tin nhắn từ mobile gửi sang web hoạt động bình thường

## Nguyên Nhân
1. Mobile không duy trì kết nối socket ổn định
2. Không có handler toàn cục để nhận tin nhắn khi không mở màn hình chat
3. Cài đặt kết nối socket chưa tối ưu cho môi trường mobile

## Giải Pháp Đã Áp Dụng

### 1. Tạo GlobalChatManager
- Dịch vụ toàn cục để nhận và lưu trữ tin nhắn khi ứng dụng chạy nền
- Tự động xử lý tin nhắn khi người dùng mở màn hình chat

### 2. Cải Thiện SocketIOService
- Tăng thời gian timeout và thiết lập ping/pong để duy trì kết nối
- Thêm cơ chế kiểm tra sức khỏe kết nối định kỳ
- Cải thiện cơ chế retry và fallback URL

### 3. Cập Nhật useChat Hook
- Tích hợp với GlobalChatManager để xử lý tin nhắn đã lưu
- Thêm cơ chế join/leave room cho từng cuộc trò chuyện

### 4. Cập Nhật useSocket Hook (Web)
- Thêm phương thức joinRoom và leaveRoom
- Loại bỏ việc emit sự kiện không cần thiết

## Triển Khai

### Bước 1: Cấu Hình Môi Trường
1. Sao chép `.env.example` thành `.env`
2. Cập nhật URL phù hợp với máy chủ của bạn

### Bước 2: Khởi Động Dịch Vụ
1. GlobalChatManager được khởi động trong SocketProvider khi người dùng đăng nhập
2. Kết nối socket được thiết lập và duy trì suốt phiên làm việc

### Bước 3: Kiểm Tra Kết Nối
- Kiểm tra log để đảm bảo socket kết nối thành công
- Đảm bảo mobile được thêm vào usersMap trên server

## Kiểm Thử

1. Đăng nhập trên cả web và mobile
2. Gửi tin nhắn từ web sang mobile
3. Kiểm tra xem mobile có nhận được tin nhắn ngay lập tức không
4. Gửi tin nhắn từ mobile sang web
5. Kiểm tra xem cả hai chiều đều hoạt động

## Gỡ Rối

Nếu vẫn gặp vấn đề:
1. Kiểm tra log trên server để xem mobile có được thêm vào usersMap không
2. Kiểm tra log trên mobile để xem có kết nối socket thành công không
3. Đảm bảo URL trong .env là chính xác
4. Kiểm tra tường lửa hoặc mạng có chặn kết nối socket không