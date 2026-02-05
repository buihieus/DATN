import { Table, Card, Row, Col, Statistic, Button, Space, Popconfirm, Modal, Form, Input, message, Switch, Tooltip } from 'antd';
import { UserOutlined, UserAddOutlined, UserDeleteOutlined, DollarOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerUser.module.scss';
import { useEffect, useState, useRef } from 'react';
import { requestGetUsers, requestDeleteUser, requestUpdateUserByAdmin, requestCreateUserByAdmin } from '../../../../config/request';

const cx = classNames.bind(styles);

function ManagerUser() {
    const [userData, setUserData] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        newUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        totalRevenue: 0,
    });
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();
    const [addForm] = Form.useForm();

    const fetchData = async (searchTerm = '') => {
        try {
            const res = await requestGetUsers(searchTerm);
            const data = res.metadata;
            setUserData(data);

            // Calculate statistics
            const now = new Date();
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

            const newStats = {
                totalUsers: data.length,
                newUsers: data.filter((item) => new Date(item.user.createdAt) > thirtyDaysAgo).length,
                activeUsers: data.filter((item) => item.totalPost > 0).length,
                inactiveUsers: data.filter((item) => item.totalPost === 0).length,
                totalRevenue: data.reduce((sum, item) => sum + item.totalSpent, 0),
            };

            setStats(newStats);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };


    useEffect(() => {
        fetchData('');
    }, []);

    const handleDeleteUser = async (userId) => {
        try {
            await requestDeleteUser({ id: userId });
            message.success('Xóa người dùng thành công');
            fetchData();
        } catch (error) {
            console.error('Error deleting user:', error);
            message.error('Xóa người dùng thất bại');
        }
    };

    const handleEditUser = (record) => {
        setEditingUser(record);
        form.setFieldsValue({
            fullName: record.user.fullName,
            email: record.user.email,
            phone: record.user.phone,
            address: record.user.address,
            isAdmin: record.user.isAdmin,
        });
        setEditModalVisible(true);
    };

    const handleUpdateUser = async (values) => {
        try {
            // Prepare data to send - include all fields including isAdmin
            const updateData = {
                fullName: values.fullName,
                phone: values.phone,
                email: values.email,
                address: values.address,
                avatar: values.avatar,
                isAdmin: values.isAdmin, // Include isAdmin in the update
            };

            await requestUpdateUserByAdmin(editingUser.user._id, updateData);
            message.success('Cập nhật người dùng thành công');
            setEditModalVisible(false);
            setEditingUser(null);
            fetchData();
        } catch (error) {
            console.error('Error updating user:', error);
            message.error('Cập nhật người dùng thất bại');
        }
    };

    // Table columns configuration
    const columns = [
        {
            title: 'Họ và tên',
            dataIndex: ['user', 'fullName'],
            key: 'fullName',
        },
        {
            title: 'Email',
            dataIndex: ['user', 'email'],
            key: 'email',
        },
        {
            title: 'Số điện thoại',
            dataIndex: ['user', 'phone'],
            key: 'phone',
        },
        {
            title: 'Địa chỉ',
            dataIndex: ['user', 'address'],
            key: 'address',
        },
        {
            title: 'Loại tài khoản',
            dataIndex: ['user', 'isAdmin'],
            key: 'userType',
            render: (isAdmin) => (
                <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: isAdmin ? '#f6ffed' : '#e6f7ff',
                    color: isAdmin ? '#52c41a' : '#1890ff',
                    border: isAdmin ? '1px solid #b7eb8f' : '1px solid #91d5ff'
                }}>
                    {isAdmin ? 'Quản trị viên' : 'Người dùng'}
                </span>
            ),
        },
        {
            title: 'Ngày tham gia',
            dataIndex: ['user', 'createdAt'],
            key: 'joinDate',
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Số bài đăng',
            dataIndex: 'totalPost',
            key: 'totalPost',
        },
        {
            title: 'Tổng chi tiêu',
            dataIndex: 'totalSpent',
            key: 'totalSpent',
            render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEditUser(record)}
                    />
                    {record.user.isAdmin ? (
                        <Tooltip title="Không thể xóa tài khoản quản trị viên">
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                disabled
                            />
                        </Tooltip>
                    ) : (
                        <Popconfirm
                            title="Xác nhận xóa người dùng?"
                            description="Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác."
                            onConfirm={() => handleDeleteUser(record.user._id)}
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
                    )}
                </Space>
            ),
        },
    ];

    const handleCreateUser = async (values) => {
        try {
            // Hash password before sending
            const password = values.password;
            if (password.length < 6) {
                message.error('Mật khẩu phải có ít nhất 6 ký tự');
                return;
            }

            await requestCreateUserByAdmin({
                ...values,
                password,
                typeLogin: 'email',
            });
            message.success('Tạo người dùng thành công');
            setAddModalVisible(false);
            addForm.resetFields();
            fetchData();
        } catch (error) {
            console.error('Error creating user:', error);
            message.error('Tạo người dùng thất bại');
        }
    };

    return (
        <div className={cx('manager-user')}>
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Card>
                        <Statistic title="Tổng số người dùng" value={stats.totalUsers} prefix={<UserOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Người dùng mới"
                            value={stats.newUsers}
                            prefix={<UserAddOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>

                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Tổng doanh thu"
                            value={stats.totalRevenue}
                            prefix={<DollarOutlined />}
                            formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc email"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onPressEnter={() => fetchData(searchText)}
                            style={{ width: 300 }}
                        />
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={() => fetchData(searchText)}
                        >
                            Tìm kiếm
                        </Button>
                        <Button
                            onClick={() => {
                                setSearchText('');
                                fetchData('');
                            }}
                        >
                            Làm mới
                        </Button>
                    </div>
                    <Button type="primary" icon={<UserAddOutlined />} onClick={() => setAddModalVisible(true)}>
                        Thêm người dùng
                    </Button>
                </div>
                <Table
                    columns={columns}
                    dataSource={userData}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1400 }}
                    rowKey={(record) => record.user._id}
                />
            </Card>

            <Modal
                title="Chỉnh sửa người dùng"
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    setEditingUser(null);
                    form.resetFields();
                }}
                onOk={() => {
                    form
                        .validateFields()
                        .then((values) => {
                            handleUpdateUser(values);
                        })
                        .catch((info) => {
                            console.log('Validate Failed:', info);
                        });
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="address"
                        label="Địa chỉ"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="isAdmin"
                        label="Là quản trị viên"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Add User Modal */}
            <Modal
                title="Tạo người dùng mới"
                open={addModalVisible}
                onCancel={() => {
                    setAddModalVisible(false);
                    addForm.resetFields();
                }}
                onOk={() => {
                    addForm
                        .validateFields()
                        .then((values) => {
                            handleCreateUser(values);
                        })
                        .catch((info) => {
                            console.log('Validate Failed:', info);
                        });
                }}
            >
                <Form
                    form={addForm}
                    layout="vertical"
                >
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại!' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="address"
                        label="Địa chỉ"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="isAdmin"
                        label="Là quản trị viên"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerUser;