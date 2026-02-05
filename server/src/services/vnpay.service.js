const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const crypto = require('crypto');
const modelUser = require('../models/users.model');
const modelRechargeUser = require('../models/RechargeUser.model');

class VnpayService {
    constructor() {
        this.vnpay = new VNPay({
            tmnCode: process.env.VNP_TMNCODE,
            secureSecret: process.env.VNP_HASHSECRET,
            vnpayHost: 'https://sandbox.vnpayment.vn',
            testMode: true,
            hashAlgorithm: 'SHA512',
            loggerFn: ignoreLogger,
        });
    }

    /**
     * Tạo URL thanh toán VNPay
     * @param {Object} paymentData - Dữ liệu thanh toán
     * @param {string} paymentData.userId - ID người dùng
     * @param {number} paymentData.amount - Số tiền thanh toán (đơn vị: VND)
     * @param {string} paymentData.orderInfo - Thông tin đơn hàng
     * @param {Object} paymentData.req - Request object để lấy IP
     */
    async createPaymentUrl(paymentData) {
        const { userId, amount, orderInfo = 'Nạp tiền vào ví', req } = paymentData;

        // VNPay expects amount in VND (no decimals), so multiply by 100
        // This is standard for VNPay - amount should be in smallest currency unit
        const vnpAmount = Math.round(amount);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Xác định URL callback - sử dụng chính URL của server để nhận callback từ VNPay
        // Cổng thanh toán sẽ gửi callback trực tiếp đến server, không phải đến mobile app
        const returnUrl = `${process.env.HOST_URL || `http://${req.get('host') || 'localhost:3000'}`}/api/check-payment-vnpay`;

        const paymentUrl = await this.vnpay.buildPaymentUrl({
            vnp_Amount: vnpAmount,
            vnp_IpAddr: this.getClientIp(req),
            vnp_TxnRef: this.generateTxnRef(userId),
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: returnUrl, // URL callback để VNPay gửi kết quả về
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: dateFormat(new Date()),
            vnp_ExpireDate: dateFormat(tomorrow),
        });

        return paymentUrl;
    }

    /**
     * Xử lý callback từ VNPay
     */
    async handlePaymentReturn(query) {
        try {
            // Xác thực chữ ký từ VNPay
            const isValid = this.vnpay.verifyReturnUrl(query);

            if (!isValid) {
                throw new Error('Invalid VNPay signature');
            }

            const { vnp_ResponseCode, vnp_TxnRef, vnp_Amount, vnp_OrderInfo } = query;
            // console.log('VNPay Query:', query);
            // console.log('vnp_Amount raw:', query.vnp_Amount);
            // console.log('Parsed amount:', parseInt(query.vnp_Amount) / 100);
            // Trích xuất userId từ vnp_TxnRef hoặc vnp_OrderInfo
            let userId = this.extractUserIdFromTxnRef(vnp_TxnRef);
            if (!userId) {
                userId = this.extractUserIdFromOrderInfo(vnp_OrderInfo);
            }

            if (!userId) {
                throw new Error('Cannot extract user ID from transaction');
            }

            // VNPay returns amount in smallest currency unit (multiplied by 100)
            // So we need to divide by 100 to get the actual amount in VND
            const amount = parseInt(vnp_Amount) / 100;


            // Kiểm tra mã phản hồi
            if (vnp_ResponseCode === '00') { // Thanh toán thành công
                await this.processSuccessfulPayment(userId, amount);
                return {
                    success: true,
                    amount: amount,
                    message: 'Payment successful'
                };
            } else {
                // Handle specific error codes
                let errorMessage = 'Payment failed';
                switch (vnp_ResponseCode) {
                    case '01':
                        errorMessage = 'Giao dịch đã tồn tại';
                        break;
                    case '02':
                        errorMessage = 'Merchant không hợp lệ';
                        break;
                    case '03':
                        errorMessage = 'Mã đơn hàng trùng lặp';
                        break;
                    case '04':
                        errorMessage = 'Số tiền không hợp lệ';
                        break;
                    case '05':
                        errorMessage = 'Tài khoản không hợp lệ';
                        break;
                    case '06':
                        errorMessage = 'Lỗi tạo giao dịch';
                        break;
                    case '07':
                        errorMessage = 'Thông tin khách hàng không đúng';
                        break;
                    case '08':
                        errorMessage = 'Thẻ quá giới hạn giao dịch';
                        break;
                    case '09':
                        errorMessage = 'Thẻ chưa kích hoạt';
                        break;
                    case '10':
                        errorMessage = 'Giao dịch bị hủy';
                        break;
                    case '11':
                        errorMessage = 'Giao dịch hết hạn';
                        break;
                    case '24':
                        errorMessage = 'Giao dịch bị từ chối';
                        break;
                    case '51':
                        errorMessage = 'Tài khoản không đủ số dư';
                        break;
                    case '65':
                        errorMessage = 'Số lượng giao dịch vượt quá giới hạn';
                        break;
                    case '75':
                        errorMessage = 'Ngân hàng từ chối giao dịch';
                        break;
                    case '79':
                        errorMessage = 'Mật khẩu không đúng';
                        break;
                    case '91':
                        errorMessage = 'Ngân hàng tạm ngừng giao dịch';
                        break;
                    default:
                        errorMessage = 'Giao dịch thất bại';
                }
                
                return {
                    success: false,
                    errorCode: vnp_ResponseCode,
                    message: errorMessage
                };
            }
        } catch (error) {
            console.error('VNPay callback error:', error);
            return {
                success: false,
                message: error.message
            };
        }


    }

