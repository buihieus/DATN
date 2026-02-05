import React, { useState, useMemo, useEffect } from 'react';
import { Card, Typography, Button, Table, Space, Popconfirm, message, Row, Col, Statistic, Tag } from 'antd';
import { FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined, RetweetOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerPost.module.scss';
import AddPostForm from './AddPostForm'; // Import the form component
import RenewPostModal from './RenewPostModal'; // Import the renew modal component
import { requestCreatePost, requestDeletePost, requestGetPostByUserId, requestUpdatePost, requestRenewPost } from '../../../../config/request';
import { useStore } from '../../../../hooks/useStore';

const cx = classNames.bind(styles);
const { Title, Text } = Typography;

// Category mapping for display
const categoryMap = {
    'phong-tro': 'Phòng trọ',
    'nha-nguyen-can': 'Nhà nguyên căn',
    'can-ho-chung-cu': 'Căn hộ chung cư',
    'can-ho-mini': 'Căn hộ mini',
    'o-ghep': 'Ở ghép',
};

// NEW Checkbox options list (used for consistency)

function ManagerPost() {
    const [posts, setPosts] = useState([]); // Initialize with fake data
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingPost, setEditingPost] = useState(null); // null for adding, post object for editing
    const [renewModalVisible, setRenewModalVisible] = useState(false);
    const [selectedPostForRenew, setSelectedPostForRenew] = useState(null);

    const { fetchAuth } = useStore();

    const fetchPosts = async () => {
        const res = await requestGetPostByUserId();
        setPosts(res.metadata);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    // Calculate statistics using useMemo for efficiency
    const postStats = useMemo(() => {
        const stats = {
            total: posts.length,
            byCategory: {
                'phong-tro': 0,
                'nha-nguyen-can': 0,
                'can-ho-chung-cu': 0,
                'can-ho-mini': 0,
                'o-ghep': 0,
            },
        };
        posts.forEach((post) => {
            if (post.category && stats.byCategory[post.category] !== undefined) {
                stats.byCategory[post.category]++;
            }
        });
        return stats;
    }, [posts]);

    const handleAddPost = () => {
        setEditingPost(null); // Ensure we are in "add" mode
        setIsFormVisible(true);
    };

    const handleDeletePost = async (postId) => {
        try {
            const data = {
                id: postId,
            };
            const res = await requestDeletePost(data);
            message.success(res.message);
            fetchPosts();
            fetchAuth();
        } catch (error) {
            message.error(error.response.data.message);
        }
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setIsFormVisible(true);
    };

    const handleUpdatePost = async (postId, formData) => {
        try {
            const data = {
                ...formData,
                // Convert images to the expected format
                images: formData.images.map(img =>
                    typeof img === 'string' ? img : img.url || img.thumbUrl
                ).filter(img => img !== undefined)
            };

            const res = await requestUpdatePost(postId, data);
            message.success(res.message);
            fetchPosts();
            fetchAuth();
            setIsFormVisible(false);
            setEditingPost(null);
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bài viết');
        }
    };

    const handleFormFinish = async (formData) => {
        if (editingPost) {
            // Editing existing post
            handleUpdatePost(editingPost._id, formData);
        } else {
            // Adding new post - Call the API to create the post
            try {
                const res = await requestCreatePost(formData);
                message.success(res.message || 'Bài viết đã được tạo thành công!');
                setIsFormVisible(false);
                setEditingPost(null);
                // Refresh the posts list to get the actual data from the server
                fetchPosts();
                fetchAuth(); // Refresh user's auth data (balance)
            } catch (error) {
                console.error('Error creating post:', error);
                const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo bài viết';
                message.error(errorMessage);
            }
        }
    };

    const handleFormCancel = () => {
        setIsFormVisible(false);
        setEditingPost(null);
    };

    const handleRenewPost = (post) => {
        setSelectedPostForRenew(post);
        setRenewModalVisible(true);
    };

    const handleRenewSuccess = async () => {
        message.success('Gia hạn bài đăng thành công!');
        await fetchPosts(); // Refresh the posts list
        fetchAuth(); // Refresh user's auth data (balance)
    };

    // Define columns for the posts table
    const columns = [
        {
            title: 'Ảnh',
            dataIndex: 'images',
            key: 'images',
            width: 80,
            render: (images) => {
                if (images && Array.isArray(images) && images.length > 0) {
                    // Lấy ảnh đầu tiên
                    const firstImage = typeof images[0] === 'string' ? images[0] : (images[0]?.url || images[0]?.thumbUrl);
                    return firstImage ? (
                        <img
                            src={firstImage}
                            alt="Ảnh bài viết"
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                        />
                    ) : (
                        <div style={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                            No Image
                        </div>
                    );
                } else {
                    return (
                        <div style={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                            No Image
                        </div>
                    );
                }
            },
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'Giá (VNĐ)',
            dataIndex: 'price',
            key: 'price',
            render: (price) => price?.toLocaleString('vi-VN'),
        },
        {
            title: 'Loại hình',
            dataIndex: 'category',
            key: 'category',
            render: (category) => categoryMap[category] || category, // Use display name
        },
        {
            title: 'Diện tích (m²)',
            dataIndex: 'area',
            key: 'area',
        },
        {
            title: 'Địa chỉ',
            dataIndex: ['address', 'fullAddress'],
            key: 'location',
            render: (fullAddress, record) => fullAddress || record.location,
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'green';
                let text = 'Đã duyệt';
                if (status === 'inactive') {
                    color = 'red';
                    text = 'Chưa duyệt';
                } else if (status === 'active') {
                    color = 'green';
                    text = 'Đã duyệt';
                } else if (status === 'cancel') {
                    color = 'gray';
                    text = 'Đã hủy';
                }
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Hết hạn',
            dataIndex: 'endDate',
            key: 'expires',
            render: (endDate) => {
                const currentDate = new Date();
                const postEndDate = new Date(endDate);
                const isExpired = postEndDate < currentDate;

                return (
                    <Tag color={isExpired ? 'red' : 'green'}>
                        {isExpired ? 'Đã hết hạn' : 'Còn hạn'}
                    </Tag>
                );
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 150, // Set a fixed width for the action column
            render: (_, record) => (
                <Space size="small" wrap>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEditPost(record)}
                        size="small"
                    />
                    <Button
                        icon={<RetweetOutlined />}
                        onClick={() => handleRenewPost(record)}
                        size="small"
                        type="primary"
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        title="Gia hạn bài viết"
                    />
                    <Popconfirm
                        title="Bạn chắc chắn muốn xóa?"
                        onConfirm={() => handleDeletePost(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            size="small"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {isFormVisible ? (
                // Show Add/Edit Form
                <AddPostForm
                    onFinish={handleFormFinish}
                    onCancel={handleFormCancel}
                    initialValues={editingPost} // Pass initialValues for editing
                />
            ) : (
                // Show Post List View
                <div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 24, // Increased margin
                        }}
                    >
                        <Title level={4} style={{ margin: 0 }}>
                            Thống kê bài viết
                        </Title>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPost}>
                            Thêm bài viết mới
                        </Button>
                    </div>

                    {/* Statistics Section */}
                    {posts.length > 0 && (
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                                <Col span={6}>
                                    <Card bordered={false} className={cx('stat-card')}>
                                        <Statistic title="Tổng số bài viết" value={postStats.total} />
                                    </Card>
                                </Col>

                                {Object.entries(postStats.byCategory).map(([key, value]) => (
                                    <Col span={6} key={key}>
                                        <Card bordered={false} className={cx('stat-card')}>
                                            <Statistic title={categoryMap[key]} value={value} />
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                        </Row>
                    )}

                    {posts.length > 0 ? (
                        <>
                            <Title level={5} style={{ marginBottom: 16 }}>
                                Danh sách chi tiết
                            </Title>
                            <Table columns={columns} dataSource={posts} rowKey="_id" bordered pagination={false} />
                        </>
                    ) : (
                        // Placeholder when no posts exist
                        <Card className={cx('content-card')}>
                            <FileTextOutlined className={cx('content-icon')} />
                            <Title level={4}>Chưa có bài viết nào</Title>
                            <Text>Nhấn "Thêm bài viết mới" để bắt đầu đăng tin.</Text>
                        </Card>
                    )}
                </div>
            )}

            {/* Renew Post Modal */}
            {selectedPostForRenew && (
                <RenewPostModal
                    visible={renewModalVisible}
                    onCancel={() => {
                        setRenewModalVisible(false);
                        setSelectedPostForRenew(null);
                    }}
                    post={selectedPostForRenew}
                    onRenewSuccess={handleRenewSuccess}
                />
            )}
        </div>
    );
}

export default ManagerPost;
