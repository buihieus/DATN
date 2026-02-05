# Hướng Dẫn Chạy Dự Án Phòng Trọ

## Tổng Quan Dự Án

Đây là một dự án hệ thống quản lý phòng trọ đa nền tảng bao gồm:
- **Server**: Backend với Node.js và MongoDB
- **Client**: Frontend web với React và Ant Design
- **App Mobile**: Ứng dụng di động với Expo/React Native
- **Chatbot Service**: Dịch vụ chatbot hỗ trợ người dùng

## Yêu Cầu Hệ Thống

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:
- Node.js (phiên bản >= 18.x)
- npm hoặc yarn
- Docker và Docker Compose
- Python 3.8 trở lên (cho chatbot service)
- MongoDB (hoặc sử dụng Docker như hướng dẫn dưới đây)

## Cài Đặt và Chạy Từng Thành Phần

### 1. Cài Đặt Chung

Tải về và giải nén dự án, sau đó cài đặt các thư viện cần thiết cho từng phần:

```bash
# Di chuyển vào thư mục dự án
cd C:\Users\BuiHieu\Downloads\phongtro
```

### 2. Cấu Hình Môi Trường

Tạo file `.env` trong từng thư mục dựa trên file `.env.example`:

- `server/.env`
- `client/.env`
- `app-mobile/.env`

### 3. Chạy Cơ Sở Dữ Liệu

Chạy MongoDB bằng Docker:

```bash
cd server
docker-compose up -d
```

Lệnh này sẽ khởi động MongoDB trên cổng 27017.

### 4. Chạy Server (Backend)

```bash
cd server
npm install
npm run dev
```

Server sẽ chạy trên cổng 3000 (hoặc cổng được cấu hình trong `.env`).

### 5. Chạy Client (Frontend Web)

Mở cửa sổ dòng lệnh mới:

```bash
cd client
npm install
npm run dev
```

Giao diện web sẽ chạy trên cổng 5173 (hoặc cổng được cấu hình trong `.env`).

### 6. Chạy Ứng Dụng Di Động

Mở cửa sổ dòng lệnh mới:

```bash
cd app-mobile
npm install
npm run dev
```

Sau đó làm theo hướng dẫn trên màn hình để mở ứng dụng trên thiết bị di động hoặc trình giả lập.

### 7. Chạy Chatbot Service

Mở cửa sổ dòng lệnh mới:

```bash
cd chatbot_service
pip install -r requirements.txt
python main.py
```

Hoặc chạy script phù hợp với hệ điều hành:
- Trên Windows: `start.bat`
- Trên Linux/Mac: `start.sh`

## Các Tính Năng Chính

- Quản lý phòng trọ
- Quản lý người thuê
- Quản lý giao dịch và thanh toán
- Chatbot hỗ trợ người dùng
- Ứng dụng di động cho cả chủ phòng và người thuê

## Cấu Hình Cổng

- **Server (Backend)**: Mặc định cổng 3000
- **Client (Web)**: Mặc định cổng 5173
- **App Mobile**: Chạy qua Expo, thường là cổng 8081
- **MongoDB**: Cổng 27017

## Gỡ Rối

Nếu gặp lỗi khi chạy dự án:

1. Đảm bảo tất cả các cổng chưa bị sử dụng bởi ứng dụng khác
2. Kiểm tra lại file `.env` đã được cấu hình đúng chưa
3. Đảm bảo Docker đang chạy nếu sử dụng MongoDB qua Docker
4. Cài đặt lại node_modules nếu có lỗi liên quan đến module:

```bash
# Trong từng thư mục client, server, app-mobile
rm -rf node_modules
npm install
```

## Chạy Ứng Dụng Hoàn Chỉnh

Để chạy toàn bộ ứng dụng, bạn cần mở 4 cửa sổ dòng lệnh riêng biệt và chạy từng thành phần như hướng dẫn ở trên.

## Góp Ý và Báo Lỗi

Nếu bạn gặp vấn đề hoặc muốn đóng góp cho dự án, vui lòng tạo issue trên repository.