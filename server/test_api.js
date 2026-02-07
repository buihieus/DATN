/**
 * Test script để kiểm tra API tìm kiếm
 * Cách chạy: node test_api.js "từ khóa tìm kiếm"
 */

const axios = require('axios');

// URL của API (cập nhật nếu cần)
const API_BASE_URL = 'http://192.168.109.1:3000'; // Sử dụng URL từ apiConstants.ts

async function testSearchAPI(keyword) {
  try {
    console.log(`Đang test API tìm kiếm với từ khóa: "${keyword}"`);
    
    // Gọi API tìm kiếm
    const response = await axios.get(`${API_BASE_URL}/api/search?keyword=${encodeURIComponent(keyword)}`);
    
    console.log('Trạng thái phản hồi:', response.status);
    console.log('Dữ liệu phản hồi:');
    console.log('- Message:', response.data.message);
    console.log('- Metadata (số lượng kết quả):', response.data.metadata?.length || 0);
    
    if (response.data.metadata && response.data.metadata.length > 0) {
      console.log('\nMột số kết quả đầu tiên:');
      response.data.metadata.slice(0, 3).forEach((post, index) => {
        console.log(`${index + 1}. Title: ${post.title}`);
        console.log(`   Province: ${post.address?.provinceCode}`);
        console.log(`   Ward: ${post.address?.wardCode}`);
        console.log(`   Full Address: ${post.address?.fullAddress}`);
        console.log(`   Location: ${post.location}`);
        console.log('---');
      });
    } else {
      console.log('Không tìm thấy kết quả nào.');
    }
  } catch (error) {
    console.error('Lỗi khi gọi API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Chạy test nếu file được thực thi trực tiếp
if (require.main === module) {
  const keyword = process.argv[2] || 'cau-giay'; // Từ khóa mặc định nếu không có tham số
  testSearchAPI(keyword);
}

module.exports = testSearchAPI;