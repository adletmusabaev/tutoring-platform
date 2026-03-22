import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Список всех доступных предметов (можно вынести в общий конфиг позже)
const SUBJECTS = [
  'Algebra', 'Geometry',
  'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'Social Studies',
  'Literature', 'English', 'French', 'Spanish',
  'Art', 'Music', 'Physical Education'
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

function TestsDirectoryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');

  // Генерируем список тестов (каждый предмет имеет 3 уровня)
  const allTests = [];
  SUBJECTS.forEach(subject => {
    LEVELS.forEach(level => {
      allTests.push({
        id: `${subject.toLowerCase()}-${level.toLowerCase()}`,
        subject: subject,
        level: level,
        points: level === 'Advanced' ? 150 : level === 'Intermediate' ? 100 : 50,
        description: `Test your ${level.toLowerCase()} knowledge in ${subject}.`
      });
    });
  });

  // Фильтрация тестов
  const filteredTests = allTests.filter(test => {
    const matchesSearch = test.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || test.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  if (user?.role !== 'student') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only students can access the test directory.</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg p-8 shadow-md">
        <h1 className="text-4xl font-bold mb-2">Test Directory</h1>
        <p className="text-lg">Challenge yourself, test your knowledge, and earn points!</p>
      </div>

      {/* Filters & Search */}
      <div className="card bg-white shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search by subject (e.g., Mathematics, Physics)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full"
          />
        </div>

        <div className="w-full md:w-auto flex items-center gap-2">
          <label className="text-gray-600 font-semibold whitespace-nowrap">Level Filter:</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="input-field py-2"
          >
            <option value="All">All Levels</option>
            {LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTests.length > 0 ? (
          filteredTests.map(test => (
            <div key={test.id} className="card hover:shadow-xl transition-shadow border border-gray-100 flex flex-col h-full">
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{test.subject}</h3>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    test.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                    test.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {test.level}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{test.description}</p>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="font-semibold text-yellow-600 text-sm">
                  Earn up to {test.points} pts
                </div>
                <Link
                  to={`/level-test/${test.subject}${test.level !== 'Beginner' ? `?level=${test.level}` : ''}`}
                  className="btn-primary py-2 px-4 text-sm"
                >
                  Start Test
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-lg">No tests found matching your criteria.</p>
            <button 
              onClick={() => {setSearchTerm(''); setSelectedLevel('All');}}
              className="mt-3 text-blue-600 hover:underline font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestsDirectoryPage;
