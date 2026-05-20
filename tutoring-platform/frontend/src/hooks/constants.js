export const SUBJECTS = [
  'Mathematics', 'Algebra', 'Geometry',
  'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'Social Studies',
  'Literature', 'English', 'French', 'Spanish',
  'Art', 'Music', 'Physical Education'
];

export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher'
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const KNOWLEDGE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const ITEMS_PER_PAGE = 10;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const LESSON_DURATION_OPTIONS = [30, 60, 90, 120];