const axios = require('axios');
const crypto = require('crypto');

const { BadRequestError } = require('../core/error.response');
const { OK } = require('../core/success.response');

const modelUser = require('../models/users.model');
const modelRechargeUser = require('../models/RechargeUser.model');

const { v4: uuidv4 } = require('uuid');
const vnpayService = require('../services/vnpay.service');

class PaymentsController {
    async payments(req, res) {
        const { id } = req.user;
        const { typePayment, amountUser } = req.body;

        if (!typePayment) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        if (typePayment === 'MOMO') {
            var partnerCode = 'MOMO';
            var accessKey = 'F8BBA842ECF85';
            var secretkey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            var requestId = partnerCode + new Date().getTime();
            var orderId = requestId;
            var orderInfo = `nap tien ${id}`; // nội dung giao dịch thanh toán
            var redirectUrl = 'http://localhost:3000/api/check-payment-momo'; // 8080
            var ipnUrl = 'http://localhost:3000/api/check-payment-momo';
            var amount = amountUser;
            var requestType = 'captureWallet';
            var extraData = ''; //pass empty value if your merchant does not have stores

            var rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                extraData +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;
            //puts raw signature

            //signature
            var signature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');

            //json object send to MoMo endpoint
            const requestBody = JSON.stringify({
                partnerCode: partnerCode,
                accessKey: accessKey,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                extraData: extraData,
                requestType: requestType,
                signature: signature,
                lang: 'en',
            });

            const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            new OK({ message: 'Thanh toán thông báo', metadata: response.data }).send(res);
        }
        if (typePayment === 'VNPAY') {
            const paymentData = {
                userId: id,
                amount: amountUser,
                orderInfo: `Nạp tiền ${id}`,
                req: req
            };
            
            const paymentUrl = await vnpayService.createPaymentUrl(paymentData);
            new OK({ message: 'Thanh toán thông báo', metadata: paymentUrl }).send(res);
        }
    }

    async checkPaymentMomo(req, res, next) {
        const { orderInfo, resultCode, amount } = req.query;
        
        console.log('MoMo callback received:', req.query);
        console.log('User Agent:', req.headers['user-agent']);

        if (resultCode === '0') {
            const result = orderInfo.split(' ')[2];
            const findUser = await modelUser.findOne({ _id: result });
            if (findUser) {
                // MoMo should return the correct amount, but let's make sure we're consistent
                // In standard MoMo integration, the amount is returned as entered
                const processedAmount = Number(amount);
                findUser.balance += processedAmount;
                await findUser.save();
                const userSockets = global.usersMap.get(findUser._id.toString());
                if (userSockets && Array.isArray(userSockets) && userSockets.length > 0) {
                    // Emit to all connected sockets for this user (in case user has multiple devices)
                    userSockets.forEach(socket => {
                        if (socket && typeof socket.emit === 'function') {
                            socket.emit('new-payment', {
                                userId: findUser._id,
                                amount: processedAmount,
                                date: new Date(),
                                typePayment: 'MOMO',
                            });
                        }
                    });
                }
                await modelRechargeUser.create({
                    userId: findUser._id,
                    amount: processedAmount,
                    typePayment: 'MOMO',
                    status: 'success',
                });
                
                // Kiểm tra xem request có phải từ WebView không
                const userAgent = req.headers['user-agent'] || '';
                const isWebView = userAgent.includes('Mobile') || userAgent.includes('WebView') || userAgent.includes('wv') || userAgent.includes('iPhone') || userAgent.includes('Android');
                
                if (isWebView) {
                    // Gửi tín hiệu đến WebView để đóng và quay về app
                    const closeHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Thanh toán thành công</title>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                        </head>
                        <body>
                            <script>
                                // Gửi tín hiệu thành công đến app ngay lập tức
                                if (window.ReactNativeWebView) {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'PAYMENT_SUCCESS',
                                        amount: ${processedAmount}
                                    }));
                                }
                                // Đóng cửa sổ WebView
                                setTimeout(() => {
                                    window.close();
                                }, 500);
                            </script>
                        </body>
                        </html>
                    `;
                    return res.send(closeHtml);
                } else {
                    // Nếu từ browser thông thường, redirect về trang recharge
                    return res.redirect(`http://localhost:5173/trang-ca-nhan?payment=success&amount=${processedAmount}&type=MOMO`);
                }
            }
        } else {
            // Xử lý thanh toán thất bại
            const errorMessage = resultCode === '10' ? 'Giao dịch bị hủy bởi người dùng' : 
                               resultCode === '11' ? 'Giao dịch thất bại do số dư không đủ' : 
                               resultCode === '12' ? 'Giao dịch bị từ chối do rủi ro' : 
                               'Giao dịch thất bại';
                               
            // Kiểm tra xem request có phải từ WebView không
            const userAgent = req.headers['user-agent'] || '';
            const isWebView = userAgent.includes('Mobile') || userAgent.includes('WebView') || userAgent.includes('wv') || userAgent.includes('iPhone') || userAgent.includes('Android');
            
            if (isWebView) {
                // Gửi tín hiệu thất bại đến WebView và đóng ngay
                const failureCloseHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Thanh toán thất bại</title>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body>
                        <script>
                            // Gửi tín hiệu thất bại đến app ngay lập tức
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'PAYMENT_FAILURE',
                                    message: '${errorMessage}'
                                }));
                            }
                            // Đóng cửa sổ WebView
                            setTimeout(() => {
                                window.close();
                            }, 500);
                        </script>
                    </body>
                    </html>
                `;
                return res.status(400).send(failureCloseHtml);
            } else {
                // Nếu từ browser thông thường
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }
        }
    }

    async checkPaymentVnpay(req, res) {
        console.log('VNPay callback received:', req.query); // Thêm log để debug
        console.log('User Agent:', req.headers['user-agent']); // Log user agent
        
        const result = await vnpayService.handlePaymentReturn(req.query);
        
        // Kiểm tra xem request có phải từ WebView không
        const userAgent = req.headers['user-agent'] || '';
        const isWebView = userAgent.includes('Mobile') || userAgent.includes('WebView') || userAgent.includes('wv') || userAgent.includes('iPhone') || userAgent.includes('Android');
        
        console.log('Is WebView request:', isWebView);
        console.log('Payment result:', result);
        
        if (result.success) {
            console.log('Payment successful:', result.amount); // Log thành công

            if (isWebView) {
                // Gửi tín hiệu đến WebView để đóng và quay về app
                const closeHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Thanh toán thành công</title>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body>
                        <script>
                            // Gửi tín hiệu thành công đến app ngay lập tức
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'PAYMENT_SUCCESS',
                                    amount: ${result.amount}
                                }));
                            }
                            // Đóng cửa sổ WebView
                            setTimeout(() => {
                                window.close();
                            }, 500);
                        </script>
                    </body>
                    </html>
                `;
                return res.send(closeHtml);
            } else {
                // Nếu từ browser thông thường, redirect về trang recharge
                return res.redirect(`http://localhost:5173/trang-ca-nhan?payment=success&amount=${result.amount}&type=VNPAY`);
            }
        } else {
            console.log('Payment failed:', result.message); // Log thất bại

            if (isWebView) {
                // Gửi tín hiệu thất bại đến WebView và đóng ngay
                const failureCloseHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Thanh toán thất bại</title>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body>
                        <script>
                            // Gửi tín hiệu thất bại đến app ngay lập tức
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'PAYMENT_FAILURE',
                                    message: '${result.message}'
                                }));
                            }
                            // Đóng cửa sổ WebView
                            setTimeout(() => {
                                window.close();
                            }, 500);
                        </script>
                    </body>
                    </html>
                `;
                return res.status(400).send(failureCloseHtml);
            } else {
                // Nếu từ browser thông thường
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        }
    }
}
module.exports = new PaymentsController();
