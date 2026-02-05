import { Table, Card, Row, Col, Statistic, Button, Space, Tag, Modal, Descriptions, Image, Divider, Input, Popconfirm, Form, Input as AntInput, message, Checkbox, Select, Upload } from 'antd';
import { UploadOutlined, SearchOutlined } from '@ant-design/icons';
import {
    FileTextOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerPost.module.scss';
import { useEffect, useState } from 'react';
import { requestGetAllPosts, requestApprovePost, requestRejectPost, requestDeletePost, requestUpdatePost, requestUploadImages, requestCreatePostByAdmin, requestGetLocations } from '../../../../config/request';

const cx = classNames.bind(styles);

// Danh sách tiện ích giống như trong form tạo mới
const optionLabels = [
    'Đầy đủ nội thất',
    'Có gác',
    'Có kệ bếp',
    'Có máy lạnh',
    'Có máy giặt',
    'Có tủ lạnh',
    'Có thang máy',
    'Không chung chủ',
    'Giờ giấc tự do',
    'Có bảo vệ 24/24',
    'Có hầm để xe',
];

function ManagerAllPosts() {
    // Helper function for Upload component
    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e && e.fileList;
    };

    const [selectedPost, setSelectedPost] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [editImages, setEditImages] = useState([]);
    const [addImages, setAddImages] = useState([]);
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
    const [editForm] = Form.useForm();
    const [addForm] = Form.useForm();
    const [searchCategory, setSearchCategory] = useState('');
    const [searchProvince, setSearchProvince] = useState('');
    const [searchWard, setSearchWard] = useState('');
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    const handleViewDetails = (post) => {
        setSelectedPost(post);
        setIsModalVisible(true);
    };

    const handleReject = async (postId) => {
        try {
            await requestRejectPost({ id: postId, reason: approvalReason });
            fetchData();
        } catch (error) {
            console.log(error);
        }
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedPost(null);
    };

    const fetchData = async (category = '', province = '', ward = '') => {
        setLoading(true);
        try {
            // Fetch all posts regardless of status with search parameters
            const params = {
                page: pagination.current,
                limit: pagination.pageSize
            };

            // Add search parameters if they exist
            if (category) params.category = category;
            if (province) params.province = province;
            if (ward) params.ward = ward;

            const res = await requestGetAllPosts(params);
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
        fetchData('', '');
    }, []);

    const handleSearch = () => {
        fetchData(searchCategory, searchProvince, searchWard);
    };

    const handleReset = () => {
        setSearchCategory('');
        setSearchProvince('');
        setSearchWard('');
        fetchData('', '', '');
    };

    // Fetch provinces from the server
    const fetchProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const response = await requestGetLocations();
            setProvinces(response.metadata?.provinces || []);
        } catch (error) {
            console.error('Error fetching provinces:', error);
        } finally {
            setLoadingProvinces(false);
        }
    };

    // Fetch wards based on selected province
    const fetchWards = async (provinceCode) => {
        if (!provinceCode) {
            setWards([]);
            return;
        }

        setLoadingWards(true);
        try {
            const response = await requestGetLocations(provinceCode);
            setWards(response.metadata?.wards || []);
        } catch (error) {
            console.error('Error fetching wards:', error);
        } finally {
            setLoadingWards(false);
        }
    };

    // Load provinces when component mounts
    useEffect(() => {
        fetchProvinces();
        fetchData('', '', '');
    }, []);

    // Load wards when province selection changes
    useEffect(() => {
        fetchWards(searchProvince);
    }, [searchProvince]);

    const handleApprove = async (postId) => {
        try {
            await requestApprovePost({ id: postId, reason: approvalReason });
            setApprovalReason('');
            // Optimistic update: Update the post status in the UI immediately
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post._id === postId
                        ? { ...post, status: 'active' }
                        : post
                )
            );
            // Update stats optimistically
            setStats(prevStats => ({
                ...prevStats,
                activePosts: prevStats.activePosts + 1,
                inactivePosts: prevStats.inactivePosts - 1,
            }));
            message.success('Duyệt bài viết thành công');
        } catch (error) {
            console.log(error);
            // If the API call fails, we could optionally revert the optimistic update
            fetchData(); // Re-fetch to get the correct state
        } finally {
            handleCloseModal();
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await requestDeletePost({ id: postId });
            // Optimistic update: Remove the post from the UI immediately
            setPosts(prevPosts => {
                const postToDelete = prevPosts.find(post => post._id === postId);
                const updatedPosts = prevPosts.filter(post => post._id !== postId);

                // Update stats based on the deleted post
                setStats(prevStats => {
                    if (postToDelete && postToDelete.status === 'active') {
                        return {
                            ...prevStats,
                            totalPosts: prevStats.totalPosts - 1,
                            activePosts: prevStats.activePosts - 1,
                        };
                    } else if (postToDelete && postToDelete.status === 'inactive') {
                        return {
                            ...prevStats,
                            totalPosts: prevStats.totalPosts - 1,
                            inactivePosts: prevStats.inactivePosts - 1,
                        };
                    }
                    return {
                        ...prevStats,
                        totalPosts: prevStats.totalPosts - 1,
                    };
                });

                return updatedPosts;
            });
            message.success('Xóa bài viết thành công');
        } catch (error) {
            console.error('Error deleting post:', error);
            fetchData(); // Re-fetch to get the correct state if API call fails
        } finally {
            handleCloseModal();
        }
    };

    const handleEditClick = (post) => {
        setSelectedPost(post);

        // Decode HTML entities trong mô tả
        let decodedDescription = post.description

            // tim cach no ay hon
            ? post.description.replace(/<[^>]*>/g, '') // Loại bỏ HTML tags
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&Agrave;/g, 'À')
                .replace(/&agrave;/g, 'à')
                .replace(/&Egrave;/g, 'È')
                .replace(/&egrave;/g, 'è')
                .replace(/&Igrave;/g, 'Ì')
                .replace(/&igrave;/g, 'ì')
                .replace(/&Ograve;/g, 'Ò')
                .replace(/&ograve;/g, 'ò')
                .replace(/&Ugrave;/g, 'Ù')
                .replace(/&ugrave;/g, 'ù')
                .replace(/&Ygrave;/g, 'Ỳ')
                .replace(/&ygrave;/g, 'ỳ')
                .replace(/&Aacute;/g, 'Á')
                .replace(/&aacute;/g, 'á')
                .replace(/&Eacute;/g, 'É')
                .replace(/&eacute;/g, 'é')
                .replace(/&Iacute;/g, 'Í')
                .replace(/&iacute;/g, 'í')
                .replace(/&Oacute;/g, 'Ó')
                .replace(/&oacute;/g, 'ó')
                .replace(/&Uacute;/g, 'Ú')
                .replace(/&uacute;/g, 'ú')
                .replace(/&Yacute;/g, 'Ý')
                .replace(/&yacute;/g, 'ý')
                .replace(/&Acirc;/g, 'Â')
                .replace(/&acirc;/g, 'â')
                .replace(/&Ecirc;/g, 'Ê')
                .replace(/&ecirc;/g, 'ê')
                .replace(/&Icirc;/g, 'Î')
                .replace(/&icirc;/g, 'î')
                .replace(/&Ocirc;/g, 'Ô')
                .replace(/&ocirc;/g, 'ô')
                .replace(/&Ucirc;/g, 'Û')
                .replace(/&ucirc;/g, 'û')
                .replace(/&Agrave;/g, 'Ä')
                .replace(/&agrave;/g, 'ä')
                .replace(/&Ograve;/g, 'Ö')
                .replace(/&ograve;/g, 'ö')
                .replace(/&Ugrave;/g, 'Ü')
                .replace(/&ugrave;/g, 'ü')
                .replace(/&AElig;/g, 'Æ')
                .replace(/&aelig;/g, 'æ')
                .replace(/&szlig;/g, 'ß')
                .replace(/&Ccedil;/g, 'Ç')
                .replace(/&ccedil;/g, 'ç')
                .replace(/&Ntilde;/g, 'Ñ')
                .replace(/&ntilde;/g, 'ñ')
            : '';

        // Thiết lập ảnh ban đầu cho form
        if (post.images && Array.isArray(post.images)) {
            const initialFileList = post.images.map((img, index) => ({
                uid: `-${index + 1}`,
                name: `image-${index + 1}.jpg`,
                status: 'done',
                url: img,
                thumbUrl: img, // Thêm thumbUrl để hiển thị ảnh preview
            }));
            setEditImages(initialFileList);
        } else {
            setEditImages([]);
        }

        editForm.setFieldsValue({
            title: post.title,
            description: decodedDescription,
            price: post.price,
            area: post.area,
            username: post.username,
            phone: post.phone,
            location: post.location,
            typeNews: post.typeNews, // Thêm trường loại tin
            options: post.options || [], // Giữ nguyên mảng tiện ích đã chọn
        });
        setIsEditModalVisible(true);
    };

    const handleUpdatePost = async (values) => {
        try {
            // Sử dụng trực tiếp mảng tiện ích từ form
            const optionsArray = values.options || [];

            // Xử lý mô tả - nếu người dùng không thêm thẻ p, thì hệ thống sẽ thêm
            let processedDescription = values.description;
            if (!processedDescription.startsWith('<p>') && !processedDescription.startsWith('<P>')) {
                processedDescription = `<p>${processedDescription}</p>`;
            }

            // Xử lý ảnh - nếu có ảnh mới được upload thì upload lên server, nếu không thì dùng ảnh cũ
            let imageUrls = selectedPost.images || [];

            // Nếu có file ảnh mới được chọn trong editImages
            if (editImages && Array.isArray(editImages)) {
                const newFiles = editImages.filter(file => file.originFileObj);

                if (newFiles.length > 0) {
                    // Upload các ảnh mới lên server
                    const formData = new FormData();
                    newFiles.forEach((file) => {
                        formData.append('images', file.originFileObj);
                    });

                    try {
                        const resImages = await requestUploadImages(formData);
                        // Kết hợp ảnh mới upload với các ảnh đã tồn tại (nếu có)
                        const existingUrls = editImages
                            .filter(file => file.url && !file.originFileObj)
                            .map(file => file.url);
                        imageUrls = [...existingUrls, ...resImages.images];
                    } catch (uploadError) {
                        console.error('Error uploading images:', uploadError);
                        message.error('Cập nhật ảnh thất bại, giữ nguyên ảnh cũ');
                        // Nếu upload thất bại, giữ nguyên ảnh cũ
                        imageUrls = selectedPost.images || [];
                    }
                } else {
                    // Nếu không có file mới, dùng các ảnh đã có
                    const existingUrls = editImages
                        .filter(file => file.url)
                        .map(file => file.url);
                    imageUrls = existingUrls.length > 0 ? existingUrls : selectedPost.images || [];
                }
            }

            await requestUpdatePost(selectedPost._id, {
                ...values,
                images: imageUrls,
                category: selectedPost.category,
                options: optionsArray, // Gửi mảng tiện ích
                typeNews: values.typeNews || selectedPost.typeNews, // Dùng loại tin từ form nếu có, nếu không thì giữ nguyên
                description: processedDescription, // Sử dụng mô tả đã xử lý
            });
            message.success('Cập nhật bài viết thành công');
            setIsEditModalVisible(false);
            setEditImages([]); // Reset editImages
            fetchData();
        } catch (error) {
            console.error('Error updating post:', error);
            message.error('Cập nhật bài viết thất bại');
        }
    };

    const handleCreatePost = async (values) => {
        try {
            // Xử lý ảnh - upload tất cả các ảnh mới
            let imageUrls = [];

            if (addImages && Array.isArray(addImages) && addImages.length > 0) {
                const newFiles = addImages.filter(file => file.originFileObj);

                if (newFiles.length > 0) {
                    // Upload các ảnh mới lên server
                    const formData = new FormData();
                    newFiles.forEach((file) => {
                        formData.append('images', file.originFileObj);
                    });

                    const resImages = await requestUploadImages(formData);
                    imageUrls = resImages.images;
                }
            }

            // Xử lý mô tả - nếu người dùng không thêm thẻ p, thì hệ thống sẽ thêm
            let processedDescription = values.description;
            if (!processedDescription.startsWith('<p>') && !processedDescription.startsWith('<P>')) {
                processedDescription = `<p>${processedDescription}</p>`;
            }

            await requestCreatePostByAdmin({
                ...values,
                images: imageUrls,
                category: 'phong-tro', // Default category for admin created posts
                options: values.options || [],
                description: processedDescription,
                status: 'active', // Admin created posts are active by default
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now by default
                userId: 'admin', // Will be set by the server for admin created posts
            });
            message.success('Tạo bài viết thành công');
            setIsAddModalVisible(false);
            setAddImages([]); // Reset addImages
            addForm.resetFields();
            fetchData();
        } catch (error) {
            console.error('Error creating post:', error);
            message.error('Tạo bài viết thất bại');
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
            dataIndex: ['address', 'fullAddress'],
            key: 'location',
            render: (fullAddress, record) => fullAddress || record.location
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
                    cancel: { color: 'red', text: 'Đã từ chối' },
                };

                // Nếu status không tồn tại trong config, sử dụng giá trị mặc định
                const config = statusConfig[status] || { color: 'default', text: status };
                return <Tag color={config.color}>{config.text}</Tag>;
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
                    <Button
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record)}
                        size="small"
                    />
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditClick(record)}
                        size="small"
                    />
                    <Popconfirm
                        title="Xác nhận xóa bài viết?"
                        description="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
                        onConfirm={() => handleDeletePost(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                        />
                    </Popconfirm>
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
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Select
                            placeholder="Chọn danh mục"
                            value={searchCategory}
                            onChange={(value) => setSearchCategory(value)}
                            style={{ width: 200 }}
                            allowClear
                        >
                            <Select.Option value="">Tất cả danh mục</Select.Option>
                            <Select.Option value="phong-tro">Phòng trọ</Select.Option>
                            <Select.Option value="nha-nguyen-can">Nhà nguyên căn</Select.Option>
                            <Select.Option value="can-ho-chung-cu">Căn hộ chung cư</Select.Option>
                            <Select.Option value="can-ho-mini">Căn hộ mini</Select.Option>
                        </Select>

                        <Select
                            placeholder="Chọn tỉnh/thành phố"
                            value={searchProvince}
                            onChange={(value) => {
                                setSearchProvince(value);
                                // Reset ward selection when province changes
                                setSearchWard('');
                            }}
                            style={{ width: 200 }}
                            loading={loadingProvinces}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            <Select.Option value="">Tất cả tỉnh/thành phố</Select.Option>
                            {provinces.map((province) => (
                                <Select.Option key={province.Code} value={province.Code}>
                                    {province.Name}
                                </Select.Option>
                            ))}
                        </Select>

                        <Select
                            placeholder="Chọn phường/xã"
                            value={searchWard}
                            onChange={(value) => setSearchWard(value)}
                            style={{ width: 200 }}
                            loading={loadingWards}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            disabled={!searchProvince} // Disable if no province is selected
                        >
                            <Select.Option value="">Tất cả phường/xã</Select.Option>
                            {wards.map((ward) => (
                                <Select.Option key={ward.Code} value={ward.Code}>
                                    {ward.Name}
                                </Select.Option>
                            ))}
                        </Select>

                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                        >
                            Tìm kiếm
                        </Button>

                        <Button
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    </div>

                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)}>
                        Thêm bài viết
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={posts}
                    pagination={{
                        pageSize: pagination.pageSize,
                        current: pagination.current,
                        total: pagination.total,
                        onChange: (page, pageSize) => {
                            setPagination(prev => ({...prev, current: page, pageSize}));
                            fetchData(searchCategory, searchProvince, searchWard); // Refresh data after pagination change with search params
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
                                    {selectedPost.address?.fullAddress || selectedPost.location}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại tin">
                                <Tag color={selectedPost.typeNews === 'vip' ? 'gold' : 'blue'}>
                                    {selectedPost.typeNews === 'vip' ? 'VIP' : 'Thường'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                {selectedPost.status === 'active' ? (
                                    <Tag color="green">Đã duyệt</Tag>
                                ) : selectedPost.status === 'inactive' ? (
                                    <Tag color="orange">Chờ duyệt</Tag>
                                ) : (
                                    <Tag color="red">Đã từ chối</Tag>
                                )}
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

            {/* Modal cập nhật bài viết */}
            <Modal
                title="Cập nhật bài viết"
                open={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                onOk={() => {
                    editForm
                        .validateFields()
                        .then((values) => {
                            handleUpdatePost(values);
                        })
                        .catch((info) => {
                            console.log('Validate Failed:', info);
                        });
                }}
                width={800}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                >
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <AntInput />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                    >
                        <AntInput.TextArea rows={6} placeholder="Nhập mô tả chi tiết cho bài viết..." />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label="Giá"
                        rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
                    >
                        <AntInput type="number" />
                    </Form.Item>
                    <Form.Item
                        name="area"
                        label="Diện tích"
                        rules={[{ required: true, message: 'Vui lòng nhập diện tích!' }]}
                    >
                        <AntInput type="number" />
                    </Form.Item>
                    <Form.Item
                        name="username"
                        label="Tên người đăng"
                        rules={[{ required: true, message: 'Vui lòng nhập tên người đăng!' }]}
                    >
                        <AntInput />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại!' },
                            { pattern: /^0\d{9}$/, message: 'Số điện thoại không hợp lệ!' }
                        ]}
                    >
                        <AntInput />
                    </Form.Item>
                    <Form.Item
                        name="location"
                        label="Địa chỉ"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                    >
                        <AntInput />
                    </Form.Item>
                    <Form.Item
                        name="typeNews"
                        label="Loại tin"
                        rules={[{ required: true, message: 'Vui lòng chọn loại tin!' }]}
                    >
                        <Select placeholder="Chọn loại tin">
                            <Select.Option value="vip">Tin VIP</Select.Option>
                            <Select.Option value="normal">Tin thường</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="options"
                        label="Tiện ích"
                    >
                        <Checkbox.Group style={{ width: '100%' }}>
                            <Row gutter={[16, 16]}>
                                {optionLabels.map((label) => (
                                    <Col xs={24} sm={12} md={8} key={label}>
                                        <Checkbox value={label}>{label}</Checkbox>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                    <Form.Item
                        label="Hình ảnh"
                    >
                        <Upload
                            listType="picture-card"
                            fileList={editImages}
                            onChange={({ fileList }) => {
                                setEditImages(fileList);
                            }}
                            beforeUpload={() => false}
                        >
                            {editImages.length < 8 && (
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal thêm bài viết */}
            <Modal
                title="Tạo bài viết mới"
                open={isAddModalVisible}
                onCancel={() => {
                    setIsAddModalVisible(false);
                    setAddImages([]);
                    addForm.resetFields();
                }}
                onOk={() => {
                    addForm
                        .validateFields()
                        .then((values) => {
                            handleCreatePost(values);
                        })
                        .catch((info) => {
                            console.log('Validate Failed:', info);
                        });
                }}
                width={800}
            >
                <Form
                    form={addForm}
                    layout="vertical"
                >
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <AntInput />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                    >
                        <AntInput.TextArea rows={6} placeholder="Nhập mô tả chi tiết cho bài viết..." />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label="Giá"
                        rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
                    >
                        <AntInput type="number" />
                    </Form.Item>
                    <Form.Item
                        name="area"
                        label="Diện tích"
                        rules={[{ required: true, message: 'Vui lòng nhập diện tích!' }]}
                    >
                        <AntInput type="number" />
                    </Form.Item>
                    <Form.Item
                        name="username"
                        label="Tên người đăng"
                        rules={[{ required: true, message: 'Vui lòng nhập tên người đăng!' }]}
                    >
                        <AntInput />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại!' },
                            { pattern: /^0\d{9}$/, message: 'Số điện thoại không hợp lệ!' }
                        ]}
                    >
                        <AntInput />
                    </Form.Item>
                    <Form.Item
                        name="location"
                        label="Địa chỉ"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                    >
                        <AntInput />
                    </Form.Item>
                    <Form.Item
                        name="typeNews"
                        label="Loại tin"
                        rules={[{ required: true, message: 'Vui lòng chọn loại tin!' }]}
                    >
                        <Select placeholder="Chọn loại tin">
                            <Select.Option value="vip">Tin VIP</Select.Option>
                            <Select.Option value="normal">Tin thường</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="options"
                        label="Tiện ích"
                    >
                        <Checkbox.Group style={{ width: '100%' }}>
                            <Row gutter={[16, 16]}>
                                {optionLabels.map((label) => (
                                    <Col xs={24} sm={12} md={8} key={label}>
                                        <Checkbox value={label}>{label}</Checkbox>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                    <Form.Item
                        label="Hình ảnh"
                    >
                        <Upload
                            listType="picture-card"
                            fileList={addImages}
                            onChange={({ fileList }) => {
                                setAddImages(fileList);
                            }}
                            beforeUpload={() => false}
                        >
                            {addImages.length < 8 && (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerAllPosts;