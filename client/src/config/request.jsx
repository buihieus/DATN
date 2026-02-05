import axios from 'axios';

import cookies from 'js-cookie';

const request = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true,
});

// Create a separate instance for the chatbot service
const chatbotRequest = axios.create({
    baseURL: 'http://localhost:8000', // Default port for the Python chatbot service
    withCredentials: false, // Chatbot service doesn't require authentication
    timeout: 30000, // 30 seconds timeout for chat requests
});

// Request interceptor - cookies with credentials are automatically handled by axios
// The server sets HTTP-Only cookies which are automatically included in requests
// when withCredentials is true
request.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const requestAddSearch = async (data) => {
    const res = await request.post('/api/add-search-keyword', data);
    return res.data;
};

export const requestResetPassword = async (data) => {
    const res = await request.post('/api/reset-password', data);
    return res.data;
};

export const requestForgotPassword = async (data) => {
    const res = await request.post('/api/forgot-password', data);
    return res.data;
};

export const requestGetHotSearch = async () => {
    const res = await request.get('/api/get-search-keyword');
    return res.data;
};

export const requestSearch = async (keyword) => {
    const res = await request.get('/api/search', { params: { keyword } });
    return res.data;
};

export const requestGetFilteredPosts = async (params) => {
    const res = await request.get('/api/advanced-search', { params });
    return res.data;
};


export const requestPostSuggest = async () => {
    try {
        const res = await request.get('/api/post-suggest');
        return res.data;
    } catch (error) {
        console.error('Error in requestPostSuggest:', error);
        throw error;
    }
};

export const requestChatbot = async (data) => {
    const res = await chatbotRequest.post('/chat', data);
    return res.data;
};

export const requestAISearch = async (question) => {
    const res = await request.get('/ai-search', { params: { question } });
    return res.data;
};

export const requestRegister = async (data) => {
    const response = await request.post('/api/register', data);
    return response.data;
};

export const requestLoginGoogle = async (data) => {
    const res = await request.post('/api/login-google', data);
    return res.data;
};

export const requestGetAdmin = async () => {
    const res = await request.get('/admin');
    return res.data;
};

export const requestLogin = async (data) => {
    const res = await request.post('/api/login', data);
    return res.data;
};

export const requestAuth = async () => {
    const res = await request.get('/api/auth');
    return res.data;
};

export const requestLogout = async () => {
    const res = await request.get('/api/logout');
    return res.data;
};

export const requestRefreshToken = async () => {
    const res = await request.get('/api/refresh-token');
    return res.data;
};

export const requestUpdateUser = async (data) => {
    const res = await request.post('/api/update-user', data);
    return res.data;
};

export const requestChangePassword = async (data) => {
    const res = await request.post('/api/change-password', data);
    return res.data;
};

export const requestGetUsers = async (searchTerm = '') => {
    const params = searchTerm ? { search: searchTerm } : {};
    const res = await request.get('/api/get-users', { params });
    return res.data;
};

export const requestDeleteUser = async (data) => {
    const res = await request.post('/api/delete-user', data);
    return res.data;
};

export const requestUpdateUserByAdmin = async (id, data) => {
    const res = await request.put(`/api/update-user-by-admin/${id}`, data);
    return res.data;
};

export const requestUpdatePasswordByAdmin = async (id, data) => {
    const res = await request.put(`/api/update-password-by-admin/${id}`, data);
    return res.data;
};

export const requestCreateUserByAdmin = async (data) => {
    const res = await request.post('/api/create-user-by-admin', data);
    return res.data;
};

export const requestGetAdminStats = async () => {
    const res = await request.get('/api/get-admin-stats');
    return res.data;
};

export const requestGetPublicStats = async () => {
    const res = await request.get('/api/get-public-stats');
    return res.data;
};

export const requestGetRechargeStats = async (params = {}) => {
    const res = await request.get('/api/get-recharge-stats', { params });
    return res.data;
};

export const requestGetTransactionDetail = async (transactionId) => {
    const res = await request.get(`/api/transaction-detail/${transactionId}`);
    return res.data;
};

export const requestGetProvinces = async () => {
    const res = await request.get('/api/provinces');
    return res.data;
};

export const requestGetWardsByProvince = async (provinceCode) => {
    const res = await request.get(`/api/provinces/${provinceCode}/wards`);
    return res.data;
};

//// posts

export const requestUploadImages = async (data) => {
    const res = await request.post('/api/upload-images', data);
    return res.data;
};

export const requestCreatePost = async (data) => {
    // Đảm bảo typeNews luôn là 'normal' nếu không được chỉ định
    const postData = {
        ...data,
        typeNews: data.typeNews || 'normal'  // Mặc định là 'normal'
    };
    const res = await request.post('/api/create-post', postData);
    return res.data;
};

export const requestCreatePostByAdmin = async (data) => {
    const res = await request.post('/api/create-post-by-admin', data);
    return res.data;
};

export const requestGetPostVip = async () => {
    const res = await request.get('/api/get-post-vip');
    return res.data;
};

export const requestRejectPost = async (data) => {
    const res = await request.post('/api/reject-post', data);
    return res.data;
};

export const requestDeletePost = async (data) => {
    const res = await request.post('/api/delete-post', data);
    return res.data;
};

