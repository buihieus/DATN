// import { useEffect, useState } from 'react';
// import { Card, Row, Col, Statistic, Table, Typography, Progress, Avatar, Tag, Tooltip, message } from 'antd';
// import { Column } from '@ant-design/plots';
// import {
//     UserOutlined,
//     HomeOutlined,
//     DollarOutlined,
//     ShoppingOutlined,
//     ArrowUpOutlined,
//     ArrowDownOutlined,
//     CheckCircleOutlined,
//     ClockCircleOutlined,
//     CloseCircleOutlined,
// } from '@ant-design/icons';
// import classNames from 'classnames/bind';
// import styles from './Dashborad.module.scss';
// import { requestGetAdminStats, requestGetPublicStats } from '../../../../config/request';

// const { Title, Text } = Typography;
// const cx = classNames.bind(styles);

// function Dashboard() {
//     const [loading, setLoading] = useState(true);
//     const [stats, setStats] = useState({
//         totalUsers: 0,
//         totalPosts: 0,
//         totalTransactions: 0,
//         totalRevenue: 0,
//         userGrowth: 0,
//         postGrowth: 0,
//         transactionGrowth: 0,
//         revenueGrowth: 0,
//     });
//     const [postsData, setPostsData] = useState([]);
//     const [recentTransactions, setRecentTransactions] = useState([]);
//     const [topUsers, setTopUsers] = useState([]);

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 setLoading(true);
//                 const res = await requestGetAdminStats();
//                 if (res && res.metadata) {
//                     // Update statistics with fallback values
//                     setStats(prevStats => ({
//                         ...prevStats,
//                         totalUsers: res.metadata.totalUsers || 0,
//                         totalPosts: res.metadata.totalPosts || 0,
//                         totalTransactions: res.metadata.totalTransactions || 0,
//                         totalRevenue: res.metadata.totalRevenue || 0,
//                         userGrowth: res.metadata.userGrowth || 0,
//                         postGrowth: res.metadata.postGrowth || 0,
//                         transactionGrowth: res.metadata.transactionGrowth || 0,
//                         revenueGrowth: res.metadata.revenueGrowth || 0,
//                     }));

//                     // Update posts data for chart
//                     setPostsData(res.metadata.postsData || []);

//                     // Update recent transactions
//                     setRecentTransactions(res.metadata.recentTransactions || []);

//                     // Update top users
//                     setTopUsers(res.metadata.topUsers || []);
//                 }
//             } catch (error) {
//                 console.error('Error fetching admin stats:', error);
//                 // Check if it's specifically an auth error (403)
//                 if (error.response && error.response.status === 403) {
//                     console.error('Administrator privileges required to access this dashboard.');
//                     // Show a message to the user about admin access
//                     message.warning('Bạn cần quyền quản trị viên để xem thống kê này.');
//                 } else {
//                     console.error('Other error occurred while fetching admin stats.', error.message);
//                 }

//                 // Still set default values to show the dashboard structure
//                 setStats({
//                     totalUsers: 0,
//                     totalPosts: 0,
//                     totalTransactions: 0,
//                     totalRevenue: 0,
//                     userGrowth: 0,
//                     postGrowth: 0,
//                     transactionGrowth: 0,
//                     revenueGrowth: 0,
//                 });
//                 setPostsData([]);
//                 setRecentTransactions([]);
//                 setTopUsers([]);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchData();
//     }, []);

//     // Column chart config
//     const columnConfig = {
//         data: postsData,
//         xField: 'date',
//         yField: 'posts',
//         color: '#1a237e',
//         label: {
//             position: 'middle',
//             style: {
//                 fill: '#FFFFFF',
//                 opacity: 0.6,
//             },
//         },
//         xAxis: {
//             label: {
//                 autoHide: true,
//                 autoRotate: false,
//             },
//         },
//         meta: {
//             date: {
//                 alias: 'Ngày',
//             },
//             posts: {
//                 alias: 'Số tin',
//             },
//         },
//     };

