import React, { useState } from 'react';
import { Modal, Form, Select, Radio, Button, Space, Typography, Tag, message } from 'antd';
import { requestRenewPost } from '../../../../config/request';

const { Title, Text, Paragraph } = Typography;

const RenewPostModal = ({ visible, onCancel, post, onRenewSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(null);
    const [selectedType, setSelectedType] = useState(post?.typeNews || 'normal');

    // Pricing data matching server-side
    const pricePostVip = [
        { date: 3, price: 50000 },
        { date: 7, price: 315000 },
        { date: 30, price: 1200000 },
    ];

    const pricePostNormal = [
        { date: 3, price: 10000 },
        { date: 7, price: 60000 },
        { date: 30, price: 1000000 },
    ];

    const handleRenew = async (values) => {
        setLoading(true);
        try {
            const renewData = {
                postId: post._id,
                dateEnd: values.duration
                // Không gửi newTypeNews vì không còn chức năng nâng cấp loại tin
            };

            await requestRenewPost(renewData);
            message.success('Gia hạn bài đăng thành công!');
            form.resetFields();
            onRenewSuccess();
            onCancel();
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi gia hạn bài đăng');
        } finally {
            setLoading(false);
        }
    };

    const calculatePrice = (duration, type) => {
        if (type === 'vip') {
            const selectedPackage = pricePostVip.find(p => p.date === duration);
            return selectedPackage ? selectedPackage.price : 0;
        } else {
            const selectedPackage = pricePostNormal.find(p => p.date === duration);
            return selectedPackage ? selectedPackage.price : 0;
        }
    };

    const currentPrice = selectedDuration ? calculatePrice(selectedDuration, selectedType) : 0;

    const durationOptions = [
        { days: 3, normalPrice: 10000, vipPrice: 50000 },
        { days: 7, normalPrice: 60000, vipPrice: 315000 },
        { days: 30, normalPrice: 1000000, vipPrice: 1200000 }
    ];

    return (
        <Modal
            title="Gia hạn bài đăng"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={600}
        >
            <div style={{ marginBottom: 24 }}>
                <Title level={5}>Thông tin bài đăng</Title>
                <Paragraph>
                    <strong>Tiêu đề:</strong> {post?.title}
                </Paragraph>
                <Paragraph>
                    <strong>Loại tin:</strong> 
                    <Tag color={post?.typeNews === 'vip' ? 'gold' : 'blue'}>
                        {post?.typeNews === 'vip' ? 'Tin VIP' : 'Tin thường'}
                    </Tag>
                </Paragraph>
                <Paragraph>
                    <strong>Trạng thái hiện tại:</strong> 
                    <Tag color={
                        post?.status === 'active' ? 'green' : 
                        post?.status === 'inactive' ? 'orange' : 
                        post?.status === 'cancel' ? 'red' : 'red'
                    }>
                        {post?.status === 'active' ? 'Đã duyệt' : 
                         post?.status === 'inactive' ? 'Chưa duyệt' : 
                         post?.status === 'cancel' ? 'Đã hủy' : 'Đã hết hạn'}
                    </Tag>
                </Paragraph>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleRenew}
            >
                {/* Ẩn trường loại tin vì tất cả bài đăng đều là tin thường */}
                <Form.Item
                    name="typeNews"
                    initialValue="normal"
                    hidden
                >
                    <Input value="normal" />
                </Form.Item>

                <Form.Item
                    label="Thời gian gia hạn"
                    name="duration"
                    rules={[{ required: true, message: 'Vui lòng chọn thời gian gia hạn' }]}
                >
                    <Select
                        placeholder="Chọn số ngày gia hạn"
                        onChange={(value) => setSelectedDuration(value)}
                        options={[
                            {
                                label: '3 ngày',
                                value: 3
                            },
                            {
                                label: '7 ngày',
                                value: 7
                            },
                            {
                                label: '30 ngày',
                                value: 30
                            }
                        ]}
                    />
                </Form.Item>

                {selectedDuration && (
                    <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#f6ffed', 
                        border: '1px solid #b7eb8f', 
                        borderRadius: '4px',
                        marginBottom: 16
                    }}>
                        <Text strong>
                            Tổng cộng: {currentPrice.toLocaleString('vi-VN')} VNĐ
                        </Text>
                    </div>
                )}

                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Gia hạn ngay
                        </Button>
                        <Button onClick={onCancel}>Hủy</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RenewPostModal;