const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// PayPal Environment Setup
function paypalClient() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    let environment;
    if (process.env.PAYPAL_MODE === 'live') {
        environment = new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
    } else {
        environment = new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
    }
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment);
}

// POST /api/payments/create-order
// Create a PayPal order for a booking
const createOrder = async (req, res) => {
    try {
        const { teacherId, subject, startTime, endTime, notes } = req.body;

        if (!teacherId || !subject || !startTime || !endTime) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
            return res.status(400).json({ error: 'Start time must be before end time' });
        }

        // Get teacher's hourlyRate to calculate price
        const teacher = await User.findById(teacherId).select('hourlyRate name');
        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Calculate price: hourlyRate × duration in hours
        const durationMs = end - start;
        const durationHours = durationMs / (1000 * 60 * 60);
        const price = Math.round(teacher.hourlyRate * durationHours * 100) / 100;

        if (price <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        // Create PayPal order
        const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: price.toFixed(2)
                },
                description: `Tutoring lesson: ${subject} with ${teacher.name}`
            }],
            application_context: {
                brand_name: 'TutoringPlatform',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW'
            }
        });

        const client = paypalClient();
        const order = await client.execute(request);

        res.json({
            orderId: order.result.id,
            price,
            status: order.result.status
        });
    } catch (error) {
        console.error('PayPal create order error:', error);
        res.status(500).json({ error: 'Failed to create PayPal order' });
    }
};

// POST /api/payments/capture-order
// Capture payment and create the booking + transaction
const captureOrder = async (req, res) => {
    try {
        const { orderId, teacherId, subject, startTime, endTime, notes, price } = req.body;

        if (!orderId || !teacherId || !subject || !startTime || !endTime) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Capture the PayPal payment
        const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        const client = paypalClient();
        const capture = await client.execute(request);

        if (capture.result.status !== 'COMPLETED') {
            return res.status(400).json({ error: 'Payment was not completed' });
        }

        const captureId = capture.result.purchase_units[0].payments.captures[0].id;

        // Create the booking with paid status
        const booking = new Booking({
            studentId: req.user.id,
            teacherId,
            subject,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            notes: notes || '',
            status: 'pending',
            price: price || 0,
            paymentStatus: 'paid',
            paypalOrderId: orderId,
            paypalCaptureId: captureId
        });

        await booking.save();

        // Create chat for the booking
        const Chat = require('../models/Chat');
        try {
            const existingChat = await Chat.findOne({ bookingId: booking._id });
            if (!existingChat) {
                const chat = new Chat({
                    bookingId: booking._id,
                    studentId: req.user.id,
                    teacherId,
                    messages: []
                });
                await chat.save();
            }
        } catch (chatErr) {
            console.error('Error creating chat:', chatErr);
        }

        // Save transaction record
        const transaction = new Transaction({
            bookingId: booking._id,
            studentId: req.user.id,
            teacherId,
            amount: price || 0,
            currency: 'USD',
            subject,
            paypalOrderId: orderId,
            paypalCaptureId: captureId,
            status: 'completed'
        });

        await transaction.save();

        await booking.populate('studentId', 'name email avatar');
        await booking.populate('teacherId', 'name email avatar');

        res.status(201).json({
            message: 'Payment successful! Booking created.',
            booking,
            transaction
        });
    } catch (error) {
        console.error('PayPal capture error:', error);
        res.status(500).json({ error: 'Failed to capture payment' });
    }
};

// GET /api/payments/transactions
// Get transaction history for current user (student or teacher)
const getTransactions = async (req, res) => {
    try {
        const { role, id } = req.user;

        const filter = role === 'student'
            ? { studentId: id }
            : { teacherId: id };

        const transactions = await Transaction.find(filter)
            .populate('studentId', 'name email avatar')
            .populate('teacherId', 'name email avatar')
            .populate('bookingId', 'startTime endTime status')
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};

module.exports = {
    createOrder,
    captureOrder,
    getTransactions
};
