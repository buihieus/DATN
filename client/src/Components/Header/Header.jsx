import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import logo from '../../assets/images/logo.svg';
import { Dropdown, Avatar, Space, Button, Popover, Input, Modal, Table } from 'antd';
import {
  UserOutlined,
  HeartOutlined,
  LoginOutlined,
  SearchOutlined,
  FilterOutlined,
  FormOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  DownOutlined
} from '@ant-design/icons';

import { useStore } from '../../hooks/useStore';
import { requestLogout } from '../../config/request';
import cookies from "js-cookie";

import FilterPanel from '../filter/FilterPanel';
import PostModal from '../PostModal/PostModal';

const cx = classNames.bind(styles);

function Header() {
    const { dataUser, setDataUser, dataSearch, setValueSearch } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [currentFilters, setCurrentFilters] = useState({});
    const [appliedFilters, setAppliedFilters] = useState({}); // Store the filters that were applied
    const [activeCategory, setActiveCategory] = useState('');
    const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
    const [isPostModalVisible, setIsPostModalVisible] = useState(false);

    // Initialize state from URL parameters on mount and when location changes
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const categoryParam = searchParams.get('category') || '';
        setActiveCategory(categoryParam);

        // Update currentFilters to include URL parameters as initial values
        setCurrentFilters(prev => ({
            ...prev,
            category: categoryParam
        }));
    }, [location.search]);

    // ✅ LOGOUT KHÔNG RELOAD
    const handleLogout = async () => {
        try {
            await requestLogout();

            cookies.remove("token");
            cookies.remove("logged");

            setDataUser({}); // ✅ UI cập nhật ngay

            navigate('/');
        } catch (error) {
            console.log(error);
        }
    };

    // ✅ MENU CHUẨN ANT DESIGN V5
    const menu = {
        items: [
            {
                key: 'profile',
                icon: <FormOutlined />,
                label: <Link to="/trang-ca-nhan">Trang cá nhân</Link>,
            },
            ...(dataUser.isAdmin
                ? [{
                    key: 'admin',
                    icon: <FormOutlined />,
                    label: <Link to="/admin">Trang quản trị</Link>,
                }]
                : []
            ),
            {
                key: 'logout',
                icon: <LoginOutlined />,
                label: 'Đăng xuất',
                onClick: handleLogout,
            },
        ]
    };

    // Use useCallback to make sure the reference stays stable
    const handleFilterChange = useCallback((filters) => {
        // Check if the filters are the same as the current URL to prevent loops
        const currentParams = new URLSearchParams(location.search);
        let hasChanges = false;

        // Compare each filter parameter with current URL parameters
        const checkParam = (filterValue, paramName) => {
            const currentParam = currentParams.get(paramName);
            const filterStr = filterValue ? String(filterValue) : '';
            return filterStr !== currentParam;
        };

        if (checkParam(filters.category, 'category') ||
            checkParam(filters.price, 'priceRange') ||  // Note: FilterPanel uses 'price', URL uses 'priceRange'
            checkParam(filters.area, 'areaRange') ||    // Note: FilterPanel uses 'area', URL uses 'areaRange'
            checkParam(filters.province, 'province') ||
            checkParam(filters.district, 'district') ||
            checkParam(filters.ward, 'ward') ||
            checkParam(filters.gia_tu, 'gia_tu') ||
            checkParam(filters.gia_den, 'gia_den') ||
            checkParam(filters.dien_tich_tu, 'dien_tich_tu') ||
            checkParam(filters.dien_tich_den, 'dien_tich_den')) {
            hasChanges = true;
        }

        // Also check options array
        if (filters.options && filters.options.length > 0) {
            const currentOptions = currentParams.get('options');
            const optionsStr = JSON.stringify(filters.options);
            if (currentOptions !== encodeURIComponent(optionsStr)) {
                hasChanges = true;
            }
        } else if (currentParams.get('options')) {
            hasChanges = true;
        }

        // Only update if there are actual changes to prevent loops
        if (hasChanges) {
            setCurrentFilters(filters);
            console.log('Header - Received filters from FilterPanel (with changes):', filters); // Debug log

            // Apply filters immediately by updating the URL, similar to homepage filters
            const queryString = new URLSearchParams();

            if (filters.category) {
                queryString.set('category', filters.category);
                setActiveCategory(filters.category);
            } else {
                setActiveCategory('');
            }

            // Map 'price' from FilterPanel to 'priceRange' for consistency with homepage
            if (filters.price) {
                queryString.set('priceRange', filters.price);
            }

            // Map 'area' from FilterPanel to 'areaRange' for consistency with homepage
            if (filters.area) {
                queryString.set('areaRange', filters.area);
            }

            if (filters.options && filters.options.length > 0) {
                queryString.set('options', encodeURIComponent(JSON.stringify(filters.options)));
            }

            // Add range filter parameters
            if (filters.gia_tu !== undefined && filters.gia_tu !== '') {
                queryString.set('gia_tu', filters.gia_tu);
            }

            if (filters.gia_den !== undefined && filters.gia_den !== '') {
                queryString.set('gia_den', filters.gia_den);
            }

            if (filters.dien_tich_tu !== undefined && filters.dien_tich_tu !== '') {
                queryString.set('dien_tich_tu', filters.dien_tich_tu);
            }

            if (filters.dien_tich_den !== undefined && filters.dien_tich_den !== '') {
                queryString.set('dien_tich_den', filters.dien_tich_den);
            }

            // Add location parameters
            if (filters.province) {
                queryString.set('province', filters.province);
            }

            if (filters.district) {
                queryString.set('district', filters.district);
            }

            if (filters.ward) {
                queryString.set('ward', filters.ward);
            }

            // Navigate to homepage with all filter parameters
            const fullUrl = `/?${queryString.toString()}`;
            console.log('Navigating to URL with all filters (immediate):', fullUrl);

            // Only navigate if there are actually filters to apply
            if (queryString.toString()) {
                navigate(fullUrl);
            } else {
                // If no filters, navigate to base homepage
                navigate('/');
            }
        } else {
            console.log('Header - Filter change skipped (no actual changes):', filters);
            setCurrentFilters(filters); // Still update internal state but don't trigger navigation
        }
    }, [navigate, setActiveCategory, location.search]);

    const handleApplyFilters = async (appliedFilters) => {
        try {
            console.log('Applying filters from FilterPanel:', appliedFilters); // Debug log

            // Remove empty values to clean up the request
            const cleanedFilters = { ...appliedFilters };
            Object.keys(cleanedFilters).forEach(key => {
                if (cleanedFilters[key] === '' || cleanedFilters[key] === null || cleanedFilters[key] === undefined ||
                    (Array.isArray(cleanedFilters[key]) && cleanedFilters[key].length === 0)) {
                    delete cleanedFilters[key];
                }
            });

            console.log('Cleaned filters:', cleanedFilters); // Debug log

            // Build query parameters for all filters and navigate to homepage
            const queryString = new URLSearchParams();

            if (cleanedFilters.category) {
                queryString.set('category', cleanedFilters.category);
                setActiveCategory(cleanedFilters.category);
            } else {
                setActiveCategory('');
            }

            if (cleanedFilters.price) {
                queryString.set('priceRange', cleanedFilters.price);
            }

            if (cleanedFilters.area) {
                queryString.set('areaRange', cleanedFilters.area);
            }

            if (cleanedFilters.options && cleanedFilters.options.length > 0) {
                queryString.set('options', encodeURIComponent(JSON.stringify(cleanedFilters.options)));
            }

            // Add range filter parameters
            if (cleanedFilters.gia_tu !== undefined && cleanedFilters.gia_tu !== '') {
                queryString.set('gia_tu', cleanedFilters.gia_tu);
            }

            if (cleanedFilters.gia_den !== undefined && cleanedFilters.gia_den !== '') {
                queryString.set('gia_den', cleanedFilters.gia_den);
            }

            if (cleanedFilters.dien_tich_tu !== undefined && cleanedFilters.dien_tich_tu !== '') {
                queryString.set('dien_tich_tu', cleanedFilters.dien_tich_tu);
            }

            if (cleanedFilters.dien_tich_den !== undefined && cleanedFilters.dien_tich_den !== '') {
                queryString.set('dien_tich_den', cleanedFilters.dien_tich_den);
            }

            if (cleanedFilters.typeNews) {
                queryString.set('typeNews', cleanedFilters.typeNews);
            }

            // Add location filters
            if (cleanedFilters.province) {
                queryString.set('province', cleanedFilters.province);
            }

            if (cleanedFilters.district) {
                queryString.set('district', cleanedFilters.district);
            }

            if (cleanedFilters.ward) {
                queryString.set('ward', cleanedFilters.ward);
            }

            // Navigate to homepage with all filters
            const fullUrl = `/?${queryString.toString()}`;
            console.log('Navigating to homepage with filters:', fullUrl);

            // Navigate to the homepage with all filters applied
            navigate(fullUrl);

            // Close the filter panel after navigation
            setTimeout(() => {
                setIsFilterVisible(false);
            }, 100);

        } catch (error) {
            console.error('Error applying filters:', error);
            alert('Lỗi khi áp dụng bộ lọc: ' + error.message);
        }
    };

    // Function to handle category click and filter posts by category
    const handleCategoryClick = (categoryKey) => {
        if (categoryKey === 'bang-gia-dich-vu') {
            // Open service pricing modal instead of navigating
            setIsServiceModalVisible(true);
            setActiveCategory(categoryKey);
        } else {
            // Apply category filter and navigate to homepage with the selected category
            setActiveCategory(categoryKey);

            // Navigate to homepage with category filter - same as homepage filter logic
            // Only navigate if we're not already on the homepage
            if (location.pathname !== '/') {
                navigate(`/?category=${categoryKey}`);
            } else {
                // If already on homepage, just update the URL parameter
                const searchParams = new URLSearchParams(location.search);
                searchParams.set('category', categoryKey);
                navigate(`/?${searchParams.toString()}`);
            }
        }
    };

    // Categories for the second row (removed mat-bang, blog, can-ho-dich-vu)
    const categories = [
        { key: 'phong-tro', label: 'Phòng trọ' },
        { key: 'nha-nguyen-can', label: 'Nhà nguyên căn' },
        { key: 'can-ho-chung-cu', label: 'Căn hộ chung cư' },
        { key: 'can-ho-mini', label: 'Căn hộ mini' },
        { key: 'o-ghep', label: 'Ở ghép' },
        { key: 'bang-gia-dich-vu', label: 'Bảng giá dịch vụ' },
    ];

    // Price ranges for direct filtering - same as homepage
    const priceRanges = [
        { key: 'duoi-1-trieu', label: 'Dưới 1 triệu' },
        { key: 'tu-1-2-trieu', label: '1 - 2 triệu' },
        { key: 'tu-2-3-trieu', label: '2 - 3 triệu' },
        { key: 'tu-3-5-trieu', label: '3 - 5 triệu' },
        { key: 'tu-5-7-trieu', label: '5 - 7 triệu' },
        { key: 'tu-7-10-trieu', label: '7 - 10 triệu' },
        { key: 'tu-10-15-trieu', label: '10 - 15 triệu' },
        { key: 'tren-15-trieu', label: 'Trên 15 triệu' },
    ];

    // Area ranges for direct filtering - same as homepage
    const areaRanges = [
        { key: 'duoi-20', label: 'Dưới 20m²' },
        { key: 'tu-20-30', label: '20 - 30m²' },
        { key: 'tu-30-50', label: '30 - 50m²' },
        { key: 'tu-50-70', label: '50 - 70m²' },
        { key: 'tu-70-90', label: '70 - 90m²' },
        { key: 'tren-90', label: 'Trên 90m²' },
    ];

    // Function to handle price filter click
    const handlePriceFilterClick = (priceKey) => {
        // Update URL parameters to properly trigger data fetching like homepage
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.set('priceRange', priceKey);
        navigate(`/?${newSearchParams.toString()}`);
    };

    // Function to handle area filter click
    const handleAreaFilterClick = (areaKey) => {
        // Update URL parameters to properly trigger data fetching like homepage
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.set('areaRange', areaKey);
        navigate(`/?${newSearchParams.toString()}`);
    };

    // Service pricing data
    const servicePricingData = [
        {
            key: '1',
            loaiTin: 'Tin VIP',
            threeDays: '50.000 VNĐ',
            sevenDays: '315.000 VNĐ',
            thirtyDays: '1.200.000 VNĐ',
        },
        {
            key: '2',
            loaiTin: 'Tin thường',
            threeDays: '10.000 VNĐ',
            sevenDays: '50.000 VNĐ',
            thirtyDays: '1.000.000 VNĐ',
        },
    ];

    const servicePricingColumns = [
        {
            title: 'Loại Tin',
            dataIndex: 'loaiTin',
            key: 'loaiTin',
        },
        {
            title: '3 ngày',
            dataIndex: 'threeDays',
            key: 'threeDays',
        },
        {
            title: '7 ngày',
            dataIndex: 'sevenDays',
            key: 'sevenDays',
        },
        {
            title: '30 ngày',
            dataIndex: 'thirtyDays',
            key: 'thirtyDays',
        },
    ];

    const handlePostButtonClick = () => {
        if (!dataUser._id) {
            // If user is not logged in, redirect to login
            navigate('/login');
            return;
        }

        // If user is logged in, show the post modal
        setIsPostModalVisible(true);
    };

    // Filter content for the popover
    const filterContent = (
        <div style={{ width: '600px', padding: '16px' }}>
            <FilterPanel
                onFilterChange={handleFilterChange}
                initialFilters={currentFilters}
                applyImmediately={true}
            />
        </div>
    );

    return (
        <div className={cx('wrapper')}>
            {/* TOP PART */}
            <div className={cx('top-part')}>
                {/* LEFT: LOGO */}
                <div className={cx('logo-section')}>
                    <Link to="/">
                        <img src={logo} alt="Logo" />
                    </Link>
                </div>

                {/* CENTER: SEARCH & FILTER */}
                <div className={cx('search-section')}>
                    <div className={cx('search-input')}>
                        <Input
                            prefix={<EnvironmentOutlined />}
                            placeholder="Tìm theo khu vực"
                            onChange={(e) => setValueSearch(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            onPressEnter={(e) => {
                                if (e.target.value.trim()) {
                                    navigate(`/search/${e.target.value.trim()}`);
                                }
                            }}
                            style={{
                                borderRadius: '20px 0 0 20px',
                                borderRight: 'none',
                                height: '42px',
                                paddingLeft: '40px'
                            }}
                        />
                    </div>

                    {/* FILTER BUTTON */}
                    <Button
                        icon={<FilterOutlined />}
                        className={cx('filter-btn')}
                        style={{
                            borderRadius: '0 20px 20px 0',
                            borderLeft: 'none',
                            height: '42px',
                            backgroundColor: '#f5f5f5',
                            borderColor: '#d9d9d9'
                        }}
                        onClick={() => setIsFilterVisible(!isFilterVisible)}
                    >
                        Bộ lọc
                    </Button>
                </div>

                {/* RIGHT: USER ACTIONS */}
                <div className={cx('user-actions')}>
                    {/* Saved Posts */}
                    {/* <Link to="/saved-posts" className={cx('action-item')}>
                        <HeartOutlined className={cx('action-icon')} style={{ fontSize: '16px' }} />
                        <span className={cx('action-text')}>Tin đã lưu</span>
                    </Link> */}

                    {/* User Info or Login/Register */}
                    {dataUser._id ? (
                        <div className={cx('user-info')}>
                            <Dropdown menu={menu} placement="bottomRight" overlayStyle={{ zIndex: 9999 }}>
                                <a onClick={(e) => e.preventDefault()} className={cx("user-menu-link")}>
                                    <Space size="middle">
                                        <Avatar
                                            size="large"  // Larger avatar as requested
                                            src={dataUser.avatar || null}
                                            icon={!dataUser.avatar ? <UserOutlined /> : null}
                                        />
                                        <span className={cx("user-name")}>
                                            {dataUser.fullName || 'Tài khoản'}
                                        </span>
                                    </Space>
                                </a>
                            </Dropdown>
                        </div>
                    ) : (
                        <div className={cx('auth-buttons')}>
                            <Link to="/login">
                                <Button icon={<UserOutlined />}>Đăng nhập</Button>
                            </Link>
                            <Link to="/register">
                                <Button icon={<PlusOutlined />} type="primary" style={{marginLeft: '8px'}}>Đăng ký</Button>
                            </Link>
                        </div>
                    )}

                    {/* Post button - always visible */}
                    <Button
                        type="primary"
                        icon={<FormOutlined />}
                        className={cx('post-btn')}
                        style={{
                            backgroundColor: '#FF7500',
                            borderColor: '#FF7500',
                            marginLeft: '12px'
                        }}
                        onClick={handlePostButtonClick}
                    >
                        Đăng tin
                    </Button>
                </div>
            </div>

            {/* DIVIDER LINE */}
            <div className={cx('divider-line')}></div>

            {/* MENU PART */}
            <div className={cx('menu-part')}>
                <div className={cx('categories-container')}>
                    {categories.map(category => (
                        <button
                            key={category.key}
                            className={`${cx('category-item')} ${activeCategory === category.key ? cx('active') : ''}`}
                            onClick={() => handleCategoryClick(category.key)}
                        >
                            {category.label}
                        </button>
                    ))}
                    {/* Price range dropdown */}
                    {/* <Dropdown
                        menu={{
                            items: priceRanges.map(range => ({
                                key: range.key,
                                label: range.label,
                                onClick: () => handlePriceFilterClick(range.key)
                            }))
                        }}
                        trigger={['click']}
                    >
                        <button className={cx('category-item')} style={{ fontWeight: 'normal' }}>
                            Khoảng giá <DownOutlined style={{ fontSize: '10px', marginLeft: '4px' }} />
                        </button>
                    </Dropdown> */}

                    {/* Area range dropdown */}
                    {/* <Dropdown
                        menu={{
                            items: areaRanges.map(range => ({
                                key: range.key,
                                label: range.label,
                                onClick: () => handleAreaFilterClick(range.key)
                            }))
                        }}
                        trigger={['click']}
                    >
                        <button className={cx('category-item')} style={{ fontWeight: 'normal' }}>
                            Diện tích <DownOutlined style={{ fontSize: '10px', marginLeft: '4px' }} />
                        </button>
                    </Dropdown> */}
                </div>
            </div>

            {/* FILTER MODAL */}
            <Modal
                title="Bộ lọc tìm kiếm nâng cao"
                open={isFilterVisible}
                onCancel={() => setIsFilterVisible(false)}
                footer={null}
                width={650}
            >
                <FilterPanel
                    onFilterChange={handleApplyFilters}
                    initialFilters={currentFilters}
                    applyImmediately={false}
                />
            </Modal>

            {/* SERVICE PRICING MODAL */}
            <Modal
                title="Bảng giá dịch vụ"
                open={isServiceModalVisible}
                onCancel={() => setIsServiceModalVisible(false)}
                footer={null}
                width={800}
            >
                <Table
                    columns={servicePricingColumns}
                    dataSource={servicePricingData}
                    pagination={false}
                    bordered
                />
            </Modal>

            {/* POST MODAL */}
            <PostModal
                visible={isPostModalVisible}
                onClose={() => setIsPostModalVisible(false)}
            />
        </div>
    );
}

export default Header;