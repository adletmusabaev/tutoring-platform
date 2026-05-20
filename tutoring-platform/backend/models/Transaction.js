const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    subject: {
        type: String,
        default: ''
    },
    paypalOrderId: {
        type: String,
        required: true
    },
    paypalCaptureId: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'refunded'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
