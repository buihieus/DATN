const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelPost = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        images: {
            type: Array,
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['phong-tro', 'nha-nguyen-can', 'can-ho-chung-cu', 'can-ho-mini', "o-ghep"],
        },
        address: {
            type: {
                provinceCode: {
                    type: String, // Mã Tỉnh/Thành phố
                    required: true,
                    index: true,
                },
                wardCode: {
                    type: String, // Mã Phường/Xã
                    required: true,
                    index: true,
                },
                street: {
                    type: String, // Số nhà và tên đường (ví dụ: "19 Ngõ Quan Thổ 1")
                    required: true,
                },
                fullAddress: {
                    type: String, // Địa chỉ đầy đủ (dạng chuỗi tự động tạo)
                    required: true,
                },
                coordinates: { // Tọa độ chỉ lưu nếu cần thiết cho bản đồ, không bắt buộc
                    type: {
                        lat: { type: Number }, // Vĩ độ, không bắt buộc
                        lng: { type: Number }, // Kinh độ, không bắt buộc
                    },
                },
            },
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        area: {
            type: Number,
            required: true,
        },
        options: {
            // type: mongoose.Schema.Types.Mixed,
            // required: true,
            // Nên là Array of Strings để sử dụng $all và Index hiệu quả
            type: [String],
            required: true,
            index: true, // Thêm index cho lọc tiện nghi
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'inactive', 'cancel', 'expired'],
        },
        typeNews: {
            type: String,
            required: true,
            enum: ['vip', 'normal'],
            default: 'normal'  // Mặc định là 'normal'
        },
        endDate: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

// Check if model already exists to prevent OverwriteModelError in development
if (mongoose.models.posts) {
    module.exports = mongoose.models.posts;
} else {
    module.exports = mongoose.model('posts', modelPost);
}
