const mongoose = require('mongoose');
const modelPost = require('./src/models/post.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phongtro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Test search function
async function testSearch(keyword) {
  try {
    console.log(`Searching for keyword: "${keyword}"`);
    
    // Create a case-insensitive regex pattern for the keyword
    const searchRegex = new RegExp(keyword, 'i');
    
    // Search in the post collection across the required fields
    const posts = await modelPost.find({
      $or: [
        { 'title': { $regex: searchRegex } },                    // Search in title
        { 'address.provinceCode': { $regex: searchRegex } },     // Search in province
        { 'address.wardCode': { $regex: searchRegex } },         // Search in ward
        { 'address.street': { $regex: searchRegex } },           // Search in street/address detail
        { 'address.fullAddress': { $regex: searchRegex } },      // Search in full address
        { 'location': { $regex: searchRegex } }                  // Search in legacy location field
      ]
    });
    
    console.log(`Found ${posts.length} results:`);
    posts.forEach((post, index) => {
      console.log(`${index + 1}. Title: ${post.title}`);
      console.log(`   Province: ${post.address?.provinceCode}`);
      console.log(`   Ward: ${post.address?.wardCode}`);
      console.log(`   Full Address: ${post.address?.fullAddress}`);
      console.log(`   Location: ${post.location}`);
      console.log('---');
    });
    
    return posts;
  } catch (error) {
    console.error('Error during search:', error);
    return [];
  } finally {
    mongoose.connection.close();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  const keyword = process.argv[2] || 'cau-giay'; // Default to 'cau-giay' if no argument provided
  testSearch(keyword);
}

module.exports = testSearch;