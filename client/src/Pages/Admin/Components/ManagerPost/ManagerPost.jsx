import { Table, Card, Row, Col, Statistic, Button, Space, Tag, Modal, Descriptions, Image, Divider, Input, message } from 'antd';
import {
    FileTextOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerPost.module.scss';
import { useEffect, useState } from 'react';
import { requestGetAllPosts, requestApprovePost, requestRejectPost } from '../../../../config/request';

const cx = classNames.bind(styles);

function ManagerPost() {
    const [selectedPost, setSelectedPost] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [approvalReason, setApprovalReason] = useState('');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [stats, setStats] = useState({
        totalPosts: 0,
        activePosts: 0,
        inactivePosts: 0,
        totalRevenue: 0,
    });

    const handleViewDetails = (post) => {
        setSelectedPost(post);
        setIsModalVisible(true);
    };

    const handleReject = async (postId) => {
        try {
            await requestRejectPost({ id: postId, reason: approvalReason });
            // Optimistic update: Remove the post from the UI immediately
            setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
            // Update stats optimistically
            setStats(prevStats => ({
                ...prevStats,
                inactivePosts: prevStats.inactivePosts - 1,
                totalPosts: prevStats.totalPosts - 1,
            }));
        } catch (error) {
            console.log(error);
            fetchData(); // Re-fetch to get the correct state if API call fails
        }
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedPost(null);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch only pending posts for approval
            const res = await requestGetAllPosts({ status: 'inactive', page: pagination.current, limit: pagination.pageSize });
            if (res && res.metadata) {
                setPosts(res.metadata.posts);

                // Update pagination info
                setPagination(prev => ({
                    ...prev,
                    total: res.metadata.totalPosts,
                }));

                // Calculate statistics
                const totalPosts = res.metadata.totalPosts;
                const activePosts = res.metadata.activePosts || res.metadata.posts.filter((post) => post.status === 'active').length;
                const inactivePosts = res.metadata.inactivePosts || res.metadata.posts.filter((post) => post.status === 'inactive').length;
                const totalRevenue = res.metadata.totalRevenue || res.metadata.posts.reduce((sum, post) => sum + post.price, 0);

                setStats({
                    totalPosts,
                    activePosts,
                    inactivePosts,
                    totalRevenue,
                });
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (postId) => {
        try {
            await requestApprovePost({ id: postId, reason: approvalReason });
            setApprovalReason('');
            // Optimistic update: Remove the post from pending list since it's now approved
            setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
            // Update stats optimistically
            setStats(prevStats => ({
                ...prevStats,
                inactivePosts: prevStats.inactivePosts - 1,
                activePosts: prevStats.activePosts + 1,
                totalPosts: prevStats.totalPosts, // Total remains the same since it just changes status
            }));
            message.success('Duyệt bài viết thành công');
        } catch (error) {
            console.log(error);
            fetchData(); // Re-fetch to get the correct state if API call fails
        } finally {
            handleCloseModal();
        }
    };

    const getCategoryName = (category) => {
        const categoryMap = {
            'phong-tro': 'Phòng trọ',
            'nha-nguyen-can': 'Nhà nguyên căn',
            'can-ho-chung-cu': 'Căn hộ chung cư',
            'can-ho-mini': 'Căn hộ mini',
        };
        return categoryMap[category] || category;
    };

    // Table columns configuration
    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Người đăng',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Ảnh',
            dataIndex: 'images',
            key: 'images',
            render: (images) => (
                <Image
                    src={images && images.length > 0 ? images[0] : ''}
                    alt="Ảnh đại diện"
                    style={{ width: 60, height: 60, objectFit: 'cover' }}
                    fallback="https://via.placeholder.com/60x60?text=No+Image"
                />
            ),
        },
        {
            title: 'Loại phòng',
            dataIndex: 'category',
            key: 'category',
            render: (category) => getCategoryName(category),
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`,
        },
        {
            title: 'Diện tích',
            dataIndex: 'area',
            key: 'area',
            render: (area) => `${area}m²`,
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: 'Loại tin',
            dataIndex: 'typeNews',
            key: 'typeNews',
            render: (type) => <Tag color={type === 'vip' ? 'gold' : 'blue'}>{type === 'vip' ? 'VIP' : 'Thường'}</Tag>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusConfig = {
                    active: { color: 'green', text: 'Đã duyệt' },
                    inactive: { color: 'orange', text: 'Chờ duyệt' },
                };
                return <Tag color={statusConfig[status].color}>{statusConfig[status].text}</Tag>;
            },
        },
        {
            title: 'Ngày đăng',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="default" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
                        Chi tiết
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className={cx('manager-post')}>
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Card>
                        <Statistic title="Tổng số bài viết" value={stats.totalPosts} prefix={<FileTextOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Bài viết đã duyệt"
                            value={stats.activePosts}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Bài viết chờ duyệt"
                            value={stats.inactivePosts}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginTop: 16 }}>
                <Table
                    columns={columns}
                    dataSource={posts}
                    pagination={{
                        pageSize: pagination.pageSize,
                        current: pagination.current,
                        total: pagination.total,
                        onChange: (page, pageSize) => {
                            setPagination(prev => ({...prev, current: page, pageSize}));
                            fetchData(); // Refresh data after pagination change
                        }
                    }}
                    scroll={{ x: 1500 }}
                    loading={loading}
                    rowKey="_id"
                />
            </Card>

            <Modal
                title="Chi tiết bài viết"
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Đóng
                    </Button>,
                    selectedPost?.status === 'inactive' && (
                        <Space size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                key="approve"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => {
                                    handleApprove(selectedPost._id);
                                    handleCloseModal();
                                }}
                            >
                                Duyệt
                            </Button>
                            <Space.Compact style={{ width: '300px' }}>
                                <Input.TextArea
                                    key="reason"
                                    placeholder="Nhập lý do từ chối"
                                    value={approvalReason}
                                    onChange={(e) => setApprovalReason(e.target.value)}
                                    autoSize={{ minRows: 1, maxRows: 3 }}
                                    style={{ borderRadius: '6px 0 0 6px' }}
                                />
                                <Button
                                    key="reject"
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => {
                                        handleReject(selectedPost._id);
                                        handleCloseModal();
                                    }}
                                    style={{ borderRadius: '0 6px 6px 0' }}
                                >
                                    Từ chối
                                </Button>
                            </Space.Compact>
                        </Space>
                    ),
                ]}
                width={1000}
            >
                {selectedPost && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Image.PreviewGroup>
                                <Row gutter={[8, 8]}>
                                    {selectedPost.images?.map((image, index) => (
                                        <Col span={8} key={index}>
                                            <Image
                                                src={image}
                                                alt={`Ảnh ${index + 1}`}
                                                style={{ width: '100%', height: 200, objectFit: 'cover' }}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </Image.PreviewGroup>
                        </div>

                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Tiêu đề" span={2}>
                                {selectedPost.title}
                            </Descriptions.Item>
                            <Descriptions.Item label="Người đăng">{selectedPost.username}</Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                <Space>
                                    <PhoneOutlined />
                                    {selectedPost.phone}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại phòng">
                                {getCategoryName(selectedPost.category)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá">
                                {selectedPost.price.toLocaleString('vi-VN')} VNĐ
                            </Descriptions.Item>
                            <Descriptions.Item label="Diện tích">{selectedPost.area}m²</Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ" span={2}>
                                <Space>
                                    <EnvironmentOutlined />
                                    {selectedPost.location}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại tin">
                                <Tag color={selectedPost.typeNews === 'vip' ? 'gold' : 'blue'}>
                                    {selectedPost.typeNews === 'vip' ? 'VIP' : 'Thường'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={selectedPost.status === 'active' ? 'green' : 'orange'}>
                                    {selectedPost.status === 'active' ? 'Đã duyệt' : 'Chờ duyệt'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày đăng">
                                <Space>
                                    <ClockCircleOutlined />
                                    {new Date(selectedPost.createdAt).toLocaleDateString('vi-VN')}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày hết hạn">
                                <Space>
                                    <ClockCircleOutlined />
                                    {new Date(selectedPost.endDate).toLocaleDateString('vi-VN')}
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation="left">Mô tả chi tiết</Divider>
                        <div
                            style={{ marginBottom: 16 }}
                            dangerouslySetInnerHTML={{ __html: selectedPost.description }}
                        />

                        <Divider orientation="left">Tiện ích</Divider>
                        <Row gutter={[16, 16]}>
                            {selectedPost.options &&
                                selectedPost.options.map((option, index) => (
                                    <Col span={8} key={index}>
                                        <Tag color="green">{option}</Tag>
                                    </Col>
                                ))}
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default ManagerPost;