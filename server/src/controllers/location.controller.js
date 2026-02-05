const mongoose = require('mongoose');
const Province = require('../models/province.model');

// Mapping between filter values and actual data values
const OPTIONS_MAP = {
  'day-du-noi-that': 'Đầy đủ nội thất',
  'co-may-lanh': 'Có máy lạnh',
  'co-gac': 'Có gác',
  'co-ke-bep': 'Có kệ bếp',
  'co-tu-lanh': 'Có tủ lạnh',
  'co-may-giat': 'Có máy giặt',
  'co-thang-may': 'Có thang máy',
  'khong-chung-chu': 'Không chung chủ',
  'gio-giac-tu-do': 'Giờ giấc tự do',
  'co-bao-ve': 'Có bảo vệ 24/24',
  'co-ham-de-xe': 'Có hầm để xe',
  'co-ban-cong': 'Có ban công',
  'co-noi-that': 'Có nội thất',
  'co-an-ninh': 'Có an ninh'
};

class LocationController {
  // Method to get locations from MongoDB - Fixed to handle the specific data structure with nested wards
  async getLocations(req, res) {
    try {
      const { province, district } = req.query;
      console.log('getLocations called with params:', { province, district }); // Debug log

      if (province) {
        console.log('Searching for province with code:', province); // Debug log

        // Find province by Code field, ensuring we get the Wards array
        // Try multiple approaches in case the Type field is not consistently set
        let provinceData = await Province.findOne({ Code: province, Type: "province" }).lean();

        if (!provinceData) {
          // Fallback: try without Type filter
          provinceData = await Province.findOne({ Code: province }).lean();
        }

        if (!provinceData) {
          console.log('Province not found with code:', province); // Debug log
          return res.status(404).json({ message: 'Không tìm thấy tỉnh/thành phố' });
        }

        console.log('Province found:', provinceData.Name || provinceData._id); // Debug log

        // Return wards for the province (wards are stored in the Wards array within province document)
        const wards = Array.isArray(provinceData.Wards) ? provinceData.Wards : [];

        console.log(`Raw wards data from DB: ${wards.length} items`); // Debug log

        // Format wards to match expected response structure
        const formattedWards = wards.map(ward => {
          const formattedWard = {
            Code: ward.Code,
            Name: ward.Name,
            FullName: ward.FullName,
            Type: ward.Type,
            ProvinceCode: ward.ProvinceCode || provinceData.Code  // Use province code if not set in ward
          };
          console.log(`Formatted ward: ${formattedWard.Code} - ${formattedWard.Name}`); // Debug log
          return formattedWard;
        });

        console.log('Number of wards found and formatted:', formattedWards.length); // Debug log

        return res.status(200).json({
          message: 'Lấy dữ liệu phường/xã thành công',
          metadata: {
            wards: formattedWards
          }
        });
      } else {
        console.log('Fetching all provinces'); // Debug log

        // Get all provinces with basic information
        // Try with Type: "province" first, then fallback to all records
        let provinces = await Province.find(
          { Type: "province" },
          { Code: 1, Name: 1, FullName: 1, Type: 1 }
        ).lean();

        // If no provinces found with Type: "province", try to get all records
        if (provinces.length === 0) {
          console.log('No provinces found with Type: "province", trying all records');
          provinces = await Province.find(
            {},
            { Code: 1, Name: 1, FullName: 1, Type: 1 }
          ).lean();

          // Filter to only include documents that look like provinces (have Code and Name)
          provinces = provinces.filter(p => p.Code && p.Name);
        }

        console.log('Number of provinces found:', provinces.length); // Debug log

        return res.status(200).json({
          message: 'Lấy dữ liệu tỉnh/thành phố thành công',
          metadata: {
            provinces: provinces
          }
        });
      }
    } catch (error) {
      console.error('Error in getLocations:', error);
      return res.status(500).json({ message: 'Lỗi khi lấy dữ liệu địa điểm', error: error.message });
    }
  }

