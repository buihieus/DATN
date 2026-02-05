const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  Type: { type: String },                // "ward"
  Code: { type: String, required: true },
  Name: { type: String, required: true },
  NameEn: { type: String },
  FullName: { type: String },
  FullNameEn: { type: String },
  CodeName: { type: String },
  ProvinceCode: { type: String },
  AdministrativeUnitId: { type: Number }
}, { _id: false }); // không cần _id riêng cho mỗi ward

const provinceSchema = new mongoose.Schema({
  Type: { type: String },                // "province"
  Code: { type: String, required: true },
  Name: { type: String, required: true },
  NameEn: { type: String },
  FullName: { type: String },
  FullNameEn: { type: String },
  CodeName: { type: String },
  AdministrativeUnitId: { type: Number },
  Wards: [wardSchema]                    // mảng ward
}, {
  collection: 'vn-units'  // Changed to match the collection name in MongoDB Atlas
});

// Check if model already exists to prevent OverwriteModelError in development
if (mongoose.models.Province) {
    module.exports = mongoose.models.Province;
} else {
    module.exports = mongoose.model('Province', provinceSchema);
}