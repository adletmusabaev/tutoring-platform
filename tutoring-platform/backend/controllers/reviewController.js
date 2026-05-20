const Review = require('../models/Review');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Create review
const createReview = async (req, res) => {
  try {
    const { teacherId, rating, comment } = req.body;

    // Validation
    if (!teacherId || !rating) {
      return res.status(400).json({ error: 'Teacher ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if student has a confirmed or completed booking with this teacher
    const booking = await Booking.findOne({
      studentId: req.user.id,
      teacherId,
      status: { $in: ['confirmed', 'completed'] }
    });

    console.log(`[DEBUG] Review Check - Student: ${req.user.id}, Teacher: ${teacherId}`);
    console.log('[DEBUG] Booking found:', booking);

    if (!booking) {
      console.log('[DEBUG] No confirmed/completed booking found. Querying all bookings for debug...');
      const allBookings = await Booking.find({ studentId: req.user.id, teacherId });
      console.log('[DEBUG] All bookings between these users:', allBookings);

      return res.status(403).json({ error: 'You can only review teachers you have booked a lesson with' });
    }

    // Check if student already reviewed this teacher
    const existingReview = await Review.findOne({
      teacherId,
      studentId: req.user.id
    });

    console.log(`[DEBUG] Checking for existing review - Student: ${req.user.id}, Teacher: ${teacherId}`);
    console.log('[DEBUG] Existing review found:', existingReview);

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this teacher' });
    }

    // Create review
    const review = new Review({
      teacherId,
      studentId: req.user.id,
      rating,
      comment: comment || ''
    });

    await review.save();

    // Update teacher rating
    const reviews = await Review.find({ teacherId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    console.log(`[DEBUG] Updating teacher ${teacherId} rating. Found ${reviews.length} reviews`);
    console.log(`[DEBUG] Calculated avgRating: ${avgRating}, formatted: ${parseFloat(avgRating.toFixed(1))}`);

    const updateResult = await User.findByIdAndUpdate(teacherId, {
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviews.length
    });

    console.log(`[DEBUG] Teacher update result:`, updateResult ? 'Success' : 'Failed');

    await review.populate('studentId', 'name avatar');

    res.status(201).json({
      message: 'Review posted successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reviews for teacher
const getTeacherReviews = async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log(`[DEBUG] getTeacherReviews called for teacherId: ${teacherId}`);

    const reviews = await Review.find({ teacherId })
      .populate('studentId', 'name avatar')
      .sort({ createdAt: -1 });

    console.log(`[DEBUG] Found ${reviews.length} reviews for teacher ${teacherId}`);
    res.json(reviews);
  } catch (error) {
    console.error('[DEBUG] Error fetching teacher reviews:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get my reviews (for students)
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ studentId: req.user.id })
      .populate('teacherId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns the review OR is the teacher being reviewed
    const isOwner = review.studentId.toString() === req.user.id;
    const isTeacher = review.teacherId.toString() === req.user.id;

    if (!isOwner && !isTeacher) {
      return res.status(403).json({ error: 'You are not authorized to delete this review' });
    }

    const teacherId = review.teacherId;
    await Review.findByIdAndDelete(req.params.id);

    // Update teacher rating
    const reviews = await Review.find({ teacherId });
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await User.findByIdAndUpdate(teacherId, {
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: reviews.length
      });
    } else {
      await User.findByIdAndUpdate(teacherId, {
        rating: 0,
        reviewCount: 0
      });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createReview,
  getTeacherReviews,
  getMyReviews,
  deleteReview
};