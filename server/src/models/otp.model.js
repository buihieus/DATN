const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelOtp = new Schema(
    {
        email: { type: String, require: true, ref: 'user' },
        otp: { type: String, require: true },
        time: { type: Date, default: Date.now(), index: { expires: 300 } },
        type: { type: String, enum: ['forgotPassword', 'verifyAccount'], require: true },
    },
    {
        timestamps: true,
    },
);

// Check if model already exists to prevent OverwriteModelError in development
if (mongoose.models.otp) {
    module.exports = mongoose.models.otp;
} else {
    module.exports = mongoose.model('otp', modelOtp);
}
