import classNames from 'classnames/bind';
import styles from './HomePage.module.scss';

import CardBody from '../CardBody/CardBody';
import React, { useState, useEffect, useRef } from 'react';
import { requestGetPosts, requestPostSuggest, requestGetFilteredPosts } from '../../config/request'; // Import API phù hợp
import { useSearchParams, useNavigate } from 'react-router-dom';

import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

function HomePage() {
    const [dataPost, setDataPost] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0); // Tổng số bài đăng
    const [loading, setLoading] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const hasInitialized = useRef(false); // To prevent multiple fetches on initial load

    useEffect(() => {
        document.title = 'Trang chủ';
    }, []);

    // Initialize state from URL parameters on mount and when URL changes
    const [category, setCategory] = useState(() => searchParams.get('category') || '');
    const [priceRange, setPriceRange] = useState(() => searchParams.get('priceRange') || '');
    const [areaRange, setAreaRange] = useState(() => searchParams.get('areaRange') || '');
    const [typeNews, setTypeNews] = useState(() => searchParams.get('typeNews') || null);
    const [province, setProvince] = useState(() => searchParams.get('province') || '');
    const [district, setDistrict] = useState(() => searchParams.get('district') || '');
    const [ward, setWard] = useState(() => searchParams.get('ward') || '');
    const [options, setOptions] = useState(() => {
        const optionsParam = searchParams.get('options');
        return optionsParam ? JSON.parse(decodeURIComponent(optionsParam)) : [];
    });

    const [gia_tu, setGiaTu] = useState(() => searchParams.get('gia_tu') || '');
    const [gia_den, setGiaDen] = useState(() => searchParams.get('gia_den') || '');
    const [dien_tich_tu, setDienTichTu] = useState(() => searchParams.get('dien_tich_tu') || '');
    const [dien_tich_den, setDienTichDen] = useState(() => searchParams.get('dien_tich_den') || '');

    // Ref to track last request time for throttling API calls
    const lastRequestTime = useRef(0);

    useEffect(() => {
        const newCategory = searchParams.get('category') || '';
        const newPriceRange = searchParams.get('priceRange') || '';
        const newAreaRange = searchParams.get('areaRange') || '';
        const newTypeNews = searchParams.get('typeNews') || null;
        const newProvince = searchParams.get('province') || '';
        const newDistrict = searchParams.get('district') || '';
        const newWard = searchParams.get('ward') || '';
        const newOptionsParam = searchParams.get('options');
        const newOptions = newOptionsParam ? JSON.parse(decodeURIComponent(newOptionsParam)) : [];
        const newGiaTu = searchParams.get('gia_tu') || '';
        const newGiaDen = searchParams.get('gia_den') || '';
        const newDienTichTu = searchParams.get('dien_tich_tu') || '';
        const newDienTichDen = searchParams.get('dien_tich_den') || '';

        if (newCategory !== category) setCategory(newCategory);
        if (newPriceRange !== priceRange) setPriceRange(newPriceRange);
        if (newAreaRange !== areaRange) setAreaRange(newAreaRange);
        if (newTypeNews !== typeNews) setTypeNews(newTypeNews);
        if (newProvince !== province) setProvince(newProvince);
        if (newDistrict !== district) setDistrict(newDistrict);
        if (newWard !== ward) setWard(newWard);
        if (JSON.stringify(newOptions) !== JSON.stringify(options)) setOptions(newOptions);
        if (newGiaTu !== gia_tu) setGiaTu(newGiaTu);
        if (newGiaDen !== gia_den) setGiaDen(newGiaDen);
        if (newDienTichTu !== dien_tich_tu) setDienTichTu(newDienTichTu);
        if (newDienTichDen !== dien_tich_den) setDienTichDen(newDienTichDen);

        // Mark that we've processed URL parameters (helps prevent multiple rapid fetches)
        hasInitialized.current = true;
    }, [searchParams, category, priceRange, areaRange, typeNews, province, district, ward, options, gia_tu, gia_den, dien_tich_tu, dien_tich_den]);

    useEffect(() => {
        const fetchData = async () => {
            // Only proceed if we have initialized (to avoid initial rapid calls)
            if (!hasInitialized.current && category === '' && priceRange === '' && areaRange === '' &&
                typeNews === null && province === '' && district === '' && ward === '' &&
                options.length === 0 && gia_tu === '' && gia_den === '' &&
                dien_tich_tu === '' && dien_tich_den === '') {
                // Skip the first run if all values are default to prevent double fetch on initial load
                hasInitialized.current = true;
                return;
            }

            const now = Date.now();
            // Prevent requests that are too close together (less than 300ms)
            if (now - lastRequestTime.current < 300) {
                console.log('Request throttled due to rapid succession');
                return;
            }
            lastRequestTime.current = now;

            setLoading(true);
            try {
                // Build parameters for the advanced search endpoint
                const requestParams = {
                    page: currentPage, // Thêm tham số trang
                    limit: 12, // Giới hạn số lượng bài đăng mỗi trang
                };

                // Category filter
                if (category) {
                    requestParams.category = category;
                }

                // Geographic filters - use cityCode and wardCode for the new advanced search
                if (province) {
                    requestParams.cityCode = province; // Using province code as cityCode for new search
                }

                if (ward) {
                    requestParams.wardCode = ward; // Using ward code as wardCode for new search
                }

                // Price filters - use minPrice and maxPrice for the new advanced search
                if (priceRange) {
                    // Convert price range to minPrice/maxPrice based on the priceRange value
                    const priceRanges = {
                        'duoi-1-trieu': { minPrice: 0, maxPrice: 1000000 },
                        'tu-1-2-trieu': { minPrice: 1000000, maxPrice: 2000000 },
                        'tu-2-3-trieu': { minPrice: 2000000, maxPrice: 3000000 },
                        'tu-3-5-trieu': { minPrice: 3000000, maxPrice: 5000000 },
                        'tu-5-7-trieu': { minPrice: 5000000, maxPrice: 7000000 },
                        'tu-7-10-trieu': { minPrice: 7000000, maxPrice: 10000000 },
                        'tu-10-15-trieu': { minPrice: 10000000, maxPrice: 15000000 },
                        'tren-15-trieu': { minPrice: 15000000, maxPrice: undefined },
                    };

                    if (priceRanges[priceRange]) {
                        const range = priceRanges[priceRange];
                        if (range.minPrice > 0) {
                            requestParams.minPrice = range.minPrice;
                        }
                        if (range.maxPrice) {
                            requestParams.maxPrice = range.maxPrice;
                        }
                    }
                }

                // Area filters - use minArea and maxArea for the new advanced search
                if (areaRange) {
                    // Convert area range to minArea/maxArea based on the areaRange value
                    const areaRanges = {
                        'duoi-20': { minArea: 0, maxArea: 20 },
                        'tu-20-30': { minArea: 20, maxArea: 30 },
                        'tu-30-50': { minArea: 30, maxArea: 50 },
                        'tu-50-70': { minArea: 50, maxArea: 70 },
                        'tu-70-90': { minArea: 70, maxArea: 90 },
                        'tren-90': { minArea: 90, maxArea: undefined },
                    };

                    if (areaRanges[areaRange]) {
                        const range = areaRanges[areaRange];
                        if (range.minArea >= 0) {
                            requestParams.minArea = range.minArea;
                        }
                        if (range.maxArea) {
                            requestParams.maxArea = range.maxArea;
                        }
                    }
                }

                // Amenities filter - convert options to selectedAmenities for the new advanced search
                if (options && options.length > 0) {
                    requestParams.selectedAmenities = options.join(','); // Convert array to comma-separated string
                }

                // Range filter parameters
                if (gia_tu) {
                    requestParams.gia_tu = Number(gia_tu);
                }

                if (gia_den) {
                    requestParams.gia_den = Number(gia_den);
                }

                if (dien_tich_tu) {
                    requestParams.dien_tich_tu = Number(dien_tich_tu);
                }

                if (dien_tich_den) {
                    requestParams.dien_tich_den = Number(dien_tich_den);
                }

                // Type news filter
                if (typeNews) {
                    requestParams.typeNews = typeNews;
                }

                console.log('>>> Sending params to advanced search API:', requestParams);

                // Use the new advanced search API
                const res = await requestGetFilteredPosts(requestParams);

                // Cập nhật dữ liệu và thông tin phân trang
                setDataPost(res.metadata || []);

                // For compatibility, we'll need to handle the response format
                // Since the advanced search doesn't return pagination metadata, we'll set defaults
                setTotalPages(1);
                setTotalPosts(res.metadata?.length || res.metadata?.posts?.length || 0);
            } catch (error) {
                console.error('Error fetching posts with advanced search:', error);

                // Fallback to regular search if advanced search fails
                try {
                    const params = {
                        category,
                        priceRange,
                        areaRange,
                        typeNews,
                        province,
                        district,
                        ward,
                        options: options.length > 0 ? JSON.stringify(options) : undefined,
                        page: currentPage,
                        limit: 12,
                    };
                    console.log('>>> Falling back to regular API:', params);
                    const res = await requestGetPosts(params);

                    // Cập nhật dữ liệu và thông tin phân trang
                    setDataPost(res.metadata.posts || res.metadata);

                    // Cập nhật tổng số trang và tổng số bài đăng
                    if (res.metadata?.totalPages) {
                        setTotalPages(res.metadata.totalPages);
                    }

                    // Cập nhật tổng số bài đăng
                    const totalPostsCount = res.metadata?.totalPosts || 0;

                    // Cập nhật state để sử dụng trong UI
                    setTotalPosts(totalPostsCount);
                } catch (fallbackError) {
                    console.error('Error with fallback API:', fallbackError);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [category, priceRange, areaRange, typeNews, province, district, ward, options, currentPage, hasInitialized]);

    // Separate effect to update URL without triggering data fetch
    useEffect(() => {
        // Update URL
        const newSearchParams = new URLSearchParams();
        if (category) newSearchParams.set('category', category);
        if (priceRange) newSearchParams.set('priceRange', priceRange);
        if (areaRange) newSearchParams.set('areaRange', areaRange);
        if (typeNews) newSearchParams.set('typeNews', typeNews);
        if (province) newSearchParams.set('province', province);
        if (district) newSearchParams.set('district', district);
        if (ward) newSearchParams.set('ward', ward);
        if (options.length > 0) newSearchParams.set('options', encodeURIComponent(JSON.stringify(options)));
        if (currentPage > 1) newSearchParams.set('page', currentPage.toString()); // Chỉ hiển thị page nếu không phải trang đầu

        // Add range parameters to URL
        if (gia_tu) newSearchParams.set('gia_tu', gia_tu);
        if (gia_den) newSearchParams.set('gia_den', gia_den);
        if (dien_tich_tu) newSearchParams.set('dien_tich_tu', dien_tich_tu);
        if (dien_tich_den) newSearchParams.set('dien_tich_den', dien_tich_den);

        // So sánh với URL hiện tại để tránh cập nhật không cần thiết
        const currentUrlParams = new URLSearchParams(window.location.search);
        const currentParamsString = currentUrlParams.toString();
        const newParamsString = newSearchParams.toString();

        // Only update if parameters have actually changed
        if (currentParamsString !== newParamsString) {
            setSearchParams(newSearchParams);
        }
    }, [category, priceRange, areaRange, typeNews, province, district, ward, options, currentPage, setSearchParams, gia_tu, gia_den, dien_tich_tu, dien_tich_den]);

    const [dataNewPost, setDataNewPost] = useState([]);
    const [dataPostSuggest, setDataPostSuggest] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Thay vì requestGetNewPost, có thể sử dụng requestPostSuggest hoặc requestGetPosts với tham số đặc biệt
                // Hoặc có thể không có API riêng cho "bài đăng mới", nên dùng API có sẵn
                // Trong trường hợp này, sử dụng requestPostSuggest cho phần "Tin mới đăng"
                const res = await requestPostSuggest();
                console.log('>>> New posts response (using suggest API):', res);
                console.log('>>> New posts metadata (using suggest API):', res?.metadata);
                setDataNewPost(res?.metadata || []);

                const resSuggest = await requestPostSuggest();
                console.log('>>> Suggested posts response:', resSuggest);
                console.log('>>> Suggested posts metadata:', resSuggest?.metadata);
                setDataPostSuggest(resSuggest?.metadata || []);
            } catch (error) {
                console.error('Error fetching new/suggested posts:', error);
            }
        };
        fetchData();
    }, [hasInitialized]); // Add hasInitialized to prevent multiple calls during initialization

    // Hàm xử lý chuyển trang
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu trang khi chuyển trang
        }
    };

    // Tạo danh sách số trang để hiển thị
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5; // Số trang hiển thị tối đa
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('inner')}>
                <div className={cx('header')}>
                    <h1 className={cx('title')}>Kênh thông tin Phòng trọ số 1 Việt Nam</h1>
                    <p className={cx('description')}>Đây là nơi bạn có thể tìm thấy thông tin và dịch vụ tốt nhất.</p>
                    <p className={cx('description-1')}>có {totalPosts} tin đang cho thuê</p>

                    <div className={cx('actions')}>
                        <button onClick={() => setTypeNews('vip')} id={cx(typeNews === 'vip' && 'active')}>
                            Đề xuất
                        </button>
                        <button onClick={() => setTypeNews('normal')} id={cx(typeNews === 'normal' && 'active')}>
                            Mới đăng
                        </button>
                    </div>
                </div>

                <div className={cx('list-content')}>
                    {loading ? (
                        <div className={cx('loading')}>
                            <p>Đang tải...</p>
                        </div>
                    ) : (
                        <>
                            {dataPost.map((post) => (
                                <CardBody key={post._id} post={post} />
                            ))}

                            {/* Phân trang */}
                            {totalPages > 1 && (
                                <div className={cx('pagination-wrapper')}>
                                    <div className={cx('pagination-info')}>
                                        Hiển thị {Math.min((currentPage * 12), totalPosts)} / {totalPosts} tin đăng
                                    </div>
                                    <div className={cx('pagination')}>
                                        <button
                                            className={cx('page-btn', { disabled: currentPage === 1 })}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            &laquo; Trước
                                        </button>

                                        {currentPage > 3 && (
                                            <>
                                                <button
                                                    className={cx('page-btn', { active: 1 === currentPage })}
                                                    onClick={() => handlePageChange(1)}
                                                >
                                                    1
                                                </button>
                                                {currentPage > 4 && <span className={cx('page-ellipsis')}>...</span>}
                                            </>
                                        )}

                                        {getPageNumbers().map(page => (
                                            <button
                                                key={page}
                                                className={cx('page-btn', { active: page === currentPage })}
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        {currentPage < totalPages - 2 && (
                                            <>
                                                {currentPage < totalPages - 3 && <span className={cx('page-ellipsis')}>...</span>}
                                                <button
                                                    className={cx('page-btn', { active: totalPages === currentPage })}
                                                    onClick={() => handlePageChange(totalPages)}
                                                >
                                                    {totalPages}
                                                </button>
                                            </>
                                        )}

                                        <button
                                            className={cx('page-btn', { disabled: currentPage === totalPages })}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Sau &raquo;
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <div className={cx('filter')}>
                {/* <div className={cx('filter-section')}>
                    <div className={cx('filter-list')}>
                        <div className={cx('filter-column')}>
                            <a onClick={() => {
                                setCategory('phong-tro');
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn danh mục mới
                            }}>
                                <span>Phòng trọ</span>
                            </a>
                            <a onClick={() => {
                                setCategory('nha-nguyen-can');
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn danh mục mới
                            }}>
                                <span>Nhà nguyên căn</span>
                            </a>
                            <a onClick={() => {
                                setCategory('can-ho-chung-cu');
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn danh mục mới
                            }}>
                                <span>Căn hộ chung cư</span>
                            </a>

                            <a onClick={() => {
                                setCategory('can-ho-mini');
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn danh mục mới
                            }}>
                                <span>Căn hộ mini</span>
                            </a>
                            <a onClick={() => {
                                setCategory('o-ghep');
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn danh mục mới
                            }}>
                                <span>Ở ghép</span>
                            </a>
                        </div>
                    </div>
                </div> */}
                <div className={cx('filter-section')}>
                    <h3>Xem theo khoảng giá</h3>
                    <div className={cx('filter-list')}>
                        <div className={cx('filter-column')}>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('priceRange', 'duoi-1-trieu');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Dưới 1 triệu</span>
                            </a>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('priceRange', 'tu-1-2-trieu');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Từ 1 - 2 triệu</span>
                            </a>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('priceRange', 'tu-2-3-trieu');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Từ 2 - 3 triệu</span>
                            </a>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('priceRange', 'tu-3-5-trieu');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Từ 3 - 5 triệu</span>
                            </a>
                        </div>
                        <div className={cx('filter-column')}>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('priceRange', 'tu-5-7-trieu');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Từ 5 - 7 triệu</span>
                            </a>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('priceRange', 'tu-7-10-trieu');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Từ 7 - 10 triệu</span>
                            </a>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('priceRange', 'tu-10-15-trieu');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Từ 10 - 15 triệu</span>
                            </a>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('priceRange', 'tren-15-trieu');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Trên 15 triệu</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className={cx('filter-section')}>
                    <h3>Xem theo diện tích</h3>
                    <div className={cx('filter-list')}>
                        <div className={cx('filter-column')}>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('areaRange', 'duoi-20');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Dưới 20 m²</span>
                            </a>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('areaRange', 'tu-20-30');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Từ 20 - 30m²</span>
                            </a>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('areaRange', 'tu-30-50');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Từ 30 - 50m²</span>
                            </a>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('areaRange', 'tu-50-70');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Từ 50 - 70m²</span>
                            </a>
                        </div>
                        <div className={cx('filter-column')}>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('areaRange', 'tu-70-90');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Từ 70 - 90m²</span>
                            </a>
                            <a onClick={() => {
                                // Update URL parameters to properly trigger data fetching
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.set('areaRange', 'tren-90');
                                navigate(`/?${newSearchParams.toString()}`);
                                setCurrentPage(1); // Trở về trang đầu tiên khi chọn bộ lọc mới
                            }}>
                                <span>Trên 90m²</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className={cx('filter-section')}>
                    <h3>Tin mới đăng</h3>
                    <div className={cx('new-posts')}>
                        {dataNewPost.map((item) => (
                            <Link to={`/chi-tiet-tin-dang/${item._id}`} key={item._id}>
                                <div className={cx('post-item')}>
                                    <div className={cx('post-image')}>
                                        <img src={item.images[0]} alt="Studio apartment" />
                                    </div>
                                    <div className={cx('post-info')}>
                                        <h4 className={cx('post-title')}>{item.title}</h4>
                                        <div className={cx('post-meta')}>
                                            <span className={cx('post-price')}>
                                                {item.price.toLocaleString('vi-VN')} VNĐ
                                            </span>
                                            <span className={cx('post-time')}>
                                                {dayjs(item.createdAt).format('DD/MM/YYYY')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className={cx('filter-section')}>
                    <h3>Gần bạn</h3>
                    <div className={cx('new-posts')}>
                        {dataPostSuggest.map((item) => (
                            <Link to={`/chi-tiet-tin-dang/${item._id}`} key={item._id}>
                                <div className={cx('post-item')}>
                                    <div className={cx('post-image')}>
                                        <img src={item.images[0]} alt="Studio apartment" />
                                    </div>
                                    <div className={cx('post-info')}>
                                        <h4 className={cx('post-title')}>{item.title}</h4>
                                        <div className={cx('post-meta')}>
                                            <span className={cx('post-price')}>
                                                {item.price.toLocaleString('vi-VN')} VNĐ
                                            </span>
                                            <span className={cx('post-time')}>
                                                {dayjs(item.createdAt).format('DD/MM/YYYY')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;