//     const transactionColumns = [
//         {
//             title: 'Người dùng',
//             dataIndex: 'username',
//             key: 'username',
//             render: (text, record) => (
//                 <div className={cx('user-cell')}>
//                     <Avatar icon={<UserOutlined />} className={cx('user-avatar')} />
//                     <div>
//                         <div className={cx('user-name')}>{text}</div>
//                         <div className={cx('user-id')}>{record.userId}</div>
//                     </div>
//                 </div>
//             ),
//         },
//         {
//             title: 'Số tiền',
//             dataIndex: 'amount',
//             key: 'amount',
//             render: (amount) => (
//                 <div className={cx('amount-cell')}>
//                     <DollarOutlined className={cx('amount-icon')} />
//                     <span>{(amount / 1000).toLocaleString()}k VND</span>
//                 </div>
//             ),
//         },
//         {
//             title: 'Phương thức',
//             dataIndex: 'typePayment',
//             key: 'typePayment',
//             render: (type) => (
//                 <Tag color="blue" className={cx('payment-tag')}>
//                     {type}
//                 </Tag>
//             ),
//         },
//         {
//             title: 'Trạng thái',
//             dataIndex: 'status',
//             key: 'status',
//             render: (status) => {
//                 const statusConfig = {
//                     completed: {
//                         color: 'success',
//                         icon: <CheckCircleOutlined />,
//                         text: 'Thành công',
//                     },
//                     pending: {
//                         color: 'warning',
//                         icon: <ClockCircleOutlined />,
//                         text: 'Đang xử lý',
//                     },
//                     failed: {
//                         color: 'error',
//                         icon: <CloseCircleOutlined />,
//                         text: 'Thất bại',
//                     },
//                 };

//                 const config = statusConfig[status] || {
//                     color: 'default',
//                     icon: <ClockCircleOutlined />,
//                     text: status,
//                 };

//                 return (
//                     <Tag icon={config.icon} color={config.color} className={cx('status-tag')}>
//                         {config.text}
//                     </Tag>
//                 );
//             },
//         },
//         {
//             title: 'Ngày',
//             dataIndex: 'createdAt',
//             key: 'createdAt',
//             render: (date) => (
//                 <div className={cx('date-cell')}>
//                     {new Date(date).toLocaleDateString('vi-VN', {
//                         year: 'numeric',
//                         month: '2-digit',
//                         day: '2-digit',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                     })}
//                 </div>
//             ),
//         },
//     ];

//     return (
//         <div className={cx('wrapper')}>
//             <div className={cx('header')}></div>

