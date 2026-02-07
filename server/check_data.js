/**
 * Script để kiểm tra dữ liệu mẫu trong DB
 */
const mongoose = require('mongoose');

// Kết nối tới MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phongtro';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const modelPost = require('./src/models/post.model');

async function checkSampleData() {
  try {
    console.log('Đang lấy mẫu dữ liệu từ DB...');
    
    // Lấy 5 bài đăng đầu tiên để xem cấu trúc
    const samplePosts = await modelPost.find().limit(5).lean();
    
    console.log('Số lượng bài đăng trong DB:', await modelPost.countDocuments());
    console.log('\nMột số bài đăng mẫu:');
    
    samplePosts.forEach((post, index) => {
      console.log(`${index + 1}. Title: ${post.title}`);
      console.log(`   Address:`, post.address);
      console.log(`   Location (legacy): ${post.location}`);
      console.log('---');
    });
    
    // Kiểm tra xem có bài đăng nào chứa "ba dinh", "Ba Đình", v.v. không
    console.log('\nĐang kiểm tra các từ khóa đặc biệt...');
    
    const testKeywords = ['ba dinh', 'Ba Đình', 'phu luong', 'Phú Lương', 'cau giay', 'Cầu Giấy'];
    
    for (const keyword of testKeywords) {
      const regex = new RegExp(keyword, 'i');
      const count = await modelPost.countDocuments({
        $or: [
          { 'title': { $regex: regex } },
          { 'address.provinceCode': { $regex: regex } },
          { 'address.wardCode': { $regex: regex } },
          { 'address.street': { $regex: regex } },
          { 'address.fullAddress': { $regex: regex } },
          { 'location': { $regex: regex } }
        ]
      });
      
      console.log(`- Số bài đăng chứa "${keyword}": ${count}`);
    }
    
  } catch (error) {
    console.error('Lỗi khi kiểm tra dữ liệu:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  checkSampleData();
}

module.exports = checkSampleData;