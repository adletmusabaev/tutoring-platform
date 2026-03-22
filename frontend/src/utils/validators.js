// Validate registration form
export const validateRegisterForm = (formData) => {
  const errors = {};

  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!formData.email || !isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password || formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (formData.role === 'teacher' && formData.subjects.length === 0) {
    errors.subjects = 'Please select at least one subject';
  }

  return errors;
};

// Validate login form
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.email || !isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password || formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
};

// Validate booking form
export const validateBookingForm = (formData) => {
  const errors = {};

  if (!formData.subject) {
    errors.subject = 'Please select a subject';
  }

  if (!formData.startTime) {
    errors.startTime = 'Please select a start time';
  }

  if (!formData.endTime) {
    errors.endTime = 'Please select an end time';
  }

  if (formData.startTime && formData.endTime) {
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (start >= end) {
      errors.endTime = 'End time must be after start time';
    }

    if (start < new Date()) {
      errors.startTime = 'Start time cannot be in the past';
    }
  }

  return errors;
};

// Validate review form
export const validateReviewForm = (formData) => {
  const errors = {};

  if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
    errors.rating = 'Please select a rating between 1 and 5';
  }

  if (formData.comment && formData.comment.length > 500) {
    errors.comment = 'Comment must be less than 500 characters';
  }

  return errors;
};

// Email validation
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Check if form has errors
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};