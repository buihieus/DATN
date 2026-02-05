import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Result, Button, Spin } from "antd";

import Context from "../store/Context";
import { requestGetAdmin, requestAuth } from "../config/request";
import CryptoJS from 'crypto-js';

const ProtectedRouteAdmin = ({ children }) => {
  const { dataUser } = useContext(Context);
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Gọi API kiểm tra quyền admin
        await requestGetAdmin();
        setHasAccess(true);
      } catch (err) {
        console.error("Lỗi kiểm tra quyền admin:", err);
        setError(err);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    // Kiểm tra xem người dùng đã đăng nhập chưa
    const verifyUserAndAccess = async () => {
      // Nếu context chưa có dữ liệu người dùng (dataUser._id không tồn tại)
      if (!dataUser || !dataUser._id) {
        try {
          // Gọi requestAuth để lấy thông tin người dùng từ server
          const userData = await requestAuth();
          const bytes = CryptoJS.AES.decrypt(userData.metadata.auth, import.meta.env.VITE_SECRET_CRYPTO);
          const originalText = bytes.toString(CryptoJS.enc.Utf8);
          const user = JSON.parse(originalText);
          
          // Người dùng đã đăng nhập, kiểm tra quyền admin
          await checkAdminAccess();
        } catch (err) {
          // Không có quyền truy cập hoặc chưa đăng nhập
          setError(err);
          setHasAccess(false);
          setChecking(false);
        }
      } else {
        // Đã có thông tin người dùng trong context, kiểm tra quyền admin
        await checkAdminAccess();
      }
    };

    verifyUserAndAccess();
  }, [dataUser]);

  // Hiển thị khi đang kiểm tra
  if (checking) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin tip="Đang kiểm tra quyền truy cập..." size="large" />
      </div>
    );
  }

  // Nếu không có quyền truy cập
  if (!hasAccess) {
    return (
      <Result
        status="403"
        title="403 - Forbidden"
        subTitle="Xin lỗi, bạn không có quyền truy cập vào trang này."
        extra={
          <Button type="primary" onClick={() => navigate("/")}>
            Quay lại trang chủ
          </Button>
        }
      />
    );
  }

  // Nếu là admin -> cho phép hiển thị nội dung bên trong
  return children;
};
export default ProtectedRouteAdmin;