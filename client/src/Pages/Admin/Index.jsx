// import { useEffect, useState } from 'react';
// import { Layout, Menu, theme, Dropdown, Space, Avatar } from 'antd';
// import {
//     MenuFoldOutlined,
//     MenuUnfoldOutlined,
//     DashboardOutlined,
//     UserOutlined,
//     DollarOutlined,
//     GlobalOutlined,
//     LogoutOutlined,
//     HomeFilled,
//     DownOutlined,
//     CheckSquareOutlined,
//     ReadOutlined,
// } from '@ant-design/icons';
// import { useNavigate } from 'react-router-dom';
// import { requestGetAdmin, requestAuth } from '../../config/request';
// import Dashboard from './Components/Dashborad/Dashborad';
// import classNames from 'classnames/bind';
// import styles from './Index.module.scss';

// import ManagerUser from './Components/ManagerUser/ManagerUser';
// import ManagerPost from './Components/ManagerPost/ManagerPost';
// import ManagerAllPosts from './Components/ManagerPost/ManagerAllPosts';
// import ManagerRechange from './Components/ManagerRechange/ManagerRechange';
// import CryptoJS from 'crypto-js';

// const { Header, Sider, Content } = Layout;
// const cx = classNames.bind(styles);

// function Admin() {
//     const [collapsed, setCollapsed] = useState(false);
//     const navigate = useNavigate();
//     const [user, setUser] = useState(null);

//     const [type, setType] = useState('dashboard');

//     // useEffect(() => {
//     //     const fetchData = async () => {
//     //         try {
//     //             await requestGetAdmin();
//     //             // Fetch user information
//     //             const userData = await requestAuth();
//     //             // Decrypt the user data like in Provider.jsx
//     //             const bytes = CryptoJS.AES.decrypt(userData.metadata.auth, import.meta.env.VITE_SECRET_CRYPTO);
//     //             const originalText = bytes.toString(CryptoJS.enc.Utf8);
//     //             const user = JSON.parse(originalText);
//     //             setUser(user);
//     //         } catch (error) {
//     //             console.error('Error fetching admin data:', error);
//     //             navigate('/');
//     //         }
//     //     };
//     //     fetchData();
//     // }, [navigate]);
//     useEffect(() => {
//         const fetchUserData = async () => {
//             try {
//                 // ✅ Gọi API để lấy thông tin user đã đăng nhập
//                 // (Không cần kiểm tra quyền vì route guard đã xử lý)
//                 const userData = await requestAuth();

//                 // ✅ Giải mã dữ liệu user được mã hóa AES
//                 const bytes = CryptoJS.AES.decrypt(
//                     userData.metadata.auth,
//                     import.meta.env.VITE_SECRET_CRYPTO
//                 );

//                 const originalText = bytes.toString(CryptoJS.enc.Utf8);
//                 const user = JSON.parse(originalText);

//                 // ✅ Cập nhật state user trong context hoặc component
//                 setUser(user);
//             } catch (error) {
//                 console.error("❌ Lỗi khi lấy thông tin người dùng:", error);

//                 // Nếu lỗi (chưa đăng nhập, token hết hạn, hoặc dữ liệu lỗi) → quay về login
//                 navigate("/login");
//             }
//         };

//         fetchUserData();
//     }, [navigate, setUser]);
// //};
// const handleLogout = async () => {
//     try {
//         await fetch('http://localhost:3000/api/logout', {
//             method: 'GET',
//             credentials: 'include',
//         });
//         navigate('/');
//     } catch (error) {
//         console.error('Logout error:', error);
//         navigate('/');
//     }
// };

// const userMenuItems = [
//     // {
//     //     key: 'profile',
//     //     label: 'Hồ sơ cá nhân',
//     //     onClick: () => navigate('/info-user'),
//     // },
//     {
//         key: 'homepage',
//         label: 'Trang chủ',
//         icon: <HomeFilled />,
//         onClick: () => navigate('/'),
//     },
//     {
//         type: 'divider',
//     },
//     {
//         key: 'logout',
//         label: 'Đăng xuất',
//         icon: <LogoutOutlined />,
//         onClick: handleLogout,
//     },
// ];

