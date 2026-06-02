const Notification = require('../models/Notification');

const createNotification = async ({ userId, type, title, message, link = '', metadata = {} }) => {
  if (!userId || !type || !title || !message) {
    return null;
  }

  return Notification.create({
    userId,
    type,
    title,
    message,
    link,
    metadata
  });
};

module.exports = {
  createNotification
};