  // Method to filter posts based on location and other criteria
  async filterPosts(req, res) {
    try {
      const {
        category,
        province,
        district,
        ward,
        price,
        area,
        options
      } = req.body;

      console.log('FilterPosts called with params:', req.body); // Debug log

      // Build query filter
      const currentDate = new Date();
      let filter = {
        status: 'active',
        endDate: { $gte: currentDate } // Chỉ lấy bài đăng chưa hết hạn
      }; // Only active posts

      // Category filter
      if (category && category !== '') {
        filter.category = category;
      }

      // Location filter - need to determine how location is stored in the post
      // The location field might contain the exact string or be part of a larger address
      if (province || district || ward) {
        // Build search terms
        const locationTerms = [];
        if (ward) locationTerms.push(ward);
        if (district) locationTerms.push(district);
        if (province) locationTerms.push(province);

        if (locationTerms.length > 0) {
          const locationPattern = locationTerms.join('|');
          filter.location = { $regex: new RegExp(locationPattern, 'i') };
        }
      }

      // Price filter
      if (price && price !== '') {
        const priceConditions = {
          'duoi-1-trieu': { $lt: 1000000 },
          'tu-1-2-trieu': { $gte: 1000000, $lt: 2000000 },
          'tu-2-3-trieu': { $gte: 2000000, $lt: 3000000 },
          'tu-3-5-trieu': { $gte: 3000000, $lt: 5000000 },
          'tu-5-7-trieu': { $gte: 5000000, $lt: 7000000 },
          'tu-7-10-trieu': { $gte: 7000000, $lt: 10000000 },
          'tu-10-15-trieu': { $gte: 10000000, $lt: 15000000 },
          'tren-15-trieu': { $gte: 15000000 },
        };
        if (priceConditions[price]) {
          filter.price = priceConditions[price];
        }
      }

      // Area filter
      if (area && area !== '') {
        const areaConditions = {
          'duoi-20': { $lt: 20 },
          'tu-20-30': { $gte: 20, $lt: 30 },
          'tu-30-50': { $gte: 30, $lt: 50 },
          'tu-50-70': { $gte: 50, $lt: 70 },
          'tu-70-90': { $gte: 70, $lt: 90 },
          'tren-90': { $gte: 90 },
        };
        if (areaConditions[area]) {
          filter.area = areaConditions[area];
        }
      }

      console.log('Filter before options:', JSON.stringify(filter, null, 2)); // Debug log

      // Options filter - The options field in the post model is of type mongoose.Schema.Types.Mixed
      // We'll use a more flexible approach that handles the actual data structure
      let posts;
      if (options && Array.isArray(options) && options.length > 0) {
        console.log('Processing options filter:', options); // Debug log

        // Map filter options to actual data values
        const mappedOptions = options.map(option => OPTIONS_MAP[option] || option);
        console.log('Mapped options:', mappedOptions); // Debug log

        // This approach checks if options field contains all the mapped options
        // It will work for array formats in the database
        const Post = require('../models/post.model');

        // First, find posts matching all other criteria (without options filter)
        const basePosts = await Post.find(filter).select('_id options').lean();
        console.log(`Found ${basePosts.length} posts before options filter`); // Debug log

        // Then filter these posts to only include ones that have all selected options
        const filteredPostIds = basePosts.filter(post => {
          console.log('Checking post options:', post.options); // Debug log
          // Handle different possible formats of the options field
          if (Array.isArray(post.options)) {
            // If options is an array, check if ALL mapped selected options are present in the array
            const result = mappedOptions.every(mappedOption => {
              const isIncluded = post.options.includes(mappedOption);
              console.log(`Mapped option "${mappedOption}" in post options:`, isIncluded);
              return isIncluded;
            });
            console.log('Array-based check result:', result);
            return result;
          } else if (typeof post.options === 'object' && post.options !== null && !Array.isArray(post.options)) {
            // If options is an object, check if all selected options have truthy values
            const result = mappedOptions.every(mappedOption => {
              const value = post.options[mappedOption];
              console.log(`Option ${mappedOption} has value:`, value, 'Truthy:', value !== undefined && value !== false && value !== null && value !== "");
              return value !== undefined && value !== false && value !== null && value !== "";
            });
            console.log('Object-based check result:', result);
            return result;
          }
          console.log('Post options format is neither object nor array');
          return false; // If options is neither an object nor an array, exclude the post
        }).map(post => post._id);

        console.log(`Filtered down to ${filteredPostIds.length} posts after options check`); // Debug log

        // Get the full posts data for only the filtered IDs
        if (filteredPostIds.length > 0) {
          posts = await Post.find({
            _id: { $in: filteredPostIds },
            ...filter // Include all other filter conditions
          }).sort({ createdAt: -1 });
        } else {
          // If no posts matched the options filter, return empty result
          posts = [];
        }
      } else {
        console.log('No options filter applied'); // Debug log
        // If no options filter, just apply the original filter
        const Post = require('../models/post.model');
        posts = await Post.find(filter).sort({ createdAt: -1 });
      }

      console.log('Final filter applied:', JSON.stringify(filter, null, 2)); // Debug log

      // Run a count query to see how many documents match the criteria
      const postCount = posts.length;
      console.log(`Found ${postCount} posts matching the filter criteria`);

      console.log(`Retrieved ${posts.length} posts from database`); // Debug log

      return res.status(200).json({
        message: 'Lọc bài đăng thành công',
        metadata: posts
      });
    } catch (error) {
      console.error('Error in filterPosts:', error);
      return res.status(500).json({ message: 'Lỗi khi lọc bài đăng', error: error.message });
    }
  }
}

module.exports = new LocationController();