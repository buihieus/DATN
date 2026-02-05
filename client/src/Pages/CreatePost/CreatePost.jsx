import React, { useState, useEffect } from 'react';
import { Card, Typography, message, Row, Col } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import Header from '../../Components/Header/Header';
import AddPostForm from '../InfoUser/Components/ManagerPost/AddPostForm';
import { requestCreatePost } from '../../config/request';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import './CreatePost.css';

const { Title, Text } = Typography;

function CreatePost() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { dataUser, fetchAuth } = useStore(); // To refresh user data after creating a post

    // Redirect to login if user is not logged in
    useEffect(() => {
        if (!dataUser._id) {
            navigate('/login');
        }
    }, [dataUser._id, navigate]);

    const handleCreatePost = async (formData) => {
        setIsSubmitting(true);
        try {
            // Call the API to create the post
            const response = await requestCreatePost(formData);

            if (response && response.success) {
                message.success('Tạo bài đăng thành công!');

                // Refresh user data to update post count
                await fetchAuth();

                // Redirect to user's post management page
                navigate('/trang-ca-nhan');
            } else {
                message.error(response.message || 'Có lỗi xảy ra khi tạo bài đăng');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            let errorMessage = 'Có lỗi xảy ra khi tạo bài đăng';

            if (error.response) {
                // Server responded with error status
                if (error.response.status === 413) {
                    errorMessage = 'Dung lượng ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.';
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                } else {
                    errorMessage = `Lỗi máy chủ: ${error.response.status} - ${error.response.statusText}`;
                }
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối Internet.';
            } else {
                // Something else happened
                errorMessage = error.message || 'Có lỗi xảy ra khi tạo bài đăng';
            }

            message.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Navigate back to user's profile
        navigate('/trang-ca-nhan');
    };

    // If user is not logged in, don't render the form
    if (!dataUser._id) {
        return null; // Redirect will happen in useEffect
    }

    return (
        <div style={{ minHeight: '100vh' }}>
            <Header />
            <div
                style={{
                    width: '90%',
                    maxWidth: '80%',
                    margin: '100px auto 40px auto',
                    padding: '20px 0'
                }}
                className="create-post-container"
            >
                <Card
                    style={{
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: '24px'
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                        <Title level={2} style={{ color: '#000' }}>Tạo bài đăng mới</Title>
                        <Text type="secondary">Điền đầy đủ thông tin để đăng tin cho thuê phòng trọ của bạn</Text>
                    </div>

                    <Row justify="center">
                        <Col xs={24} lg={20} xl={18}>
                            <AddPostForm
                                onFinish={handleCreatePost}
                                onCancel={handleCancel}
                                initialValues={null}
                            />
                        </Col>
                    </Row>
                </Card>
            </div>
        </div>
    );
}

export default CreatePost;