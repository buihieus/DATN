const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelApiKey = new Schema(
    {
        userId: { type: String, require: true, ref: 'user' },
        publicKey: { type: String, require: true },
        privateKey: { type: String, require: true },
    },
    {
        timestamps: true,
    },
);

// Check if model already exists to prevent OverwriteModelError in development
if (mongoose.models.apikey) {
    module.exports = mongoose.models.apikey;
} else {
    module.exports = mongoose.model('apikey', modelApiKey);
}
