import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Space, Modal, Descriptions, Tag, Divider, Input, DatePicker, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import { requestGetRechargeStats, requestGetTransactionDetail } from '../../../../config/request';

function ManagerRechange() {
    const [rechargeStats, setRechargeStats] = useState({
        totalTransactions: 0,
        totalRevenue: 0,
        recentTransactions: 0,
        transactionGrowth: 0,
        recentRevenue: 0,
        revenueGrowth: 0,
    });
    const [rechargeData, setRechargeData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [transactionDetailLoading, setTransactionDetailLoading] = useState(false);
    
    // State for search filters
    const [searchFullName, setSearchFullName] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [searchDate, setSearchDate] = useState(null);
    const [searchStartDate, setSearchStartDate] = useState(null);
    const [searchEndDate, setSearchEndDate] = useState(null);

    const columns = [
        {
            title: 'Người dùng',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Email người dùng',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
        },
        {
            title: 'Phương thức',
            dataIndex: 'typePayment',
            key: 'typePayment',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'success' ? 'green' : 'red'}>
                    {status === 'success' ? 'Thành công' : 'Thất bại'}
                </Tag>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <a onClick={() => showTransactionDetail(record.key)}>Xem chi tiết</a>
            ),
        },
    ];

    const fetchRechargeData = async (fullName = '', email = '', date = null, startDate = null, endDate = null) => {
        try {
            setLoading(true);
            
            // Build query parameters
            const params = {};
            if (fullName) params.fullName = fullName;
            if (email) params.email = email;
            if (date) params.createdAt = date.format('YYYY-MM-DD'); // Format date as YYYY-MM-DD
            
            // Add date range if both start and end dates are provided
            if (startDate && endDate) {
                params.createdAtRange = `${startDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}`;
            }
            
            const response = await requestGetRechargeStats(params);
            const { metadata } = response;

            setRechargeStats({
                totalTransactions: metadata.totalTransactions,
                totalRevenue: metadata.totalRevenue,
                recentTransactions: metadata.recentTransactions,
                transactionGrowth: metadata.transactionGrowth,
                recentRevenue: metadata.recentRevenue,
                revenueGrowth: metadata.revenueGrowth,
            });

            setRechargeData(metadata.transactions);
        } catch (error) {
            console.error('Error fetching recharge data:', error);
        } finally {
            setLoading(false);
        }
    };

    const showTransactionDetail = async (transactionId) => {
        try {
            setTransactionDetailLoading(true);
            const response = await requestGetTransactionDetail(transactionId);
            setSelectedTransaction(response.metadata);
            setDetailModalVisible(true);
        } catch (error) {
            console.error('Error fetching transaction detail:', error);
        } finally {
            setTransactionDetailLoading(false);
        }
    };

    const handleModalClose = () => {
        setDetailModalVisible(false);
        setSelectedTransaction(null);
    };

    // Handle search functionality
    const handleSearch = () => {
        fetchRechargeData(searchFullName, searchEmail, null, searchStartDate, searchEndDate);
    };

    const handleReset = () => {
        setSearchFullName('');
        setSearchEmail('');
        setSearchStartDate(null);
        setSearchEndDate(null);
        fetchRechargeData('', '', null, null, null);
    };

    useEffect(() => {
        fetchRechargeData('', '', null, null, null);
    }, []);

    return (
        <div style={{ padding: '24px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Card>
                            <Statistic
                                title="Tổng số giao dịch"
                                value={rechargeStats.totalTransactions}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card>
                            <Statistic
                                title="Tổng doanh thu"
                                value={rechargeStats.totalRevenue}
                                loading={loading}
                                formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card title="Danh sách giao dịch gần đây">
                    <div style={{ marginBottom: 16, display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Input
                            placeholder="Tìm theo tên người dùng"
                            value={searchFullName}
                            onChange={(e) => setSearchFullName(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <Input
                            placeholder="Tìm theo email"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <span>Từ:</span>
                        <DatePicker
                            placeholder="Ngày bắt đầu"
                            value={searchStartDate}
                            onChange={setSearchStartDate}
                            style={{ width: 150 }}
                        />
                        <span>Đến:</span>
                        <DatePicker
                            placeholder="Ngày kết thúc"
                            value={searchEndDate}
                            onChange={setSearchEndDate}
                            style={{ width: 150 }}
                        />
                        <Button 
                            type="primary" 
                            icon={<SearchOutlined />} 
                            onClick={handleSearch}
                        >
                            Tìm kiếm
                        </Button>
                        <Button 
                            icon={<CalendarOutlined />} 
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    </div>
                    <Table
                        columns={columns}
                        dataSource={rechargeData}
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        rowKey="key"
                    />
                </Card>
            </Space>

            {/* Transaction Detail Modal */}
            <Modal
                title="Chi tiết giao dịch"
                open={detailModalVisible}
                onCancel={handleModalClose}
                footer={null}
                width={600}
                loading={transactionDetailLoading}
            >
                {selectedTransaction && (
                    <Descriptions bordered column={1} loading={transactionDetailLoading}>
                        <Descriptions.Item label="ID Giao dịch">
                            {selectedTransaction._id}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người dùng">
                            {selectedTransaction.userId ? selectedTransaction.userId.fullName : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email người dùng">
                            {selectedTransaction.userId ? selectedTransaction.userId.email : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">
                            {selectedTransaction.userId ? selectedTransaction.userId.phone : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tiền">
                            {selectedTransaction.amount.toLocaleString('vi-VN')} VNĐ
                        </Descriptions.Item>
                        <Descriptions.Item label="Phương thức thanh toán">
                            {selectedTransaction.typePayment}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={selectedTransaction.status === 'success' ? 'green' : 'red'}>
                                {selectedTransaction.status === 'success' ? 'Thành công' : 'Thất bại'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {moment(selectedTransaction.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                        </Descriptions.Item>
                        {selectedTransaction.userId && (
                            <>
                                <Descriptions.Item label="Số dư hiện tại">
                                    {selectedTransaction.userId.balance?.toLocaleString('vi-VN') || 'N/A'} VNĐ
                                </Descriptions.Item>
                            </>
                        )}
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
}

export default ManagerRechange;