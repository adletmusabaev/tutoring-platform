import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as teacherService from '../services/teacherService';
import * as reviewService from '../services/reviewService';

function TeacherProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmitting(true);

    try {
      await reviewService.createReview(id, rating, comment);
      setRating(0);
      setComment('');
      fetchReviews(); // Refresh reviews
      fetchTeacher(); // Refresh teacher stats
    } catch (err) {
      setReviewError(err.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewService.deleteReview(reviewId);
      fetchReviews();
      fetchTeacher();
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review');
    }
  };

  useEffect(() => {
    fetchTeacher();
    fetchReviews();
  }, [id]);

  const fetchTeacher = async () => {
    try {
      const data = await teacherService.getTeacherById(id);
      setTeacher(data);
    } catch (err) {
      setError('Failed to load teacher profile');
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await reviewService.getTeacherReviews(id);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-6">
            {teacher.avatar ? (
              <img
                src={teacher.avatar}
                alt={teacher.name}
                className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-4xl shadow-lg">
                {teacher.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{teacher.name}</h1>
                {teacher.isOnline && (
                  <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Online
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-lg">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-bold">{teacher.rating}</span>
                  <span className="text-gray-600">({teacher.reviewCount} reviews)</span>
                </span>
                {teacher.yearsOfExperience > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {teacher.yearsOfExperience}+ years exp
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600 mb-2">${teacher.hourlyRate}/hr</div>
            {user?.role === 'student' && (
              <Link
                to={`/booking/${teacher._id}`}
                className="btn-primary px-6 py-3 block"
              >
                Book Now
              </Link>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold mb-3">📚 Teaching Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {teacher.subjects.map(subject => (
              <span
                key={subject}
                className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>

        {teacher.bio && (
          <div className="border-t mt-6 pt-6">
            <h3 className="text-xl font-semibold mb-3">About</h3>
            <p className="text-gray-700 leading-relaxed">{teacher.bio}</p>
          </div>
        )}

        {/* Certificates Section */}
        {teacher.certificates && teacher.certificates.length > 0 && (
          <div className="border-t mt-6 pt-6">
            <h3 className="text-xl font-semibold mb-3">📜 Certificates & Qualifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teacher.certificates.map((cert) => (
                <a
                  key={cert._id}
                  href={`http://localhost:5000${cert.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-3 rounded border transition-colors"
                >
                  <span className="text-3xl">
                    {cert.filename.endsWith('.pdf') ? '📄' : '🖼️'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cert.filename}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded {new Date(cert.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-blue-600 text-sm font-semibold">View →</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-3xl font-bold mb-6">Student Reviews</h2>

        {/* Add Review Form */}
        {user?.role === 'student' && (
          <form onSubmit={handleSubmitReview} className="card mb-8">
            <h3 className="text-xl font-semibold mb-4">Write a Review</h3>

            {reviewError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {reviewError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Rating: {rating > 0 ? `${rating} Star${rating !== 1 ? 's' : ''}` : 'Not selected'}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-colors duration-200"
                  >
                    <span className={`text-3xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input-field"
                rows="3"
                placeholder="Share your experience..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="btn-primary"
            >
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <div className="card text-center text-gray-600 py-8">
            <p>No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review._id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{review.studentId?.name}</h3>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                    {/* Debug Logs */}
                    {console.log(`[DEBUG] Review ${review._id}: UserID=${user?.id} (${typeof user?.id}), ReviewStudentID=${review.studentId?._id} (${typeof review.studentId?._id})`)}

                    {((user?.role === 'teacher' && user.id === teacher._id) ||
                      (user?.id === review.studentId?._id)) && (
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          Delete
                        </button>
                      )}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherProfilePage;