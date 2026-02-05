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
            console.log('Response data type:', typeof response);
            console.log('Response keys:', Object.keys(response || {}));

            // Check for error first - if response has error field, treat as error regardless of other indicators
            const hasError = response && (response.error || (response.data && response.data.error));

            // Check for success - API might return different success indicators
            // Common success response patterns: { success: true }, { status: 'success' }, { data: { success: true } }
            const isSuccess = response && !hasError && (
                response.success === true ||
                response.status === 'success' ||
                (response.data && response.data.success) ||
                response.statusCode === 200 ||
                response.code === 200
            );

            console.log('Has error?', hasError); // Debug log
            console.log('Is success?', isSuccess); // Debug log

            if (isSuccess) {
                // Show success message - Ant Design's message.success already has a green checkmark
                message.success('Tạo bài đăng thành công!');

                try {
                    // Refresh user data to update post count
                    await fetchAuth();
                } catch (refreshError) {
                    console.error('Error refreshing user data:', refreshError);
                    // Don't fail the entire operation if refresh fails
                }

                // Close the modal - ensure this happens regardless of navigation
                onClose();

                // Redirect to user's profile page
                navigate('/trang-ca-nhan');
            } else if (hasError) {
                // Handle error response
                const errorMessage = response?.error || response?.data?.error || response?.message || 'Có lỗi xảy ra khi tạo bài đăng';
                console.log('Error message to display:', errorMessage); // Debug log
                message.error(errorMessage);

                // Don't close the modal on API error so user can fix and resubmit
                // The modal will remain open for user to correct any issues
            } else {
                // Handle different response formats for error (when no explicit success indicators)
                const errorMessage = response?.message || response?.error || response?.data?.message || 'Có lỗi xảy ra khi tạo bài đăng';
                console.log('Error message to display:', errorMessage); // Debug log
                message.error(errorMessage);

                // Don't close the modal on API error so user can fix and resubmit
                // The modal will remain open for user to correct any issues
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
            // The modal will remain open for user to correct any issues
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
            onCancel={onClose}
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