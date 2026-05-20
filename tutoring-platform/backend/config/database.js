const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(' MongoDB Connected Successfully');
    console.log(` Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error(' MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };