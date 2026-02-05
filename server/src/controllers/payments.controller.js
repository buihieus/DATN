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
                    // Gửi một trang HTML đơn giản để thông báo cho WebView biết thanh toán thành công
                    const successHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Thanh toán thành công</title>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <style>
                                body { 
                                    font-family: Arial, sans-serif; 
                                    display: flex; 
                                    justify-content: center; 
                                    align-items: center; 
                                    height: 100vh; 
                                    margin: 0; 
                                    background-color: #f0f8f0; 
                                    color: #2e7d32;
                                }
                                .container {
                                    text-align: center;
                                    padding: 30px;
                                    border-radius: 10px;
                                    background-color: white;
                                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                                }
                                .success-icon {
                                    font-size: 60px;
                                    margin-bottom: 20px;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="success-icon">✓</div>
                                <h1>Thanh toán thành công!</h1>
                                <p>Số tiền: ${processedAmount.toLocaleString('vi-VN')}₫</p>
                                <p>Vui lòng quay lại ứng dụng...</p>
                                <p id="timer">3</p>
                            </div>
                            <script>
                                // Đếm ngược và gửi tín hiệu đến ứng dụng mobile
                                let count = 3;
                                const timerElement = document.getElementById('timer');
                                
                                // Gửi tín hiệu đến ứng dụng mobile ngay lập tức
                                if (window.ReactNativeWebView) {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'PAYMENT_SUCCESS',
                                        amount: ${processedAmount}
                                    }));
                                } else {
                                    // Nếu không phải là WebView, gửi tín hiệu qua custom protocol
                                    try {
                                        window.location.href = 'myapp://payment-success?amount=${processedAmount}';
                                    } catch(e) {
                                        console.log('Could not redirect to app');
                                    }
                                }
                                
                                const countdown = setInterval(function() {
                                    count--;
                                    if (timerElement) timerElement.textContent = count;
                                    
                                    if (count <= 0) {
                                        clearInterval(countdown);
                                        // Đóng cửa sổ nếu không thể quay lại ứng dụng
                                        try {
                                            window.close();
                                        } catch(e) {
                                            console.log('Could not close window');
                                        }
                                    }
                                }, 1000);
                            </script>
                        </body>
                        </html>
                    `;
                    return res.send(successHtml);
                } else {
                    // Nếu từ browser thông thường, redirect về trang cá nhân
                    return res.redirect(`http://localhost:5173/trang-ca-nhan`);
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
                // Gửi một trang HTML đơn giản để thông báo cho WebView biết thanh toán thất bại
                const failureHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Thanh toán thất bại</title>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                display: flex; 
                                justify-content: center; 
                                align-items: center; 
                                height: 100vh; 
                                margin: 0; 
                                background-color: #fff8f8; 
                                color: #c62828;
                            }
                            .container {
                                text-align: center;
                                padding: 30px;
                                border-radius: 10px;
                                background-color: white;
                                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                            }
                            .error-icon {
                                font-size: 60px;
                                margin-bottom: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="error-icon">✕</div>
                            <h1>Thanh toán thất bại</h1>
                            <p>Lý do: ${errorMessage}</p>
                            <p>Vui lòng quay lại ứng dụng...</p>
                            <p id="timer">3</p>
                        </div>
                        <script>
                            // Đếm ngược và gửi tín hiệu đến ứng dụng mobile
                            let count = 3;
                            const timerElement = document.getElementById('timer');
                            
                            // Gửi tín hiệu đến ứng dụng mobile ngay lập tức
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'PAYMENT_FAILURE',
                                    message: '${errorMessage}'
                                }));
                            } else {
                                // Nếu không phải là WebView, gửi tín hiệu qua custom protocol
                                try {
                                    window.location.href = 'myapp://payment-failure?message=${encodeURIComponent(errorMessage)}';
                                } catch(e) {
                                    console.log('Could not redirect to app');
                                }
                            }
                            
                            const countdown = setInterval(function() {
                                count--;
                                if (timerElement) timerElement.textContent = count;
                                
                                if (count <= 0) {
                                    clearInterval(countdown);
                                    // Đóng cửa sổ nếu không thể quay lại ứng dụng
                                    try {
                                        window.close();
                                    } catch(e) {
                                        console.log('Could not close window');
                                    }
                                }
                            }, 1000);
                        </script>
                    </body>
                    </html>
                `;
                return res.status(400).send(failureHtml);
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
            
            // Gửi một trang HTML đơn giản để thông báo cho WebView biết thanh toán thành công
            const successHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Thanh toán thành công</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh; 
                            margin: 0; 
                            background-color: #f0f8f0; 
                            color: #2e7d32;
                        }
                        .container {
                            text-align: center;
                            padding: 30px;
                            border-radius: 10px;
                            background-color: white;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        }
                        .success-icon {
                            font-size: 60px;
                            margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="success-icon">✓</div>
                        <h1>Thanh toán thành công!</h1>
                        <p>Số tiền: ${result.amount.toLocaleString('vi-VN')}₫</p>
                        <p>Vui lòng quay lại ứng dụng...</p>
                        <p id="timer">3</p>
                    </div>
                    <script>
                        // Đếm ngược và gửi tín hiệu đến ứng dụng mobile
                        let count = 3;
                        const timerElement = document.getElementById('timer');
                        
                        // Gửi tín hiệu đến ứng dụng mobile ngay lập tức
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'PAYMENT_SUCCESS',
                                amount: ${result.amount}
                            }));
                        } else {
                            // Nếu không phải là WebView, gửi tín hiệu qua custom protocol
                            try {
                                window.location.href = 'myapp://payment-success?amount=${result.amount}';
                            } catch(e) {
                                console.log('Could not redirect to app');
                            }
                        }
                        
                        const countdown = setInterval(function() {
                            count--;
                            if (timerElement) timerElement.textContent = count;
                            
                            if (count <= 0) {
                                clearInterval(countdown);
                                // Đóng cửa sổ nếu không thể quay lại ứng dụng
                                try {
                                    window.close();
                                } catch(e) {
                                    console.log('Could not close window');
                                }
                            }
                        }, 1000);
                    </script>
                </body>
                </html>
            `;
            
            // Trả về HTML cho cả WebView và browser thông thường
            res.send(successHtml);
        } else {
            console.log('Payment failed:', result.message); // Log thất bại
            
            // Gửi một trang HTML đơn giản để thông báo cho WebView biết thanh toán thất bại
            const failureHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Thanh toán thất bại</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh; 
                            margin: 0; 
                            background-color: #fff8f8; 
                            color: #c62828;
                        }
                        .container {
                            text-align: center;
                            padding: 30px;
                            border-radius: 10px;
                            background-color: white;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        }
                        .error-icon {
                            font-size: 60px;
                            margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">✕</div>
                        <h1>Thanh toán thất bại</h1>
                        <p>Lý do: ${result.message}</p>
                        <p>Vui lòng quay lại ứng dụng...</p>
                        <p id="timer">3</p>
                    </div>
                    <script>
                        // Đếm ngược và gửi tín hiệu đến ứng dụng mobile
                        let count = 3;
                        const timerElement = document.getElementById('timer');
                        
                        // Gửi tín hiệu đến ứng dụng mobile ngay lập tức
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'PAYMENT_FAILURE',
                                message: '${result.message}'
                            }));
                        } else {
                            // Nếu không phải là WebView, gửi tín hiệu qua custom protocol
                            try {
                                window.location.href = 'myapp://payment-failure?message=${encodeURIComponent(result.message)}';
                            } catch(e) {
                                console.log('Could not redirect to app');
                            }
                        }
                        
                        const countdown = setInterval(function() {
                            count--;
                            if (timerElement) timerElement.textContent = count;
                            
                            if (count <= 0) {
                                clearInterval(countdown);
                                // Đóng cửa sổ nếu không thể quay lại ứng dụng
                                try {
                                    window.close();
                                } catch(e) {
                                    console.log('Could not close window');
                                }
                            }
                        }, 1000);
                    </script>
                </body>
                </html>
            `;
            
            // Trả về HTML cho cả WebView và browser thông thường
            res.status(400).send(failureHtml);
        }
    }
}
module.exports = new PaymentsController();
