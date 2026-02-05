const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const keyWordSearch = new Schema(
    {
        title: { type: String, require: true },
        count: { type: Number, require: true, default: 0 },
    },
    {
        timestamps: true,
    },
);

// Check if model already exists to prevent OverwriteModelError in development
if (mongoose.models.keyWordSearch) {
    module.exports = mongoose.models.keyWordSearch;
} else {
    module.exports = mongoose.model('keyWordSearch', keyWordSearch);
}
