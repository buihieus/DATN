const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelFavourite = new Schema(
    {
        userId: { type: String, required: true, ref: 'user' },
        postId: { type: String, required: true, ref: 'post' },
    },
    {
        timestamps: true,
    },
);

// Add unique index to prevent duplicate favorites
modelFavourite.index({ userId: 1, postId: 1 }, { unique: true });

// Check if model already exists to prevent OverwriteModelError in development
if (mongoose.models.favourite) {
    module.exports = mongoose.models.favourite;
} else {
    module.exports = mongoose.model('favourite', modelFavourite);
}
