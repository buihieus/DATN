import Context from './Context'; 
import CryptoJS from 'crypto-js';
import cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { requestAuth, requestSearch } from '../config/request';
import useDebounce from '../hooks/useDebounce';

export function Provider({ children }) {
    const [dataUser, setDataUser] = useState({});
    const [dataPayment, setDataPayment] = useState(null);
    const [dataMessages, setDataMessages] = useState([]);
    const [globalUsersMessage, setGlobalUsersMessage] = useState([]);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Add loading state

    // ✅ Lấy user từ server nếu có cookie token
    const fetchAuth = async () => {
        try {
            const res = await requestAuth();
            const bytes = CryptoJS.AES.decrypt(
                res.metadata.auth,
                import.meta.env.VITE_SECRET_CRYPTO
            );
            const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            setDataUser(user);
        } catch (err) {
            // If auth request fails (e.g., token expired), clear user data
            // but only if it's a 401 error (unauthorized), not a network error
            if (err.response && err.response.status === 401) {
                setDataUser({});
                // Optionally remove the logged cookie to indicate session ended
                cookies.remove('logged');
            } else {
                // For other errors (like network issues), keep the current state
                console.log('Lỗi khi kiểm tra xác thực:', err.message);
            }
        } finally {
            setIsLoadingAuth(false);
        }
    };

    // ✅ ĐỌC cookie logged (để xác định có thể có phiên đăng nhập hay không)
    useEffect(() => {
        // Check if user might be logged in based on the 'logged' cookie
        const loggedCookie = cookies.get('logged');
        if (loggedCookie) {
            // Attempt to fetch user info to verify session
            fetchAuth();
        } else {
            // If no logged cookie, we know user is not logged in
            setIsLoadingAuth(false);
        }
    }, []);

    // Effect to handle token refresh when user data is available
    useEffect(() => {
        if (dataUser && dataUser._id) {
            // User is authenticated, ensure token manager is running
            // The AuthProvider component will handle this
        }
    }, [dataUser]);

    // ======================================
    // SEARCH
    // ======================================
    const [valueSearch, setValueSearch] = useState('');
    const debouncedSearch = useDebounce(valueSearch, 500);

    const [dataSearch, setDataSearch] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            if (!debouncedSearch) return setDataSearch([]);
            const res = await requestSearch(debouncedSearch);
            setDataSearch(res.metadata);
        };
        fetchData();
    }, [debouncedSearch]);

    return (
        <Context.Provider
            value={{
                dataUser,
                setDataUser,      // ✅ PHẢI expose ra để Login/Logout update UI NGAY
                dataPayment,
                setDataPayment,
                fetchAuth,
                isLoadingAuth,    // Add loading state to context
                dataSearch,
                setValueSearch,
                dataMessages,
                setDataMessages,
                globalUsersMessage,
                setGlobalUsersMessage,
            }}
        >
            {children}
        </Context.Provider>
    );
}
