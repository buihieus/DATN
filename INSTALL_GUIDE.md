# Hướng Dẫn Cài Đặt WebView cho Thanh Toán

Để tích hợp thanh toán VNPay và MOMO trong ứng dụng mobile, bạn cần cài đặt thư viện react-native-webview.

## Bước 1: Cài đặt thư viện

Chạy lệnh sau trong thư mục mobile-app:

```bash
npx expo install react-native-webview
```

## Bước 2: Rebuild ứng dụng

Sau khi cài đặt xong, bạn cần rebuild ứng dụng:

```bash
npx expo start -c
```

## Bước 3: Sử dụng tính năng

Sau khi cài đặt, bạn có thể:

1. Truy cập vào trang hồ sơ
2. Nhấn vào nút "Nạp tiền" 
3. Chọn số tiền và phương thức thanh toán (VNPay hoặc MoMo)
4. Ứng dụng sẽ chuyển sang màn hình thanh toán trong WebView
5. Hoàn tất thanh toán theo hướng dẫn
6. Sau khi thanh toán thành công, hệ thống sẽ tự động cập nhật số dư

## Lưu ý:

- Đảm bảo thiết bị có kết nối internet
- Một số cổng thanh toán có thể yêu cầu bạn đăng nhập tài khoản ngân hàng
- Sau khi thanh toán thành công, số dư sẽ được cập nhật tự động

## Về tính năng:

- Tích hợp cả VNPay và MOMO
- Xử lý callback sau thanh toán
- Cập nhật số dư người dùng
- Gửi thông báo qua socket sau khi thanh toán thành công
- Giao diện thân thiện với người dùng
- Tránh vòng lặp điều hướng không mong muốn

## Nếu gặp vấn đề:

1. Kiểm tra lại URL backend trong constants/API.ts
2. Đảm bảo các biến môi trường trong .env đã chính xác
3. Kiểm tra lại cấu hình VNPay/MoMo trong backend
4. Có thể thử chạy lại ứng dụng với lệnh: npx expo start --clear