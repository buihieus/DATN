import classNames from 'classnames/bind';
import styles from './LoginUser.module.scss';
import Header from '../../Components/Header/Header';
import { Form, Input, Button, Tabs, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { requestLogin, requestLoginGoogle } from '../../config/request';
import CryptoJS from "crypto-js";
import { useStore } from "../../hooks/useStore";

const cx = classNames.bind(styles);

function LoginUser() {
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const { setDataUser, fetchAuth } = useStore();

    // ✅ Login thường
    const onFinish = async (values) => {
        try {
            await requestLogin(values);

            // ✅ Lấy user từ BE (chuẩn nhất)
            // Dùng try-catch để tránh lỗi giải mã làm gián đoạn flow đăng nhập
            try {
                await fetchAuth();
            } catch (authError) {
                console.error("Lỗi khi cập nhật thông tin người dùng:", authError);
                // Không báo lỗi cho người dùng vì đăng nhập đã thành công
                // fetchAuth sẽ tự động được gọi lại khi Provider khởi động lại
            }

            message.success("Đăng nhập thành công");
            // Thêm một chút thời gian chờ để đảm bảo UI cập nhật trước khi chuyển hướng
            setTimeout(() => {
                navigate('/');
            }, 500);
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng nhập thất bại");
        }
    };

    // ✅ Login Google
    const handleSuccess = async ({ credential }) => {
        try {
            const res = await requestLoginGoogle({ credential });

            // ✅ decrypt auth → FE có user ngay
            try {
                const bytes = CryptoJS.AES.decrypt(
                    res.metadata.auth,
                    import.meta.env.VITE_SECRET_CRYPTO
                );
                const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                setDataUser(user);
            } catch (decryptError) {
                console.error("Lỗi khi giải mã thông tin người dùng từ Google:", decryptError);
                // Gọi fetchAuth thay thế để đảm bảo thông tin người dùng được cập nhật
                await fetchAuth();
            }

            message.success("Đăng nhập thành công");
            // Thêm một chút thời gian chờ để đảm bảo UI cập nhật trước khi chuyển hướng
            setTimeout(() => {
                navigate('/');
            }, 500);
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng nhập thất bại");
        }
    };

    useEffect(() => {
        document.title = "Đăng nhập";
    }, []);

    return (
        <div className={cx('wrapper')}>
            <Header />
            <main className={cx('main')}>
                <div className={cx('login-container')}>

                    <Tabs
                        defaultActiveKey="1"
                        centered
                        className={cx('login-tabs')}
                        items={[
                            {
                                key: '1',
                                label: 'Đăng nhập',
                                children: (
                                    <Form
                                        form={form}
                                        name="login"
                                        className={cx('login-form')}
                                        onFinish={onFinish}
                                    >
                                        <Form.Item
                                            name="email"
                                            rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
                                        >
                                            <Input
                                                prefix={<UserOutlined />}
                                                placeholder="Email"
                                                size="large"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="password"
                                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                                        >
                                            <Input.Password
                                                prefix={<LockOutlined />}
                                                placeholder="Mật khẩu"
                                                size="large"
                                            />
                                        </Form.Item>

                                        <div className={cx('footer')}>
                                            <Form.Item>
                                                <Link className={cx('forgot-password')} to="/register">
                                                    Bạn chưa có tài khoản
                                                </Link>
                                            </Form.Item>

                                            <Form.Item>
                                                <Link className={cx('forgot-password')} to="/forgot-password">
                                                    Bạn quên mật khẩu?
                                                </Link>
                                            </Form.Item>
                                        </div>

                                        <Form.Item>
                                            <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
                                                <GoogleLogin
                                                    onSuccess={handleSuccess}
                                                    onError={() => console.log('Login Failed')}
                                                />
                                            </GoogleOAuthProvider>
                                        </Form.Item>

                                        <Form.Item>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                className={cx('login-button')}
                                                block
                                                size="large"
                                            >
                                                Đăng nhập
                                            </Button>
                                        </Form.Item>

                                        <div className={cx('terms')}>
                                            <Typography.Text>
                                                Qua việc đăng nhập hoặc tạo tài khoản, bạn đồng ý với các{' '}
                                                <Link to="#">quy định sử dụng</Link> cũng như{' '}
                                                <Link to="#">chính sách bảo mật</Link>.
                                            </Typography.Text>
                                        </div>
                                    </Form>
                                ),
                            }
                        ]}
                    />

                </div>
            </main>
        </div>
    );
}

export default LoginUser;