export const requestUpdatePost = async (id, data) => {
    const res = await request.put(`/api/update-post/${id}`, data);
    return res.data;
};

export const requestGetAllPosts = async (data) => {
    const res = await request.get('/api/get-all-posts', { params: data });
    return res.data;
};

export const requestApprovePost = async (data) => {
    const res = await request.post('/api/approve-post', data);
    return res.data;
};

//// favourite

export const requestCreateFavourite = async (data) => {
    const res = await request.post('/api/create-favourite', data);
    return res.data;
};

export const requestDeleteFavourite = async (data) => {
    const res = await request.post('/api/delete-favourite', data);
    return res.data;
};

export const requestGetFavourite = async () => {
    const res = await request.get('/api/get-favourite');
    return res.data;
};

export const requestGetPosts = async (params) => {
    // Filter out parameters with empty string values
    const filteredParams = Object.entries(params)
        .filter(([key, value]) => value !== '')
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});

    const res = await request.get('/api/get-posts', { params: filteredParams });
    return res.data;
};

export const requestGetPostById = async (id) => {
    const res = await request.get(`/api/get-post-by-id`, { params: { id } });
    return res.data;
};

export const requestPayments = async (data) => {
    const res = await request.post('/api/payments', data);
    return res.data;
};

export const requestGetRechargeUser = async () => {
    const res = await request.get('/api/recharge-user');
    return res.data;
};

export const requestGetPostByUserId = async () => {
    const res = await request.get('/api/get-post-by-user-id');
    return res.data;
};

export const requestRenewPost = async (data) => {
    // Không gửi newTypeNews vì không còn chức năng nâng cấp loại tin
    const renewData = {
        ...data
    };
    // Xóa newTypeNews nếu tồn tại để đảm bảo không gửi lên server
    if (renewData.newTypeNews) {
        delete renewData.newTypeNews;
    }

    const res = await request.post('/api/renew-post', renewData);
    return res.data;
};

export const requestGetLocations = async (provinceCode = null, districtCode = null) => {
    let url = '/api/get-locations';
    const params = {};

    if (provinceCode) {
        params.province = provinceCode;
    }

    if (districtCode) {
        params.district = districtCode;
    }

    const res = await request.get(url, { params });
    return res.data;
};

export const requestFilterPosts = async (filters) => {
    const res = await request.post('/api/filter-posts', filters);
    return res.data;
};

//// messenger

export const requestCreateMessage = async (data) => {
    const res = await request.post('/api/create-message', data);
    return res.data;
};

export const requestGetMessages = async (data) => {
    const res = await request.get('/api/get-messages', { params: data });
    return res.data;
};

export const requestGetMessagesByUserId = async () => {
    try {
        const res = await request.get('/api/get-messages-by-user-id');
        return res.data;
    } catch (error) {
        console.error('Error in requestGetMessagesByUserId:', error);
        throw error;
    }
};

export const requestMarkMessageRead = async (data) => {
    const res = await request.post('/api/mark-message-read', data);
    return res.data;
};

export const requestMarkAllMessagesRead = async (data) => {
    const res = await request.post('/api/mark-all-messages-read', data);
    return res.data;
};

export const requestUploadImage = async (data) => {
    const res = await request.post('/api/upload-image', data);
    return res.data;
};

let isRefreshing = false;
let failedRequestsQueue = [];

request.interceptors.response.use(
    (response) => response, // Trả về nếu không có lỗi
    async (error) => {
        const originalRequest = error.config;

        // Chỉ xử lý lỗi 401 cho các endpoint yêu cầu xác thực, không áp dụng cho forgot-password/reset-password
        if (error.response?.status === 401 && !originalRequest._retry &&
            !originalRequest.url.includes('/api/forgot-password') &&
            !originalRequest.url.includes('/api/reset-password')) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    // Gửi yêu cầu refresh token
                    const token = cookies.get('token');
                    const refreshToken = cookies.get('refreshToken');

                    if (!token && !refreshToken) {
                        // Nếu không có cả token và refreshToken, chuyển hướng đến trang đăng nhập
                        localStorage.clear();
                        window.location.href = '/login';
                        return Promise.reject(error);
                    }

                    const refreshResponse = await requestRefreshToken();

                    // Cập nhật token trong cookies nếu cần
                    if (refreshResponse.metadata && refreshResponse.metadata.token) {
                        // Token mới đã được cập nhật qua cookie bởi server
                    }

                    // Xử lý lại tất cả các request bị lỗi 401 trước đó
                    failedRequestsQueue.forEach((req) => req.resolve());
                    failedRequestsQueue = [];
                } catch (refreshError) {
                    console.error('Refresh token failed:', refreshError);
                    // Nếu refresh thất bại, đăng xuất
                    failedRequestsQueue.forEach((req) => req.reject(refreshError));
                    failedRequestsQueue = [];
                    localStorage.clear();
                    cookies.remove('token');
                    cookies.remove('refreshToken');
                    cookies.remove('logged');
                    window.location.href = '/login'; // Chuyển về trang đăng nhập
                } finally {
                    isRefreshing = false;
                }
            }

            // Trả về một Promise để retry request sau khi token mới được cập nhật
            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    resolve: () => {
                        resolve(request(originalRequest));
                    },
                    reject: (err) => reject(err),
                });
            });
        }

        return Promise.reject(error);
    },
);
