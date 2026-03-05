import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import AddPostForm from '../../Pages/InfoUser/Components/ManagerPost/AddPostForm';

function PostModal({ visible, onClose }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { fetchAuth } = useStore(); // To refresh user data after creating a post

    const handleCreatePost = async (formData) => {
        setIsSubmitting(true);
        try {
            // Import the requestCreatePost function
            const { requestCreatePost } = await import('../../config/request');

            // Call the API to create the post
            const response = await requestCreatePost(formData);

            console.log('Post creation response:', response); // Debug log

            // Backend trả về { code: 200, message: '...', metadata: {...} } khi thành công
            // Hoặc { message: '...', metadata: {...} } từ success.response
            const isSuccess = response && (
                response.code === 200 || 
                response.code === 'OK' ||
                response.success === true ||
                (response.metadata && !response.error)
            );

            console.log('Is success?', isSuccess); // Debug log

            if (isSuccess) {
                // Show success message with green checkmark
                message.success('Tạo bài đăng thành công!', 2);

                try {
                    // Refresh user data to update post count and balance
                    await fetchAuth();
                } catch (refreshError) {
                    console.error('Error refreshing user data:', refreshError);
                    // Don't fail the entire operation if refresh fails
                }

                // Close the modal first, then navigate
                onClose();
                
                // Use setTimeout to ensure modal closes before navigation
                setTimeout(() => {
                    navigate('/trang-ca-nhan');
                }, 300);
            } else {
                // Handle error response
                const errorMessage = response?.message || response?.error || 'Có lỗi xảy ra khi tạo bài đăng';
                console.log('Error message to display:', errorMessage); // Debug log
                message.error(errorMessage);
                // Don't close the modal on API error so user can fix and resubmit
            }
        } catch (error) {
            console.error('Full error object:', error); // More detailed error logging
            console.error('Error creating post:', error);

            let errorMessage = 'Có lỗi xảy ra khi tạo bài đăng';

            if (error.response) {
                console.log('Error response details:', error.response); // Debug log
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
            // Don't close the modal on error so user can fix and resubmit
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <Modal
            title="Tạo bài đăng mới"
            open={visible}
            onCancel={handleCancel}
            footer={null}
            width={1000}
            destroyOnClose={true}
        >
            <AddPostForm
                onFinish={handleCreatePost}
                onCancel={handleCancel}
                initialValues={null}
            />
        </Modal>
    );
}

export default PostModal;