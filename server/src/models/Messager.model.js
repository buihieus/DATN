const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelMessager = new Schema(
    {
        senderId: { type: String, require: true, ref: 'user' },
        receiverId: { type: String, require: true, ref: 'user' },
        message: { type: String, require: true },
        status: { type: String, require: true },
        isRead: { type: Boolean, require: true, default: false },
    },
    {
        timestamps: true,
    },
);

// Check if model already exists to prevent OverwriteModelError in development
if (mongoose.models.messager) {
    module.exports = mongoose.models.messager;
} else {
    module.exports = mongoose.model('messager', modelMessager);
}
