import classNames from 'classnames/bind';
import styles from './DetailPost.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneAlt, faShareAlt, faFlag, faMapMarkerAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import userDefault from '../../assets/images/user-default.svg';

import dayjs from 'dayjs';

import {
    requestCreateFavourite,
    requestDeleteFavourite,
    requestGetPostById,
    requestGetPostVip,
} from '../../config/request';
import { useStore } from '../../hooks/useStore';
import { useSocket } from '../../hooks/useSocket';
import ChatButton from '../../utils/ChatButton/ChatButton';
import { message } from 'antd';

const cx = classNames.bind(styles);

function DetailPost() {
    const [selectedImg, setSelectedImg] = useState('');

    const [user, setUser] = useState({});
    const [loadingUser, setLoadingUser] = useState(true);

    const [post, setPost] = useState({});
    const [loadingPost, setLoadingPost] = useState(true);

    const { id } = useParams();

    const [userHeart, setUserHeart] = useState([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);

    const [postVip, setPostVip] = useState([]);
    const [loadingVipPosts, setLoadingVipPosts] = useState(true);

    // Optimized fetch function for post details
    const fetchPost = useCallback(async () => {
        try {
            setLoadingPost(true);
            const res = await requestGetPostById(id);
            setPost(res.metadata.data);
            setSelectedImg(res?.metadata?.data?.images[0]);
            setUser(res?.metadata?.dataUser);
            setUserHeart(res?.metadata?.userFavourite);
            document.title = `${res.metadata.data.title} - PhongTro123`;
        } catch (error) {
            console.error('Error fetching post:', error);
            message.error('Không thể tải thông tin bài viết');
        } finally {
            setLoadingPost(false);
            setLoadingUser(false); // Since user data comes with the post
        }
    }, [id]);

    // Optimized fetch function for other posts - with caching consideration
    const fetchOtherPosts = useCallback(async () => {
        try {
            setLoadingVipPosts(true);
            // Lấy các bài đăng thường thay vì VIP
            const res = await requestGetPosts({ limit: 5 });
            setPostVip(res.metadata.posts || []);
        } catch (error) {
            console.error('Error fetching other posts:', error);
            setPostVip([]); // Set empty array instead of failing
        } finally {
            setLoadingVipPosts(false);
        }
    }, []);

    // Load data on component mount using Promise.all for efficiency
    useEffect(() => {
        const loadData = async () => {
            try {
                // Attempt to load both datasets concurrently for better performance
                await Promise.all([
                    fetchPost(),
                    fetchOtherPosts()
                ]);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
    }, [fetchPost, fetchPostVip]);

    const { dataUser, setDataMessages } = useStore();
    const { usersMessage, setUsersMessage } = useSocket();

    const handleCreateFavourite = async () => {
        try {
            setLoadingFavorites(true);
            const data = {
                postId: post._id,
            };
            const res = await requestCreateFavourite(data);
            // Instead of refetching, optimistically update the state
            setUserHeart(prev => [...prev, dataUser._id]);
            message.success(res.message);
        } catch (error) {
            message.error(error.response?.data?.message || 'Lưu thất bại');
        } finally {
            setLoadingFavorites(false);
        }
    };

    const handleDeleteFavourite = async () => {
        try {
            setLoadingFavorites(true);
            const data = {
                postId: post._id,
            };
            const res = await requestDeleteFavourite(data);
            // Instead of refetching, optimistically update the state
            setUserHeart(prev => prev.filter(userId => userId !== dataUser._id));
            message.error(res.message);
        } catch (error) {
            message.error(error.response?.data?.message || 'Bỏ lưu thất bại');
        } finally {
            setLoadingFavorites(false);
        }
    };

    // Loading state for main content
    if (loadingPost) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('loading-container')}>
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                    <p>Đang tải thông tin bài viết...</p>
                </div>
            </div>
        );
    }

    if (!post._id) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('error-container')}>
                    <p>Không tìm thấy bài viết</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('wrapper')}>
            <main className={cx('container')}>
                <div className={cx('content')}>
                    <div className={cx('left')}>
                        <div className={cx('slider-container')}>
                            <div className={cx('slide-item')}>
                                <img src={selectedImg} alt="" />
                            </div>
                            <div className={cx('select-img')}>
                                {post?.images?.map((image, index) => (
                                    <img 
                                        key={index} 
                                        src={image} 
                                        alt="" 
                                        onClick={() => setSelectedImg(image)}
                                        className={selectedImg === image ? cx('selected') : ''}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={cx('property-details')}>
                            <div className={cx('property-header')}>
                                {/* Không còn phân biệt tin VIP và thường */}
                                <h1 className={cx('property-title')}> {post?.title}</h1>
                                <div className={cx('property-location')}>
                                    <span>
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className={cx('location-icon')} />
                                        {post?.address?.fullAddress || post?.location}
                                    </span>
                                </div>
                                <div className={cx('property-meta')}>
                                    <div className={cx('price')}>{post?.price?.toLocaleString()} VNĐ/tháng</div>
                                    <div className={cx('area')}>{post?.area} m²</div>
                                </div>
                            </div>

                            <div className={cx('property-description')}>
                                <h2>Thông tin mô tả</h2>
                                <p dangerouslySetInnerHTML={{ __html: post?.description }} />
                            </div>

                            <div className={cx('property-features')}>
                                <h2>Nổi bật</h2>
                                <div className={cx('features-grid')}>
                                    {post?.options?.map((option, index) => (
                                        <div className={cx('feature-item')} key={index}>
                                            <span className={cx('feature-icon', 'check')}></span>
                                            <span>{option}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={cx('map-section')}>
                            <h3 className={cx('section-title')}>Vị trí & bản đồ</h3>
                            <div className={cx('map-container')}>
                                <div className={cx('address-bar')}>
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className={cx('location-icon')} />
                                    <span className={cx('address-text')}>{post?.address?.fullAddress || post?.location || 'Địa chỉ chưa được cập nhật'}</span>
                                </div>

                                {/* Optimized map loading with lazy loading and fallback */}
                                <div className={cx('map-frame')}>
                                    {post?.address?.fullAddress || post?.location ? (
                                        <div className={cx('map-interactive')}>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post?.address?.fullAddress || post?.location)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={cx('map-link')}
                                            >
                                                <div className={cx('map-placeholder')}>
                                                    <p>📍 Xem vị trí trên Google Maps</p>
                                                    <p>{post?.address?.fullAddress || post?.location}</p>
                                                </div>
                                            </a>
                                        </div>
                                    ) : (
                                        <div className={cx('map-placeholder')}>
                                            <p>Bản đồ chưa khả dụng</p>
                                            <p>Vui lòng cập nhật địa chỉ để xem bản đồ</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={cx('right')}>
                        <div className={cx('contact-card')}>
                            <div className={cx('user-info')}>
                                <div className={cx('avatar')}>
                                    <img 
                                        src={user?.avatar || userDefault} 
                                        alt="Avatar" 
                                        onError={(e) => {
                                            e.target.src = userDefault; // fallback to default image
                                        }}
                                    />
                                </div>
                                <div className={cx('user-details')}>
                                    <h3 className={cx('user-name')}>{user?.username || user?.fullName}</h3>
                                    <div className={cx('user-status')}>
                                        <span className={cx('status-dot', user?.status === 'Đang hoạt động' ? 'status-active' : 'status-inactive')}></span>
                                        <span className={cx('status-text')}>{user?.status || 'Đang hoạt động'}</span>
                                    </div>
                                    <div className={cx('user-stats')}>
                                        <span>{user?.lengthPost} tin đăng</span>
                                        <span className={cx('dot-separator')}></span>
                                        <span>Tham gia từ: {dayjs(user?.createdAt).format('DD/MM/YYYY')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={cx('contact-buttons')}>
                                <a href={`tel:${user?.phone}`} className={cx('btn', 'btn-phone')}>
                                    <FontAwesomeIcon icon={faPhoneAlt} />
                                    {user?.phone || 'chưa cập nhật'}
                                </a>
                                <ChatButton
                                    userId={user._id}
                                    username={user.username || user.fullName}
                                    avatar={user.avatar}
                                    status={user.status}
                                    className={cx('btn', 'btn-zalo')}
                                    icon={false}
                                />
                            </div>

                            <div className={cx('action-buttons')}>
                                <button
                                    onClick={
                                        userHeart.find((item) => item === dataUser._id)
                                            ? handleDeleteFavourite
                                            : handleCreateFavourite
                                    }
                                    className={cx('action-btn', 'action-btn-heart', userHeart.find((item) => item === dataUser._id) ? 'active' : '')}
                                    disabled={loadingFavorites}
                                >
                                    <FontAwesomeIcon icon={faHeart} />
                                    {loadingFavorites ? 'Đang xử lý...' : (userHeart.find((item) => item === dataUser._id) ? 'Đã lưu' : 'Lưu tin')}
                                </button>
                                <button className={cx('action-btn')}>
                                    <FontAwesomeIcon icon={faShareAlt} />
                                    Chia sẻ
                                </button>
                            </div>
                        </div>

                        <div className={cx('featured-listings')}>
                            <h3 className={cx('featured-title')}>Các tin đăng khác</h3>
                            
                            {loadingVipPosts ? (
                                <div className={cx('loading-vip')}>
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                    <span>Đang tải...</span>
                                </div>
                            ) : (
                                postVip.map((item, index) => (
                                    <div className={cx('listing-item')} key={item._id || index}>
                                        <div className={cx('listing-image')}>
                                            <img 
                                                src={item.images[0]} 
                                                alt="Phòng trọ cao cấp" 
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                        <div className={cx('listing-content')}>
                                            <h4 className={cx('listing-name')}>{item.title}</h4>
                                            <div className={cx('listing-price')}>
                                                {item.price.toLocaleString()} VNĐ/tháng
                                            </div>
                                            <div className={cx('listing-time')}>
                                                {dayjs(item.createdAt).format('DD/MM/YYYY')}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DetailPost;