# Chức năng Duyệt Bài Đăng trong Dự Án PhongTro123

## Tổng Quan

Chức năng duyệt bài đăng cho phép quản trị viên (admin) kiểm tra và phê duyệt các bài đăng được tạo bởi người dùng. Đây là một bước quan trọng trong quy trình quản lý nội dung, đảm bảo chất lượng và tính hợp lệ của các bài đăng trên nền tảng.

## Hoạt Động Của Chức Năng

### 1. Cơ Chế Duyệt Bài

- Các bài đăng mới được tạo bởi người dùng sẽ có trạng thái "inactive" (chưa duyệt)
- Quản trị viên có thể xem các bài đăng chờ duyệt trong phần quản trị
- Admin có thể chọn duyệt hoặc từ chối bài đăng
- Sau khi duyệt, bài đăng sẽ chuyển sang trạng thái "active" và hiển thị công khai
- Nếu từ chối, bài đăng sẽ chuyển sang trạng thái "cancel" và không hiển thị

### 2. Quy Trình Duyệt Bài

1. Người dùng tạo bài đăng mới
2. Bài đăng được lưu với trạng thái "inactive"
3. Quản trị viên truy cập phần quản lý bài đăng
4. Admin xem chi tiết bài đăng và quyết định duyệt hoặc từ chối
5. Nếu duyệt: bài đăng chuyển sang trạng thái "active" và gửi email thông báo
6. Nếu từ chối: bài đăng chuyển sang trạng thái "cancel" và gửi email từ chối

### 3. Xử Lý Ngày Hết Hạn

- Khi duyệt bài đăng, hệ thống kiểm tra ngày hết hạn:
  - Nếu ngày hết hạn >= ngày hiện tại → trạng thái "active"
  - Nếu ngày hết hạn < ngày hiện tại → trạng thái "expired"

## Hướng Dẫn Triển Khai Chức Năng

### 1. Backend (Server Side)

#### API Endpoint Duyệt Bài:
- Đường dẫn: `/api/approve-post`
- Phương thức: `POST`
- Yêu cầu xác thực admin (`authAdmin`)

#### Cấu trúc yêu cầu:
```javascript
{
  "id": "ID của bài đăng cần duyệt"
}
```

#### Logic xử lý chính:
1. Xác thực quyền admin
2. Tìm bài đăng theo ID
3. Gửi email thông báo duyệt bài cho người dùng (trừ bài đăng admin)
4. Kiểm tra ngày hết hạn để xác định trạng thái cuối cùng
5. Cập nhật trạng thái bài đăng
6. Lập chỉ mục lại bài đăng trong hệ thống tìm kiếm RAG

#### API Endpoint Từ Chối Bài:
- Đường dẫn: `/api/reject-post`
- Phương thức: `POST`
- Yêu cầu xác thực admin (`authAdmin`)

#### Cấu trúc yêu cầu:
```javascript
{
  "id": "ID của bài đăng cần từ chối",
  "reason": "Lý do từ chối (tùy chọn)"
}
```

### 2. Frontend (Admin Panel)

#### Danh Sách Bài Đăng:
- Hiển thị các bài đăng với trạng thái "inactive" (chờ duyệt)
- Bao gồm thông tin: tiêu đề, người đăng, ảnh, loại phòng, giá, địa chỉ, loại tin, ngày đăng

#### Giao Diện Duyệt Bài:
- Nút "Duyệt" để chấp thuận bài đăng
- Ô nhập lý do từ chối và nút "Từ chối"
- Modal hiển thị chi tiết bài đăng trước khi quyết định

#### Cập Nhật Trạng Thái:
- Sau khi duyệt/từ chối, bài đăng được cập nhật trong giao diện
- Thống kê số lượng bài đăng được cập nhật theo thời gian thực

### 3. Các Thành Phần Liên Quan

#### Controllers:
- `server/src/controllers/posts.controller.js` - Hàm `approvePost` và `rejectPost`

#### Routes:
- `server/src/routes/posts.routes.js` - Route `/api/approve-post` và `/api/reject-post`

#### Email Templates:
- `server/src/utils/SendMail/SendMailApprove.js` - Template email duyệt bài
- `server/src/utils/SendMail/SendMailReject.js` - Template email từ chối bài

#### Client Components:
- `client/src/Pages/Admin/Components/ManagerPost/ManagerPost.jsx` - Giao diện quản lý bài đăng
- `client/src/config/request.jsx` - Hàm `requestApprovePost` và `requestRejectPost`

## Các Trường Hợp Đặc Biệt

1. **Bài đăng admin**: Không gửi email thông báo khi duyệt/từ chối
2. **Bài đăng hết hạn**: Khi duyệt nhưng đã quá ngày hết hạn, trạng thái sẽ là "expired"
3. **Bài đăng đã duyệt**: Không thể duyệt lại
4. **Bài đăng đã từ chối**: Không thể duyệt lại mà phải tạo bài đăng mới

## Bảo Mật và Xác Thực

- Chỉ quản trị viên mới có quyền duyệt bài đăng
- Yêu cầu xác thực admin trước khi thực hiện thao tác
- Kiểm tra quyền hạn trước khi thực hiện duyệt/từ chối

## Tích Hợp Với Hệ Thống Khác

- Gửi email thông báo cho người dùng khi bài đăng được duyệt
- Cập nhật hệ thống tìm kiếm RAG sau khi duyệt bài
- Cập nhật thống kê và số liệu trong bảng điều khiển admin

## Lưu Ý Khi Phát Triển

1. Luôn đảm bảo kiểm tra quyền admin trước khi duyệt bài
2. Gửi email thông báo cho người dùng sau khi duyệt/từ chối
3. Cập nhật trạng thái bài đăng chính xác theo ngày hết hạn
4. Ghi log các hành động duyệt bài để theo dõi
5. Xử lý trường hợp bài đăng admin không gửi email
6. Cập nhật lại hệ thống tìm kiếm sau mỗi lần duyệt bài