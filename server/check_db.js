/**
 * Script để kiểm tra dữ liệu trong DB
 */
const mongoose = require('mongoose');

// Kết nối tới MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phongtro';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const modelPost = require('./src/models/post.model');

// Hàm chuyển đổi không dấu
const removeAccents = (str) => {
    if (!str) return str;
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

async function checkData() {
  try {
    console.log('Tổng số bài đăng trong DB:', await modelPost.countDocuments());
    
    // Lấy một số bài đăng mẫu để xem cấu trúc
    console.log('\n--- Một số bài đăng mẫu ---');
    const samplePosts = await modelPost.find().limit(5).lean();
    samplePosts.forEach((post, index) => {
      console.log(`${index + 1}. Title: ${post.title}`);
      console.log(`   Address: ${JSON.stringify(post.address)}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Location: ${post.location}`);
      console.log('---');
    });
    
    // Kiểm tra các từ khóa cụ thể
    console.log('\n--- Kiểm tra từ khóa "Tây Mỗ" ---');
    const westMoCount = await modelPost.countDocuments({
      $or: [
        { 'title': { $regex: /Tây Mỗ|Tay Mo/i } },
        { 'address.provinceCode': { $regex: /Tây Mỗ|Tay Mo/i } },
        { 'address.wardCode': { $regex: /Tây Mỗ|Tay Mo/i } },
        { 'address.street': { $regex: /Tây Mỗ|Tay Mo/i } },
        { 'address.fullAddress': { $regex: /Tây Mỗ|Tay Mo/i } },
        { 'location': { $regex: /Tây Mỗ|Tay Mo/i } }
      ],
      'status': 'active'
    });
    console.log('Số bài đăng chứa "Tây Mỗ" (active):', westMoCount);
    
    console.log('\n--- Kiểm tra từ khóa "Hà Nội" ---');
    const haNoiCount = await modelPost.countDocuments({
      $or: [
        { 'title': { $regex: /Hà Nội|Ha Noi/i } },
        { 'address.provinceCode': { $regex: /Hà Nội|Ha Noi/i } },
        { 'address.wardCode': { $regex: /Hà Nội|Ha Noi/i } },
        { 'address.street': { $regex: /Hà Nội|Ha Noi/i } },
        { 'address.fullAddress': { $regex: /Hà Nội|Ha Noi/i } },
        { 'location': { $regex: /Hà Nội|Ha Noi/i } }
      ],
      'status': 'active'
    });
    console.log('Số bài đăng chứa "Hà Nội" (active):', haNoiCount);
    
    console.log('\n--- Kiểm tra từ khóa "Do Nha" ---');
    const doNhaCount = await modelPost.countDocuments({
      $or: [
        { 'title': { $regex: /Do Nha/i } },
        { 'address.provinceCode': { $regex: /Do Nha/i } },
        { 'address.wardCode': { $regex: /Do Nha/i } },
        { 'address.street': { $regex: /Do Nha/i } },
        { 'address.fullAddress': { $regex: /Do Nha/i } },
        { 'location': { $regex: /Do Nha/i } }
      ],
      'status': 'active'
    });
    console.log('Số bài đăng chứa "Do Nha" (active):', doNhaCount);
    
    // Nếu có bài đăng chứa "Do Nha", lấy một vài mẫu để xem
    if (doNhaCount > 0) {
      console.log('\n--- Mẫu bài đăng chứa "Do Nha" ---');
      const doNhaPosts = await modelPost.find({
        $or: [
          { 'title': { $regex: /Do Nha/i } },
          { 'address.street': { $regex: /Do Nha/i } },
          { 'address.fullAddress': { $regex: /Do Nha/i } }
        ],
        'status': 'active'
      }).limit(3).lean();
      
      doNhaPosts.forEach((post, index) => {
        console.log(`${index + 1}. Title: ${post.title}`);
        console.log(`   Full Address: ${post.address?.fullAddress}`);
        console.log(`   Street: ${post.address?.street}`);
        console.log(`   Status: ${post.status}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Lỗi khi kiểm tra dữ liệu:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  checkData();
}

module.exports = checkData;