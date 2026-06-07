import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as userService from '../services/userService';

function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await userService.getProfileById(id);

        if (data.role !== 'student') {
          setError('Student profile not found');
          return;
        }

        setStudent(data);
      } catch (err) {
        setError('Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || 'Student profile not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start gap-6 mb-6">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="h-28 w-28 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-4xl shadow-lg">
              {student.name.charAt(0)}
            </div>
          )}

          <div>
            <h1 className="text-4xl font-bold mb-2">{student.name}</h1>
            <p className="text-gray-600">{student.city}</p>
            <span className="inline-block mt-3 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              {student.level}
            </span>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold mb-3">Bio</h3>
          <p className="text-gray-700 leading-relaxed">
            {student.bio || 'This student has not added a bio yet.'}
          </p>
        </div>

        {student.goals && student.goals.length > 0 && (
          <div className="border-t mt-6 pt-6">
            <h3 className="text-xl font-semibold mb-3">Learning Goals</h3>
            <div className="flex flex-wrap gap-2">
              {student.goals.map(goal => (
                <span
                  key={goal}
                  className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link to="/my-bookings" className="btn-secondary px-4 py-2 inline-block">
        Back to bookings
      </Link>
    </div>
  );
}

export default StudentProfilePage;