// const menuItems = [
//     {
//         key: 'dashboard',
//         icon: <DashboardOutlined />,
//         label: 'Bảng điều khiển',
//         onClick: () => setType('dashboard'),
//     },
//     {
//         key: 'users',
//         icon: <UserOutlined />,
//         label: 'Quản lý người dùng',
//         onClick: () => setType('users'),
//     },
//     {
//         key: 'pending-posts',
//         icon: <CheckSquareOutlined />,
//         label: 'Bài viết chờ duyệt',
//         onClick: () => setType('posts'),
//     },
//     {
//         key: 'all-posts',
//         icon:<ReadOutlined />,
//         label: 'Tất cả bài viết',
//         onClick: () => setType('all-posts'),
//     },
//     {
//         key: 'transactions',
//         icon: <DollarOutlined />,
//         label: 'Quản lý giao dịch',
//         onClick: () => setType('transactions'),
//     },
//     // {
//     //     key: 'home',
//     //     icon: <HomeOutlined />,
//     //     label: 'Trang chủ',
//     //     onClick: () => navigate("/"),
//     // },
// ];

// return (
//     <Layout className={cx('admin-layout')}>
//         <Sider trigger={null} collapsible collapsed={collapsed} className={cx('sider')} width={280}>
//             <div className={cx('logo')}>
//                 <div className={cx('logo-icon')}>
//                     <GlobalOutlined />
//                 </div>
//                 {!collapsed && (
//                     <div className={cx('logo-text')}>
//                         <h1>PhongTro123</h1>
//                         <span>Admin Portal</span>
//                     </div>
//                 )}
//             </div>
//             <Menu
//                 theme="dark"
//                 mode="inline"
//                 defaultSelectedKeys={['dashboard']}
//                 items={menuItems}
//                 className={cx('menu')}
//             />
//         </Sider>
//         <Layout>
//             <Header className={cx('header')}>
//                 <div className={cx('header-left')}>
//                     {collapsed ? (
//                         <MenuUnfoldOutlined className={cx('trigger')} onClick={() => setCollapsed(!collapsed)} />
//                     ) : (
//                         <MenuFoldOutlined className={cx('trigger')} onClick={() => setCollapsed(!collapsed)} />
//                     )}
//                 </div>
//                 <div className={cx('header-right')}>
//                     {user && (
//                         <Dropdown
//                             menu={{ items: userMenuItems }}
//                             trigger={['click']}
//                         >
//                             <div className={cx('user-info')}>
//                                 <Avatar
//                                     size="small"
//                                     src={user.avatar || "https://placekitten.com/32/32"}
//                                     className={cx('avatar')}
//                                 >
//                                     {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
//                                 </Avatar>
//                                 <div className={cx('user-details')}>
//                                     <span className={cx('username')}>
//                                         {user.fullName || user.email}
//                                     </span>
//                                 </div>
//                                 <DownOutlined style={{ fontSize: '10px', color: '#999' }} />
//                             </div>
//                         </Dropdown>
//                     )}
//                 </div>
//             </Header>
//             <Content className={cx('content')}>
//                 {type === 'dashboard' && <Dashboard />}
//                 {type === 'users' && <ManagerUser />}
//                 {type === 'posts' && <ManagerPost />}
//                 {type === 'all-posts' && <ManagerAllPosts />}
//                 {type === 'transactions' && <ManagerRechange />}
//             </Content>
//         </Layout>
//     </Layout>
// );
// }

// export default Admin;
import { useEffect, useState } from 'react';
import { Layout, Menu, Dropdown, Space, Avatar, Spin, message } from 'antd'; // ✅ Thêm Spin và message
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    UserOutlined,
    DollarOutlined,
    GlobalOutlined,
    LogoutOutlined,
    HomeFilled,
    DownOutlined,
    CheckSquareOutlined,
    ReadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { requestAuth } from '../../config/request';
import Dashboard from './Components/Dashborad/Dashborad';
import classNames from 'classnames/bind';
import styles from './Index.module.scss';

import ManagerUser from './Components/ManagerUser/ManagerUser';
import ManagerPost from './Components/ManagerPost/ManagerPost';
import ManagerAllPosts from './Components/ManagerPost/ManagerAllPosts';
import ManagerRechange from './Components/ManagerRechange/ManagerRechange';
import CryptoJS from 'crypto-js';

const { Header, Sider, Content } = Layout;
const cx = classNames.bind(styles);

