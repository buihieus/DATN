import classNames from 'classnames/bind';
import styles from './RegisterUser.module.scss';
import Header from '../../Components/Header/Header';
import { Form, Input, Button, Tabs, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, HeatMapOutlined } from '@ant-design/icons';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { requestRegister, requestLoginGoogle } from '../../config/request';
import CryptoJS from "crypto-js";
import { useStore } from "../../hooks/useStore";

const cx = classNames.bind(styles);

function RegisterUser() {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { setDataUser, fetchAuth } = useStore();

    // ✅ Register
    const onFinish = async (values) => {
        try {
            await requestRegister({
                fullName: values.name,
                email: values.email,
                password: values.password,
                phone: values.phone,
                address: values.address,
            });

            message.success("Đăng ký thành công");
            navigate('/login'); // Quay về trang đăng nhập sau khi đăng ký thành công
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng ký thất bại");
        }
    };

    // ✅ Google Login
    const handleSuccess = async ({ credential }) => {
        try {
            const res = await requestLoginGoogle({ credential });

            const bytes = CryptoJS.AES.decrypt(
                res.metadata.auth,
                import.meta.env.VITE_SECRET_CRYPTO
            );
            const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

            setDataUser(user);
            message.success("Đăng nhập thành công");
            navigate('/');
        } catch (error) {
            message.error(error.response?.data?.message);
        }
    };

    useEffect(() => {
        document.title = "Đăng ký";
    }, []);

    return (
        <div className={cx('wrapper')}>
            <Header />

            <main className={cx('main')}>
                <div className={cx('login-container')}>

                    <Tabs
                        defaultActiveKey="1"
                        centered
                        items={[
                            {
                                key: '1',
                                label: 'Tạo tài khoản mới',
                                children: (
                                    <Form
                                        form={form}
                                        className={cx('login-form')}
                                        onFinish={onFinish}
                                    >
                                        <Form.Item name="name" rules={[{ required: true }]}>
                                            <Input prefix={<UserOutlined />} placeholder="Họ tên" size="large" />
                                        </Form.Item>

                                        <Form.Item name="email" rules={[{ required: true }]}>
                                            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
                                        </Form.Item>

                                        <Form.Item name="phone" rules={[{ required: true }]}>
                                            <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" size="large" />
                                        </Form.Item>

                                        <Form.Item name="address" rules={[{ required: true }]}>
                                            <Input prefix={<HeatMapOutlined />} placeholder="Địa chỉ" size="large" />
                                        </Form.Item>

                                        <Form.Item name="password" rules={[{ required: true }]}>
                                            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                                        </Form.Item>

                                        <div className={cx('footer')}>
                                            <Link to="/login" className={cx('forgot-password')}>
                                                Bạn đã có tài khoản?
                                            </Link>

                                            <Link to="/forgot-password" className={cx('forgot-password')}>
                                                Bạn quên mật khẩu?
                                            </Link>
                                        </div>

                                        <Form.Item>
                                            <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
                                                <GoogleLogin onSuccess={handleSuccess} />
                                            </GoogleOAuthProvider>
                                        </Form.Item>

                                        <Form.Item>
                                            <Button type="primary" htmlType="submit" block size="large">
                                                Đăng ký
                                            </Button>
                                        </Form.Item>

                                        <Typography.Text>
                                            Qua việc đăng nhập hoặc tạo tài khoản, bạn đồng ý với các{' '}
                                            <Link to="#">quy định sử dụng</Link> và{' '}
                                            <Link to="#">chính sách bảo mật</Link>.
                                        </Typography.Text>
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

export default RegisterUser;
