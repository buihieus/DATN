import React from 'react';
import './Footer.scss';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>PhongTro123</h3>
                    <p>Kênh thông tin phòng trọ số 1 Việt Nam</p>
                </div>
                
                <div className="footer-section">
                    <h4>Dịch vụ</h4>
                    <ul>
                        <li>Cho thuê phòng trọ</li>
                        <li>Nhà trọ, căn hộ</li>
                        <li>Tìm người ở ghép</li>
                        <li>Cho thuê văn phòng</li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h4>Hỗ trợ</h4>
                    <ul>
                        <li>Trung tâm trợ giúp</li>
                        <li>Quy định đăng tin</li>
                        <li>Quy định giao dịch</li>
                        <li>Liên hệ</li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h4>Liên hệ</h4>
                    <ul>
                        <li>Email: info@phongtro123.com</li>
                        <li>Hotline: 1900 123 123</li>
                        <li>Địa chỉ: Hà Nội, Việt Nam</li>
                    </ul>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {currentYear} PhongTro123. Tất cả các quyền được bảo lưu.</p>
            </div>
        </footer>
    );
}

export default Footer;