    /**
     * Xử lý thanh toán thành công
     */
    async processSuccessfulPayment(userId, amount) {
        // Cập nhật số dư người dùng
        const user = await modelUser.findOneAndUpdate(
            { _id: userId },
            { $inc: { balance: amount } },
            { new: true }
        );

        if (!user) {
            throw new Error('User not found');
        }

        // Lưu lịch sử nạp tiền
        await modelRechargeUser.create({
            userId: user._id,
            amount: amount,
            typePayment: 'VNPAY',
            status: 'success',
        });

        // Gửi thông báo qua socket
        const userSockets = global.usersMap?.get(user._id.toString());
        if (userSockets && Array.isArray(userSockets) && userSockets.length > 0) {
            // Emit to all connected sockets for this user (in case user has multiple devices)
            userSockets.forEach(socket => {
                if (socket && typeof socket.emit === 'function') {
                    socket.emit('new-payment', {
                        userId: user._id,
                        amount: amount,
                        date: new Date(),
                        typePayment: 'VNPAY',
                    });
                }
            });
        }
    }

    /**
     * Trích xuất userId từ vnp_TxnRef
     */
    extractUserIdFromTxnRef(txnRef) {
        if (!txnRef) return null;
        // Giả sử định dạng là "userId-uuid" như trong code hiện tại
        const parts = txnRef.split('-');
        if (parts.length >= 1) {
            return parts[0]; // Trả về userId từ phần đầu tiên
        }
        return null;
    }

    /**
     * Trích xuất userId từ vnp_OrderInfo
     */
    extractUserIdFromOrderInfo(orderInfo) {
        if (!orderInfo) return null;
        // Giả sử định dạng là "nap tien userId" như trong code hiện tại
        const parts = orderInfo.split(' ');
        if (parts.length >= 3 && parts[0] === 'nap') {
            return parts[2]; // Trả về userId từ vị trí thứ 3
        }
        return null;
    }

    /**
     * Lấy IP của client
     */
    getClientIp(req) {
        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
            '127.0.0.1';
    }

    /**
     * Tạo mã giao dịch
     */
    generateTxnRef(userId) {
        return `${userId}-${Date.now()}`;
    }
}

module.exports = new VnpayService();