# Chức năng Gia Hạn Bài Đăng trong Dự Án PhongTro123

## Tổng Quan

Chức năng gia hạn bài đăng cho phép người dùng kéo dài thời gian hiển thị của bài đăng sau khi hết hạn hoặc đang còn hạn. Đây là một tính năng quan trọng trong hệ thống quản lý bài đăng nhà trọ, giúp người đăng có thể duy trì sự hiện diện của bài đăng trên nền tảng.

## Hoạt Động Của Chức Năng

### 1. Cơ Chế Gia Hạn

- Người dùng có thể gia hạn bài đăng của mình với các gói thời gian: 3 ngày, 7 ngày, hoặc 30 ngày
- Có hai loại bài đăng: "Tin thường" và "Tin VIP" với mức giá khác nhau
- Sau khi gia hạn, bài đăng sẽ chuyển về trạng thái "inactive" và cần được admin duyệt lại
- Ngày hết hạn mới được tính từ ngày kết thúc hiện tại (nếu bài đăng vẫn còn hiệu lực) hoặc từ ngày hiện tại (nếu bài đăng đã hết hạn)

### 2. Giá Cả Gia Hạn

#### Gói Tin Thường:
- 3 ngày: 10,000 VNĐ
- 7 ngày: 60,000 VNĐ
- 30 ngày: 1,000,000 VNĐ

#### Gói Tin VIP:
- 3 ngày: 50,000 VNĐ
- 7 ngày: 315,000 VNĐ
- 30 ngày: 1,200,000 VNĐ

### 3. Quy Trình Gia Hạn

1. Người dùng chọn bài đăng muốn gia hạn
2. Chọn loại tin (thường hoặc VIP) và thời gian gia hạn
3. Hệ thống kiểm tra số dư tài khoản người dùng
4. Nếu đủ tiền, hệ thống trừ tiền và cập nhật bài đăng
5. Bài đăng chuyển sang trạng thái "inactive" và chờ duyệt lại
6. Ngày hết hạn được cập nhật theo thời gian đã chọn

## Hướng Dẫn Triển Khai Chức Năng

### 1. Backend (Server Side)

#### API Endpoint:
- Đường dẫn: `/api/renew-post`
- Phương thức: `POST`
- Yêu cầu xác thực người dùng (`authUser`)

#### Cấu trúc yêu cầu:
```javascript
{
  "postId": "ID của bài đăng cần gia hạn",
  "dateEnd": "Số ngày gia hạn (3, 7, hoặc 30)",
  "newTypeNews": "Loại tin mới (tùy chọn, có thể thay đổi từ thường sang VIP)"
}
```

#### Logic xử lý chính:
1. Kiểm tra thông tin đầu vào
2. Xác thực quyền sở hữu bài đăng
3. Kiểm tra trạng thái bài đăng (không thể gia hạn bài đã hủy)
4. Xác định giá tiền dựa trên loại tin và thời gian
5. Kiểm tra số dư người dùng
6. Tính toán ngày hết hạn mới
7. Cập nhật số dư người dùng và thông tin bài đăng
8. Thiết lập trạng thái bài đăng về "inactive" để chờ duyệt lại

### 2. Frontend (Client Side)

#### Web Application:
- Sử dụng component `RenewPostModal` để hiển thị form gia hạn
- Hiển thị thông tin bài đăng hiện tại
- Cho phép chọn loại tin và thời gian gia hạn
- Tính toán và hiển thị giá tiền
- Gửi yêu cầu đến API `/api/renew-post`

#### Mobile Application:
- Màn hình gia hạn tại `app/rooms/renew.tsx`
- Hiển thị thông tin bài đăng
- Cho phép chọn loại tin và thời gian
- Gửi yêu cầu qua service `postService.renewPost`

### 3. Các Thành Phần Liên Quan

#### Controllers:
- `server/src/controllers/posts.controller.js` - Hàm `renewPost`

#### Routes:
- `server/src/routes/posts.routes.js` - Route `/api/renew-post`

#### Client Components:
- `client/src/Pages/InfoUser/Components/ManagerPost/RenewPostModal.jsx`
- `client/src/config/request.jsx` - Hàm `requestRenewPost`

#### Mobile Components:
- `mobile-app/services/roomService.ts` - Hàm `renewPost`
- `mobile-app/app/rooms/renew.tsx` - Màn hình gia hạn
- `mobile-app/components/MyRoomCard.tsx` - Nút gia hạn trong danh sách bài đăng

## Các Trường Hợp Đặc Biệt

1. **Bài đăng đã hết hạn**: Vẫn có thể gia hạn, ngày bắt đầu tính từ ngày hiện tại
2. **Bài đăng còn hiệu lực**: Ngày bắt đầu tính từ ngày hết hạn hiện tại
3. **Bài đăng bị hủy**: Không thể gia hạn
4. **Thay đổi loại tin**: Có thể nâng cấp từ thường sang VIP trong quá trình gia hạn
5. **Số dư không đủ**: Không thể thực hiện gia hạn

## Bảo Mật và Xác Thực

- Chỉ người sở hữu bài đăng mới có thể gia hạn
- Yêu cầu xác thực người dùng trước khi thực hiện
- Kiểm tra quyền hạn trước khi thực hiện thao tác

## Tích Hợp Với Hệ Thống Khác

- Sau khi gia hạn, hệ thống sẽ lập chỉ mục lại bài đăng trong hệ thống tìm kiếm RAG
- Cập nhật số dư tài khoản người dùng
- Bài đăng chuyển sang trạng thái "inactive" và cần duyệt lại

## Lưu Ý Khi Phát Triển

1. Luôn đảm bảo kiểm tra quyền sở hữu bài đăng
2. Xác nhận số dư người dùng trước khi trừ tiền
3. Cập nhật trạng thái bài đăng đúng quy trình
4. Gửi thông báo cho người dùng về kết quả gia hạn
5. Ghi log các hành động gia hạn để theo dõi