//             <Row gutter={[16, 16]}>
//                 <Col xs={24} sm={12} lg={6}>
//                     <Card className={cx('stat-card')} variant="outlined">
//                         <div className={cx('stat-icon', 'users')}>
//                             <UserOutlined />
//                         </div>
//                         <Statistic
//                             title="Tổng người dùng"
//                             value={stats.totalUsers}
//                             loading={loading}
//                             suffix={
//                                 <span className={cx('growth', stats.userGrowth >= 0 ? 'positive' : 'negative')}>
//                                     {stats.userGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
//                                     {Math.abs(stats.userGrowth)}%
//                                 </span>
//                             }
//                         />
//                         <Progress percent={75} showInfo={false} strokeColor="#1a237e" />
//                     </Card>
//                 </Col>
//                 <Col xs={24} sm={12} lg={6}>
//                     <Card className={cx('stat-card')} variant="outlined">
//                         <div className={cx('stat-icon', 'posts')}>
//                             <HomeOutlined />
//                         </div>
//                         <Statistic
//                             title="Tổng tin đăng"
//                             value={stats.totalPosts}
//                             loading={loading}
//                             suffix={
//                                 <span className={cx('growth', stats.postGrowth >= 0 ? 'positive' : 'negative')}>
//                                     {stats.postGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
//                                     {Math.abs(stats.postGrowth)}%
//                                 </span>
//                             }
//                         />
//                         <Progress percent={60} showInfo={false} strokeColor="#0d47a1" />
//                     </Card>
//                 </Col>
//                 <Col xs={24} sm={12} lg={6}>
//                     <Card className={cx('stat-card')} variant="outlined">
//                         <div className={cx('stat-icon', 'transactions')}>
//                             <ShoppingOutlined />
//                         </div>
//                         <Statistic
//                             title="Tổng giao dịch"
//                             value={stats.totalTransactions}
//                             loading={loading}
//                             suffix={
//                                 <span className={cx('growth', stats.transactionGrowth >= 0 ? 'positive' : 'negative')}>
//                                     {stats.transactionGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
//                                     {Math.abs(stats.transactionGrowth)}%
//                                 </span>
//                             }
//                         />
//                         <Progress percent={45} showInfo={false} strokeColor="#1565c0" />
//                     </Card>
//                 </Col>
//                 <Col xs={24} sm={12} lg={6}>
//                     <Card className={cx('stat-card')} variant="outlined">
//                         <div className={cx('stat-icon', 'revenue')}>
//                             <DollarOutlined />
//                         </div>
//                         <Statistic
//                             title="Tổng doanh thu"
//                             value={stats.totalRevenue}
//                             loading={loading}
//                             formatter={(value) => `${(value / 1000).toLocaleString()}k `}
//                             suffix={
//                                 <span className={cx('growth', stats.revenueGrowth >= 0 ? 'positive' : 'negative')}>
//                                     {stats.revenueGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
//                                     {Math.abs(stats.revenueGrowth)}%
//                                 </span>
//                             }
//                         />
//                         <Progress percent={90} showInfo={false} strokeColor="#1976d2" />
//                     </Card>
//                 </Col>
//             </Row>

//             <Row gutter={[16, 16]} className={cx('content-row')}>
//                 <Col xs={24} lg={16}>
//                     <Card title="Lịch sử nạp tiền" className={cx('table-card')} loading={loading} variant="outlined">
//                         <Table
//                             dataSource={recentTransactions}
//                             columns={transactionColumns}
//                             rowKey="_id"
//                             pagination={{ pageSize: 5 }}
//                             className={cx('transactions-table')}
//                         />
//                     </Card>
//                 </Col>
//                 <Col xs={24} lg={8}>
//                     <Card title="Top người dùng" className={cx('users-card')} loading={loading} variant="outlined">
//                         <div className={cx('top-users')}>
//                             {topUsers.map((user, index) => (
//                                 <div key={user.id} className={cx('user-item')}>
//                                     <div className={cx('user-rank')}>{index + 1}</div>
//                                     <Avatar
//                                         src={user.avatar}
//                                         icon={!user.avatar && <UserOutlined />}
//                                         className={cx('user-avatar')}
//                                     />
//                                     <div className={cx('user-info')}>
//                                         <div className={cx('user-name')}>{user.name}</div>
//                                         <div className={cx('user-posts')}>{user.posts} tin</div>
//                                     </div>
//                                     <Tooltip title="Xem hồ sơ">
//                                         <div className={cx('user-action')}>
//                                             <UserOutlined />
//                                         </div>
//                                     </Tooltip>
//                                 </div>
//                             ))}
//                         </div>
//                     </Card>
//                 </Col>
//             </Row>

//             <Row gutter={[16, 16]} className={cx('content-row')}>
//                 <Col xs={24}>
//                     <Card
//                         title="Thống kê tin đăng 7 ngày gần đây"
//                         className={cx('chart-card')}
//                         loading={loading}
//                         variant="outlined"
//                     >
//                         <Column {...columnConfig} />
//                     </Card>
//                 </Col>
//             </Row>
//         </div>
//     );
// }