function Admin() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // ✅ THÊM: Trạng thái loading
    const [type, setType] = useState('dashboard');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await requestAuth();

                const bytes = CryptoJS.AES.decrypt(
                    userData.metadata.auth,
                    import.meta.env.VITE_SECRET_CRYPTO
                );

                const originalText = bytes.toString(CryptoJS.enc.Utf8);
                const user = JSON.parse(originalText);

                // ✅ KIỂM TRA QUYỀN ADMIN
                if (!user.isAdmin) {
                    message.error('Truy cập bị từ chối. Bạn không có quyền quản trị viên.');
                    navigate('/'); // Chuyển hướng nếu không phải admin
                    return;
                }

                setUser(user);
                setIsLoading(false); // Tắt loading khi thành công
            } catch (error) {
                console.error("❌ Lỗi khi lấy thông tin người dùng:", error);
                setIsLoading(false); // Tắt loading dù thất bại
                navigate("/login");
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3000/api/logout', {
                method: 'GET',
                credentials: 'include',
            });
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/');
        }
    };

    const userMenuItems = [
        {
            key: 'homepage',
            label: 'Trang chủ',
            icon: <HomeFilled />,
            onClick: () => navigate('/'),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            label: 'Đăng xuất',
            icon: <LogoutOutlined />,
            onClick: handleLogout,
        },
    ];

    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Bảng điều khiển',
            onClick: () => setType('dashboard'),
        },
        {
            key: 'users',
            icon: <UserOutlined />,
            label: 'Quản lý người dùng',
            onClick: () => setType('users'),
        },
        {
            key: 'pending-posts',
            icon: <CheckSquareOutlined />,
            label: 'Bài viết chờ duyệt',
            onClick: () => setType('posts'),
        },
        {
            key: 'all-posts',
            icon:<ReadOutlined />,
            label: 'Tất cả bài viết',
            onClick: () => setType('all-posts'),
        },
        {
            key: 'transactions',
            icon: <DollarOutlined />,
            label: 'Quản lý giao dịch',
            onClick: () => setType('transactions'),
        },
    ];

    return (
        <Layout className={cx('admin-layout')}>
            <Sider trigger={null} collapsible collapsed={collapsed} className={cx('sider')} width={280}>
                <div className={cx('logo')}>
                    <div className={cx('logo-icon')}>
                        <GlobalOutlined />
                    </div>
                    {!collapsed && (
                        <div className={cx('logo-text')}>
                            <h1>PhongTro123</h1>
                            <span>Admin Portal</span>
                        </div>
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['dashboard']}
                    items={menuItems}
                    className={cx('menu')}
                />
            </Sider>
            <Layout>
                <Header className={cx('header')}>
                    <div className={cx('header-left')}>
                        {collapsed ? (
                            <MenuUnfoldOutlined className={cx('trigger')} onClick={() => setCollapsed(!collapsed)} />
                        ) : (
                            <MenuFoldOutlined className={cx('trigger')} onClick={() => setCollapsed(!collapsed)} />
                        )}
                    </div>
                    <div className={cx('header-right')}>
                        {user && (
                            <Dropdown
                                menu={{ items: userMenuItems }}
                                trigger={['click']}
                            >
                                <div className={cx('user-info')}>
                                    <Avatar
                                        size="small"
                                        src={user.avatar || "https://placekitten.com/32/32"}
                                        className={cx('avatar')}
                                    >
                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                                    </Avatar>
                                    <div className={cx('user-details')}>
                                        <span className={cx('username')}>
                                            {user.fullName || user.email}
                                        </span>
                                    </div>
                                    <DownOutlined style={{ fontSize: '10px', color: '#999' }} />
                                </div>
                            </Dropdown>
                        )}
                    </div>
                </Header>
                <Content className={cx('content')}>
                    {/* ✅ LOGIC RENDER CÓ ĐIỀU KIỆN */}
                    {isLoading ? (
                        <div style={{ padding: 50, textAlign: 'center' }}>
                            <Spin size="large" tip="Đang tải dữ liệu..." />
                        </div>
                    ) : (
                        <>
                            {type === 'dashboard' && <Dashboard />}
                            {type === 'users' && <ManagerUser />}
                            {type === 'posts' && <ManagerPost />}
                            {type === 'all-posts' && <ManagerAllPosts />}
                            {type === 'transactions' && <ManagerRechange />}
                        </>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
}

export default Admin;