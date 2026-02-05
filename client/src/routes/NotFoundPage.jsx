// src/pages/NotFoundPage.jsx
import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404 - Not Found"
      subTitle="Xin lỗi, trang bạn đang tìm không tồn tại hoặc đã bị xóa."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Quay về trang chủ
        </Button>
      }
    />
  );
};
export default NotFoundPage;
