const mongoose = require('mongoose');
const User = require('./models/User');
const Review = require('./models/Review');
require('dotenv').config();

const run = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tutoring-platform';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        console.log('\n--- Teachers ---');
        const teachers = await User.find({ role: 'teacher' });
        teachers.forEach(t => console.log(`ID: ${t._id}, Name: ${t.name}, Email: ${t.email}`));

        console.log('\n--- Reviews ---');
        const reviews = await Review.find({});
        reviews.forEach(r => console.log(`ID: ${r._id}, TeacherID: ${r.teacherId}, StudentID: ${r.studentId}, Rating: ${r.rating}`));

        if (reviews.length === 0) {
            console.log('No reviews found in database.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
