import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as gamificationService from '../services/gamificationService';
import { useAuth } from '../hooks/useAuth';

// Sample test questions
const TEST_QUESTIONS = {
  JavaScript: [
    {
      id: 1,
      question: 'What does var keyword do?',
      options: ['Declares variable', 'Creates object', 'Defines function', 'Imports module'],
      correctAnswer: 0
    },
    {
      id: 2,
      question: 'What is closure in JavaScript?',
      options: ['A loop', 'A function with access to outer scope', 'An event', 'A module'],
      correctAnswer: 1
    },
    {
      id: 3,
      question: 'What is async/await?',
      options: ['CSS property', 'HTML attribute', 'Promise handling', 'DOM method'],
      correctAnswer: 2
    },
    {
      id: 4,
      question: 'How do you create an arrow function?',
      options: ['function() {}', '() => {}', 'def() {}', 'func() {}'],
      correctAnswer: 1
    },
    {
      id: 5,
      question: 'What is destructuring?',
      options: ['Breaking code', 'Extracting values from objects/arrays', 'Deleting variables', 'Rebuilding code'],
      correctAnswer: 1
    }
  ],
  Mathematics: [
    {
      id: 1,
      question: 'What is the derivative of x²?',
      options: ['x', '2x', 'x³', '1'],
      correctAnswer: 1
    },
    {
      id: 2,
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1
    },
    {
      id: 3,
      question: 'What is the square root of 16?',
      options: ['2', '3', '4', '8'],
      correctAnswer: 2
    },
    {
      id: 4,
      question: 'What is π approximately?',
      options: ['2.14', '3.14', '4.14', '5.14'],
      correctAnswer: 1
    },
    {
      id: 5,
      question: 'What is 50% of 100?',
      options: ['25', '50', '75', '100'],
      correctAnswer: 1
    }
  ]
};

function LevelTestPage() {
  const { subject } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  
  const queryParams = new URLSearchParams(location.search);
  const testLevel = queryParams.get('level') || 'Beginner';
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedAchievements, setEarnedAchievements] = useState([]);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Get pre-defined questions or generate dynamic ones
  let questions = TEST_QUESTIONS[subject];
  if (!questions || !questions.length) {
    questions = Array.from({ length: 5 }).map((_, i) => ({
      id: i + 1,
      question: `This is a sample question ${i + 1} for ${subject} test. What is the correct answer?`,
      options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0
    }));
  }

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    setScore(percentage);
    
    let maxPoints = 50;
    if (testLevel === 'Intermediate') maxPoints = 100;
    if (testLevel === 'Advanced') maxPoints = 150;

    // Award points if score is good enough
    if (percentage >= 50 && user?.role === 'student') {
      try {
        const pointsToAward = percentage >= 80 ? maxPoints : Math.floor(maxPoints / 2);
        const res = await gamificationService.awardPoints(pointsToAward, 'level_test_passed', subject);
        setEarnedPoints(pointsToAward);
        if (res.newAchievements && res.newAchievements.length > 0) {
          setEarnedAchievements(res.newAchievements);
        }
        // Update user context with new points and achievements
        if (user) {
          updateUser({ 
            ...user, 
            points: res.totalPoints, 
            achievements: res.allAchievements 
          });
        }
      } catch (err) {
        console.error('Failed to award points', err);
      }
    }
    
    setTestCompleted(true);
  };

  const getLevel = () => {
    if (score >= 70) return 'Advanced';
    if (score >= 50) return 'Intermediate';
    return 'Beginner';
  };

  if (testCompleted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="card space-y-6">
          <div className="text-6xl font-bold text-blue-600">{score}%</div>
          
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Level: {getLevel()}</h2>
            <p className="text-gray-600">
              You answered {answers.filter((answer, index) => answer === questions[index].correctAnswer).length} out of {questions.length} questions correctly.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
            <p className="text-blue-900">
              {score >= 70 
                ? "Great job! You have strong knowledge in this subject." 
                : score >= 50 
                ? "Good effort! Keep practicing to improve." 
                : "Don't worry, you'll improve with practice!"}
            </p>
          </div>

          {/* Gamification Results */}
          {earnedPoints > 0 && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 animate-pulse">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="text-2xl font-bold text-yellow-800 mb-2">+{earnedPoints} Points Earned!</h3>
              {earnedAchievements.length > 0 && (
                <div className="mt-4">
                  <p className="text-yellow-700 font-semibold mb-2">New Achievements Unlocked:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {earnedAchievements.map((ach, idx) => (
                      <span key={idx} className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2">
                        🌟 {ach}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary px-6 py-3"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = answers[currentQuestion] !== undefined;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Level Test - {subject} ({testLevel})</h1>
        <p className="text-gray-600">
          Question {currentQuestion + 1} of {questions.length}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="card space-y-6">
        {/* Question */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">{question.question}</h2>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  answers[currentQuestion] === index
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  checked={answers[currentQuestion] === index}
                  onChange={() => handleAnswer(index)}
                  className="mr-3"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="btn-secondary px-6 py-2 disabled:opacity-50"
          >
            ← Previous
          </button>

          <div className="space-x-2">
            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!isAnswered}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                Submit Test
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isAnswered}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LevelTestPage;