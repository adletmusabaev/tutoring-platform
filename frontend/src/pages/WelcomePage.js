import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function WelcomePage() {
    const navigate = useNavigate();
    const [subject, setSubject] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (subject.trim()) {
            navigate(`/search-teachers?subject=${encodeURIComponent(subject)}`);
        } else {
            navigate('/search-teachers');
        }
    };

    return (
        <div className="font-sans text-gray-900">

            {/* Hero Section */}
            <section className="relative bg-white pt-16 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 transform skew-y-6 origin-top-left -translate-y-24 z-0"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 max-w-4xl">
                        Find the perfect <span className="text-blue-600">tutor</span> related to your needs.
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl">
                        1-on-1 online lessons from expert tutors. any subject, any time.
                    </p>

                    <div className="w-full max-w-3xl bg-white p-2 rounded-lg shadow-xl border border-gray-100 flex flex-col md:flex-row gap-2">
                        <form onSubmit={handleSearch} className="flex-grow flex flex-col md:flex-row gap-2 w-full">
                            <div className="flex-grow relative">
                                <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
                                <input
                                    type="text"
                                    placeholder="What would you like to learn?"
                                    className="w-full pl-12 pr-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md text-lg transition duration-200 whitespace-nowrap"
                            >
                                Find a Tutor
                            </button>
                        </form>
                    </div>
                    <div className="mt-6 text-gray-500 text-sm">
                        Popular: Math, English, Computer Science, Piano
                    </div>
                </div>
            </section>

            {/* Trust / Stats Strip */}
            <section className="bg-blue-900 py-12 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold mb-2">65,000+</div>
                            <div className="text-blue-200 uppercase tracking-wider text-sm font-semibold">Tutors</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">10+ Million</div>
                            <div className="text-blue-200 uppercase tracking-wider text-sm font-semibold">Lessons Taught</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">4.9/5</div>
                            <div className="text-blue-200 uppercase tracking-wider text-sm font-semibold">Average Rating</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Props */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why choose us?</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 text-blue-600 text-4xl mb-6">
                                🎓
                            </div>
                            <h3 className="text-xl font-bold mb-4">Expert Tutors</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Every tutor is vetted and qualified. Find experts who can explain complex concepts simply and effectively.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 text-green-600 text-4xl mb-6">
                                💻
                            </div>
                            <h3 className="text-xl font-bold mb-4">Online Classroom</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Our integrated video chat and whiteboard make learning online as easy as meeting in person.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-purple-100 text-purple-600 text-4xl mb-6">
                                🛡️
                            </div>
                            <h3 className="text-xl font-bold mb-4">Good Fit Guarantee</h3>
                            <p className="text-gray-600 leading-relaxed">
                                We want you to love your tutor. If you're not 100% satisfied with the first hour, we'll cover it.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Subject Categories */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-12">Find a tutor for any subject</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Math', 'English', 'Science', 'Computer Science', 'Languages', 'Test Prep', 'Elementary', 'History'].map((subj) => (
                            <Link
                                to={`/search-teachers?subject=${encodeURIComponent(subj)}`}
                                key={subj}
                                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border border-gray-100 flex items-center justify-between group"
                            >
                                <span className="font-semibold text-lg text-gray-700 group-hover:text-blue-600">{subj}</span>
                                <span className="text-gray-300 group-hover:text-blue-600">→</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Ready to start learning?</h2>
                    <p className="text-blue-100 text-xl mb-10">Get started today and find the perfect tutor for your needs.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/search-teachers" className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full text-lg hover:bg-gray-100 transition shadow-lg">
                            Find a Tutor
                        </Link>
                        <Link to="/register" className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full text-lg hover:bg-blue-700 transition">
                            Become a Tutor
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}

export default WelcomePage;
