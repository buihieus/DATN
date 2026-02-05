# Thay Đổi Hệ Thống Bài Đăng Mobile - Chuyển Sang Mô Hình Tin Thường

## Tổng Quan

Hệ thống bài đăng trên mobile app đã được cập nhật để đơn giản hóa mô hình phân loại tin đăng. Thay vì có hai loại tin là "Tin thường" và "Tin VIP", hệ thống hiện tại chỉ còn một loại duy nhất là "Tin thường".

## Những Thay Đổi Chính

### 1. Loại Bỏ Phân Loại Tin VIP
- Không còn phân biệt giữa "Tin thường" và "Tin VIP"
- Tất cả bài đăng đều được xử lý như nhau
- Bỏ các lựa chọn liên quan đến loại tin trong UI

### 2. Cập Nhật Service Layer
- Cập nhật `roomService.ts`:
  - `createPost`: Luôn gửi `typeNews: 'normal'`
  - `renewPost`: Không còn tham số `newTypeNews`
  - `getVipPosts`: Đổi tên thành `getFeaturedPosts`, lấy bài đăng thường thay vì VIP

### 3. Cập Nhật Giao Diện Người Dùng
- `app/rooms/create.tsx`: Ẩn phần chọn loại tin, luôn mặc định là 'normal'
- `app/rooms/renew.tsx`: Bỏ phần chọn loại tin khi gia hạn, chỉ giữ lại tin thường

## Các File Đã Thay Đổi

### Service
- `mobile-app/services/roomService.ts`: Cập nhật API service để loại bỏ phân biệt loại tin

### UI Components
- `mobile-app/app/rooms/create.tsx`: Bỏ phần chọn loại tin trong form tạo bài đăng
- `mobile-app/app/rooms/renew.tsx`: Bỏ phần chọn loại tin trong form gia hạn

## Tác Động

### Tích Hợp ngược (Backward Compatibility)
- Các bài đăng hiện có vẫn giữ nguyên loại tin (VIP hoặc thường)
- API vẫn chấp nhận tham số `typeNews` nhưng sẽ bỏ qua giá trị
- Không ảnh hưởng đến dữ liệu hiện tại

### Hiệu Năng
- Giảm độ phức tạp của hệ thống
- Tăng hiệu suất xử lý do bỏ các logic phân loại
- Đơn giản hóa quy trình tạo và gia hạn bài đăng

## Hướng Dẫn Triển Khai

1. Cập nhật mobile app với các thay đổi
2. Kiểm tra lại toàn bộ chức năng tạo và gia hạn bài đăng
3. Đảm bảo UI không còn hiển thị phần chọn loại tin

## Ghi Chú

- Các bài đăng VIP hiện tại vẫn được giữ nguyên trong cơ sở dữ liệu
- Người dùng không còn lựa chọn giữa các loại tin khi tạo hoặc gia hạn bài đăng
- Giá cả được chuẩn hóa theo mức giá của tin thường