// export default Dashboard;
import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Progress, Avatar, Tag, Tooltip, message, Spin } from 'antd'; // ✅ Thêm Spin
import { Column } from '@ant-design/plots';
import {
    UserOutlined,
    HomeOutlined,
    DollarOutlined,
    ShoppingOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './Dashborad.module.scss';
import { requestGetAdminStats, requestGetPublicStats } from '../../../../config/request';

const { Title, Text } = Typography;
const cx = classNames.bind(styles);

function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        userGrowth: 0,
        postGrowth: 0,
        transactionGrowth: 0,
        revenueGrowth: 0,
    });
    const [postsData, setPostsData] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [topUsers, setTopUsers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // First, try to get admin stats
                try {
                    const res = await requestGetAdminStats();
                    if (res && res.metadata) {
                        // Update statistics with admin data
                        setStats(prevStats => ({
                            ...prevStats,
                            totalUsers: res.metadata.totalUsers || 0,
                            totalPosts: res.metadata.totalPosts || 0,
                            totalTransactions: res.metadata.totalTransactions || 0,
                            totalRevenue: res.metadata.totalRevenue || 0,
                            userGrowth: res.metadata.userGrowth || 0,
                            postGrowth: res.metadata.postGrowth || 0,
                            transactionGrowth: res.metadata.transactionGrowth || 0,
                            revenueGrowth: res.metadata.revenueGrowth || 0,
                        }));

                        // Update posts data for chart
                        setPostsData(res.metadata.postsData ? JSON.parse(JSON.stringify(res.metadata.postsData)) : []);

                        // Update recent transactions
                        setRecentTransactions(res.metadata.recentTransactions ? JSON.parse(JSON.stringify(res.metadata.recentTransactions)) : []);

                        // Update top users
                        setTopUsers(res.metadata.topUsers ? JSON.parse(JSON.stringify(res.metadata.topUsers)) : []);
                    }
                } catch (adminError) {
                    const status = adminError.response?.status;

                    if (status === 403) {
                        // If admin access is forbidden, try to get public stats instead
                        console.warn('Admin access denied, attempting to get public stats:', adminError.message);

                        try {
                            const publicRes = await requestGetPublicStats();
                            if (publicRes && publicRes.metadata) {
                                // Update statistics with public data (only available public stats)
                                setStats(prevStats => ({
                                    ...prevStats,
                                    totalUsers: publicRes.metadata.totalUsers || 0,
                                    totalPosts: publicRes.metadata.totalPosts || 0,
                                    // We can't show transaction stats or revenue for non-admins
                                    totalTransactions: 0,
                                    totalRevenue: 0,
                                    // Calculate growth based on new posts/users
                                    newPosts: publicRes.metadata.newPosts || 0,
                                    newUsers: publicRes.metadata.newUsers || 0,
                                    userGrowth: 0, // We can't calculate growth without previous data
                                    postGrowth: 0,
                                    transactionGrowth: 0,
                                    revenueGrowth: 0,
                                }));

                                // Update posts data for chart from public data
                                setPostsData(publicRes.metadata.postsData ? JSON.parse(JSON.stringify(publicRes.metadata.postsData)) : []);

                                // For non-admins, don't show transactions and top users
                                setRecentTransactions([]);
                                setTopUsers([]);

                                message.info('Bạn đang xem bản xem trước dashboard. Đăng nhập với quyền Admin để thấy đầy đủ dữ liệu.');
                            }
                        } catch (publicError) {
                            console.error('Error fetching public stats:', publicError);
                            // If public stats also fail, use default values
                            setStats({
                                totalUsers: 0,
                                totalPosts: 0,
                                totalTransactions: 0,
                                totalRevenue: 0,
                                userGrowth: 0,
                                postGrowth: 0,
                                transactionGrowth: 0,
                                revenueGrowth: 0,
                            });
                            setPostsData([]);
                            setRecentTransactions([]);
                            setTopUsers([]);
                        }
                    } else if (status === 401) {
                        message.error('Lỗi xác thực: Phiên đăng nhập hết hạn.');
                    } else {
                        message.error('Lỗi khi tải dữ liệu thống kê. Vui lòng kiểm tra Server.');
                    }
                }
            } catch (error) {
                console.error('Unexpected error fetching stats:', error);
                message.error('Lỗi không xác định khi tải dữ liệu.');

                // Set default values in case of unexpected errors
                setStats({
                    totalUsers: 0,
                    totalPosts: 0,
                    totalTransactions: 0,
                    totalRevenue: 0,
                    userGrowth: 0,
                    postGrowth: 0,
                    transactionGrowth: 0,
                    revenueGrowth: 0,
                });
                setPostsData([]);
                setRecentTransactions([]);
                setTopUsers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);


    const transactionColumns = [
        {
            title: 'Người dùng',
            dataIndex: 'username',
            key: 'username',
            render: (text, record) => (
                <div className={cx('user-cell')}>
                    <Avatar icon={<UserOutlined />} className={cx('user-avatar')} />
                    <div>
                        <div className={cx('user-name')}>{text || 'N/A'}</div>
                        <div className={cx('user-id')}>{record.userId || 'N/A'}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => (
                <div className={cx('amount-cell')}>
                    <DollarOutlined className={cx('amount-icon')} />
                    <span>{amount !== undefined ? `${(amount / 1000).toLocaleString()}k VND` : '0k VND'}</span>
                </div>
            ),
        },
        {
            title: 'Phương thức',
            dataIndex: 'typePayment',
            key: 'typePayment',
            render: (type) => (
                <Tag color="blue" className={cx('payment-tag')}>
                    {type || 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusConfig = {
                    completed: {
                        color: 'success',
                        icon: <CheckCircleOutlined />,
                        text: 'Thành công',
                    },
                    pending: {
                        color: 'warning',
                        icon: <ClockCircleOutlined />,
                        text: 'Đang xử lý',
                    },
                    failed: {
                        color: 'error',
                        icon: <CloseCircleOutlined />,
                        text: 'Thất bại',
                    },
                };

                const config = statusConfig[status] || {
                    color: 'default',
                    icon: <ClockCircleOutlined />,
                    text: status,
                };

                return (
                    <Tag icon={config.icon} color={config.color} className={cx('status-tag')}>
                        {config.text}
                    </Tag>
                );
            },
        },
        {
            title: 'Ngày',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => (
                <div className={cx('date-cell')}>
                    {date ? new Date(date).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                    }) : 'N/A'}
                </div>
            ),
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}></div>

            <Row gutter={[16, 16]}>
                {/* ... (Các Col Stat giữ nguyên) ... */}
                <Col xs={24} sm={12} lg={6}>
                    <Card className={cx('stat-card')} variant="outlined">
                        <div className={cx('stat-icon', 'users')}>
                            <UserOutlined />
                        </div>
                        <Statistic
                            title="Tổng người dùng"
                            value={stats.totalUsers}
                            loading={loading}
                            suffix={
                                <span className={cx('growth', stats.userGrowth >= 0 ? 'positive' : 'negative')}>
                                    {stats.userGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(stats.userGrowth)}%
                                </span>
                            }
                        />
                        <Progress percent={75} showInfo={false} strokeColor="#1a237e" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className={cx('stat-card')} variant="outlined">
                        <div className={cx('stat-icon', 'posts')}>
                            <HomeOutlined />
                        </div>
                        <Statistic
                            title="Tổng tin đăng"
                            value={stats.totalPosts}
                            loading={loading}
                            suffix={
                                <span className={cx('growth', stats.postGrowth >= 0 ? 'positive' : 'negative')}>
                                    {stats.postGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(stats.postGrowth)}%
                                </span>
                            }
                        />
                        <Progress percent={60} showInfo={false} strokeColor="#0d47a1" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className={cx('stat-card')} variant="outlined">
                        <div className={cx('stat-icon', 'transactions')}>
                            <ShoppingOutlined />
                        </div>
                        <Statistic
                            title="Tổng giao dịch"
                            value={stats.totalTransactions}
                            loading={loading}
                            suffix={
                                <span className={cx('growth', stats.transactionGrowth >= 0 ? 'positive' : 'negative')}>
                                    {stats.transactionGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(stats.transactionGrowth)}%
                                </span>
                            }
                        />
                        <Progress percent={45} showInfo={false} strokeColor="#1565c0" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className={cx('stat-card')} variant="outlined">
                        <div className={cx('stat-icon', 'revenue')}>
                            <DollarOutlined />
                        </div>
                        <Statistic
                            title="Tổng doanh thu"
                            value={stats.totalRevenue}
                            loading={loading}
                            formatter={(value) => `${(value / 1000).toLocaleString()}k `}
                            suffix={
                                <span className={cx('growth', stats.revenueGrowth >= 0 ? 'positive' : 'negative')}>
                                    {stats.revenueGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(stats.revenueGrowth)}%
                                </span>
                            }
                        />
                        <Progress percent={90} showInfo={false} strokeColor="#1976d2" />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className={cx('content-row')}>
                <Col xs={24} lg={16}>
                    <Card title="Lịch sử nạp tiền" className={cx('table-card')} loading={loading} variant="outlined">
                        <Table
                            dataSource={recentTransactions}
                            columns={transactionColumns}
                            rowKey="_id"
                            pagination={{ pageSize: 5 }}
                            className={cx('transactions-table')}
                            locale={{ emptyText: <Text type="secondary">Không có giao dịch gần đây nào.</Text> }} // ✅ Thêm empty state
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Top người dùng" className={cx('users-card')} loading={loading} variant="outlined">
                        <div className={cx('top-users')}>
                            {loading ? (
                                <Spin size="small" />
                            ) : topUsers.length === 0 ? (
                                <Text type="secondary">Không có dữ liệu người dùng top.</Text>
                            ) : (
                                topUsers.map((user, index) => (
                                    <div key={user.id} className={cx('user-item')}>
                                        <div className={cx('user-rank')}>{index + 1}</div>
                                        <Avatar
                                            src={user.avatar}
                                            icon={!user.avatar && <UserOutlined />}
                                            className={cx('user-avatar')}
                                        />
                                        <div className={cx('user-info')}>
                                            <div className={cx('user-name')}>{user.name}</div>
                                            <div className={cx('user-posts')}>{user.posts} tin</div>
                                        </div>
                                        <Tooltip title="Xem hồ sơ">
                                            <div className={cx('user-action')}>
                                                <UserOutlined />
                                            </div>
                                        </Tooltip>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className={cx('content-row')}>
                <Col xs={24}>
                    <Card
                        title="Thống kê tin đăng 7 ngày gần đây"
                        className={cx('chart-card')}
                        loading={loading}
                        variant="outlined"
                    >
                         {/* ✅ Kiểm tra data trước khi render biểu đồ */}
                        {postsData && postsData.length > 0 ? (
                            <Column
                                data={postsData}
                                xField="date"
                                yField="posts"
                                color="#1a237e"
                                xAxis={{
                                    label: {
                                        autoHide: true,
                                        autoRotate: false,
                                    },
                                }}
                                meta={{
                                    date: { alias: 'Ngày' },
                                    posts: { alias: 'Số tin' },
                                }}
                            />
                        ) : (
                            !loading && <div style={{ height: 300, textAlign: 'center', paddingTop: 100 }}><Text type="secondary">Không có dữ liệu tin đăng để hiển thị biểu đồ.</Text></div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Dashboard;
