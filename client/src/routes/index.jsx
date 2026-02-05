import App from '../App';
import DetailPost from '../Pages/DetailPost/DetailPost';
import LoginUser from '../Pages/LoginUser/LoginUser';
import RegisterUser from '../Pages/RegisterUser/RegisterUser';
import Admin from '../Pages/Admin/Index';
import InfoUser from '../Pages/InfoUser/InfoUser';
import CreatePost from '../Pages/CreatePost/CreatePost';
import ForgotPassword from '../Pages/ForgotPassword/ForgotPassword';
import AISearch from '../Pages/AISearch/AISearch';
import Layout from '../Components/Layout/Layout';
import HomePage from '../Components/HomePage/HomePage';
import NotFoundPage from './NotFoundPage';
import ProtectedRouteAdmin from './ProtectedRouteAdmin';
import ProtectedRoute from './ProtectedRoute';
import ResultsPage from '../ResultsPage';

export const publicRoutes = [
    {
        path: '/',
        element: <Layout />,
        children: [
            { path: '', element: <HomePage /> },
            { path: 'chi-tiet-tin-dang/:id', element: <DetailPost /> },
            { path: 'trang-ca-nhan', element: <InfoUser /> },
            { path: 'search/:value', element: <AISearch /> },
            { path: 'results', element: <ResultsPage /> },
            { path: 'tinh-thanh/:province/:district?/:ward?', element: <ResultsPage /> },
        ],
    },
    { path: '/login', element: <LoginUser /> },
    { path: '/register', element: <RegisterUser /> },
    {
        path: '/admin',
        element: (
            <ProtectedRouteAdmin>
                <Admin />
            </ProtectedRouteAdmin>
        ),
    },
    { path: '/tao-bai-dang', element: <CreatePost /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '*', element: <NotFoundPage /> },
];

