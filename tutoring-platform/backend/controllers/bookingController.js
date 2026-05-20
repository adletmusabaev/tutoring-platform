const Booking = require('../models/Booking');
const Chat = require('../models/Chat');

// Create booking
const createBooking = async (req, res) => {
  try {
    const { teacherId, subject, startTime, endTime, notes } = req.body;

    // Validation
    if (!teacherId || !subject || !startTime || !endTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }

    // Create booking
    const booking = new Booking({
      studentId: req.user.id,
      teacherId,
      subject,
      startTime: start,
      endTime: end,
      notes: notes || ''
    });

    await booking.save();

    // Automatically create chat for booking
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
      // Continue even if chat creation fails
    }

    await booking.populate('studentId', 'name email avatar');
    await booking.populate('teacherId', 'name email avatar');

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get my bookings
const getMyBookings = async (req, res) => {
  try {
    const { role } = req.user;
    const filter = role === 'student'
      ? { studentId: req.user.id }
      : { teacherId: req.user.id };

    const bookings = await Booking.find(filter)
      .populate('studentId', 'name email avatar')
      .populate('teacherId', 'name email avatar')
      .sort({ startTime: 1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('studentId', 'name email avatar')
      .populate('teacherId', 'name email avatar');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('studentId', 'name email').populate('teacherId', 'name email');

    // Create chat if booking is confirmed and chat doesn't exist
    if (status === 'confirmed') {
      try {
        const existingChat = await Chat.findOne({ bookingId: req.params.id });
        if (!existingChat) {
          const chat = new Chat({
            bookingId: req.params.id,
            studentId: booking.studentId._id,
            teacherId: booking.teacherId._id,
            messages: []
          });
          await chat.save();
        }
      } catch (chatErr) {
        console.error('Error creating chat:', chatErr);
      }
    }

    res.json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', updatedAt: Date.now() },
      { new: true }
    );

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
};