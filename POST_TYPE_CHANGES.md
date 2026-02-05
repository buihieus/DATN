# Thay Đổi Hệ Thống Bài Đăng - Chuyển Sang Mô Hình Tin Thường

## Tổng Quan

Hệ thống bài đăng đã được cập nhật để đơn giản hóa mô hình phân loại tin đăng. Thay vì có hai loại tin là "Tin thường" và "Tin VIP", hệ thống hiện tại chỉ còn một loại duy nhất là "Tin thường".

## Những Thay Đổi Chính

### 1. Loại Bỏ Phân Loại Tin VIP
- Không còn phân biệt giữa "Tin thường" và "Tin VIP"
- Tất cả bài đăng đều được xử lý như nhau
- Bỏ các nhãn "TIN VIP NỔI BẬT" trên giao diện

### 2. Cập Nhật Mô Hình Dữ Liệu
- Trường `typeNews` trong model Post vẫn giữ lại để đảm bảo tương thích ngược
- Giá trị mặc định của `typeNews` là `'normal'`
- Không còn nâng cấp từ thường sang VIP trong quá trình gia hạn

### 3. Cập Nhật Giao Diện Người Dùng
- Bỏ tùy chọn chọn loại tin khi tạo bài đăng
- Bỏ tùy chọn nâng cấp loại tin khi gia hạn bài đăng
- Cập nhật hiển thị để không phân biệt loại tin

### 4. Cập Nhật Logic Gia Hạn
- Bỏ chức năng nâng cấp loại tin khi gia hạn
- Chỉ còn tính phí theo gói tin thường
- Giao diện gia hạn đơn giản hơn

## Tác Động

### Tích Hợp ngược (Backward Compatibility)
- Các bài đăng hiện có vẫn giữ nguyên loại tin (VIP hoặc thường)
- API vẫn chấp nhận tham số `typeNews` nhưng sẽ bỏ qua giá trị
- Không ảnh hưởng đến dữ liệu hiện tại

### Hiệu Năng
- Giảm độ phức tạp của hệ thống
- Tăng hiệu suất xử lý do bỏ các logic phân loại
- Đơn giản hóa quy trình tạo và gia hạn bài đăng

## Các File Đã Thay Đổi

### Backend
- `server/src/models/Post.model.js`: Thêm giá trị mặc định cho typeNews
- `server/src/controllers/posts.controller.js`: Cập nhật logic tạo và gia hạn bài đăng

### Frontend
- `client/src/config/request.jsx`: Cập nhật API request
- `client/src/Pages/InfoUser/Components/ManagerPost/AddPostForm.jsx`: Bỏ tùy chọn chọn loại tin
- `client/src/Pages/InfoUser/Components/ManagerPost/RenewPostModal.jsx`: Bỏ tùy chọn nâng cấp loại tin
- `client/src/Components/CardBody/CardBody.jsx`: Bỏ hiển thị nhãn VIP
- `client/src/Pages/DetailPost/DetailPost.jsx`: Cập nhật hiển thị và logic lấy dữ liệu

## Hướng Dẫn Triển Khai

1. Cập nhật database schema (nếu cần)
2. Deploy backend với các thay đổi
3. Build và deploy frontend
4. Kiểm tra lại toàn bộ chức năng

## Ghi Chú

- Các bài đăng VIP hiện tại vẫn được giữ nguyên trong cơ sở dữ liệu
- Người dùng không còn lựa chọn giữa các loại tin khi tạo hoặc gia hạn bài đăng
- Giá cả được chuẩn hóa theo mức giá của tin thường

Tôi đã sửa các file sau để chuyển hệ thống sang mô hình chỉ có "tin thường":

    Backend:
     1. `C:\Users\BuiHieu\Downloads\phongtro123\server\src\models\Post.model.js` - Thêm giá trị mặc định typeNews: 'normal'

     2. `C:\Users\BuiHieu\Downloads\phongtro123\server\src\controllers\posts.controller.js` -
        - Cập nhật createPost để mặc định typeNews = 'normal' nếu không được chỉ định
        - Bỏ phân loại giá VIP/thường, tất cả tính theo giá thường
        - Cập nhật getPostVip để trả về tất cả bài đăng còn hạn (không phân biệt loại)
        - Cập nhật renewPost để bỏ chức năng nâng cấp loại tin

    Frontend:
     3. `C:\Users\BuiHieu\Downloads\phongtro123\client\src\config\request.jsx` -
        - Cập nhật requestCreatePost để mặc định typeNews: 'normal'
        - Cập nhật requestRenewPost để không gửi newTypeNews

     4. `C:\Users\BuiHieu\Downloads\phongtro123\client\src\Pages\InfoUser\Components\ManagerPost\AddPostForm.jsx` - Bỏ tùy chọn
         chọn loại tin, ẩn trường typeNews

     5. `C:\Users\BuiHieu\Downloads\phongtro123\client\src\Pages\InfoUser\Components\ManagerPost\RenewPostModal.jsx` -
        - Bỏ tùy chọn nâng cấp loại tin
        - Cập nhật xử lý submit để không gửi newTypeNews

     6. `C:\Users\BuiHieu\Downloads\phongtro123\client\src\Components\CardBody\CardBody.jsx` - Bỏ hiển thị nhãn "TIN VIP" và
        logic phân biệt loại tin

     7. `C:\Users\BuiHieu\Downloads\phongtro123\client\src\Pages\DetailPost\DetailPost.jsx` -
        - Bỏ hiển thị nhãn "TIN VIP NỔI BẬT"
        - Cập nhật phần "Tin đăng nổi bật" thành "Các tin đăng khác"
        - Cập nhật logic lấy dữ liệu để lấy tin thường thay vì tin VIP

    Tài liệu:
     8. `C:\Users\BuiHieu\Downloads\phongtro123\POST_TYPE_CHANGES.md` - Tạo tài liệu mô tả các thay đổi

    Tất cả các thay đổi này nhằm mục tiêu:
     - Gộp chức năng gia hạn và xóa loại tin đăng
     - Mặc định tất cả bài đăng đều là "tin thường" từ đầu
     - Không còn phân biệt các loại tin VIP, nổi bật, v.v.
     - Đơn giản hóa hệ thống và giao diện người dùng