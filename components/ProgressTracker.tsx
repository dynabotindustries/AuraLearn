import React from 'react';
import type { Progress } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgressTrackerProps {
  progress: Progress;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progress }) => {
  const averageScore = progress.quizHistory.length > 0
    ? (progress.quizHistory.reduce((acc, curr) => acc + curr.score, 0) / progress.quizHistory.length).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-8 animate-fade-in">
        <header>
            <h1 className="text-3xl font-bold text-white">Your Progress</h1>
            <p className="text-gray-400">Track your learning journey and past quiz scores.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-6 rounded-2xl text-center">
                <p className="text-gray-400">Streak</p>
                <p className="text-4xl font-bold text-orange-400">{progress.streak} <span className="text-xl">days</span></p>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl text-center">
                <p className="text-gray-400">Tasks Done</p>
                <p className="text-4xl font-bold text-green-400">{progress.completedTasks}</p>
            </div>
             <div className="bg-gray-800 p-6 rounded-2xl text-center">
                <p className="text-gray-400">Avg. Score</p>
                <p className="text-4xl font-bold text-blue-400">{averageScore}{averageScore !== 'N/A' && '%'}</p>
            </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Learning Curve</h2>
             <div style={{ width: '100%', height: 300 }}>
                {progress.learningData.length > 0 ? (
                    <ResponsiveContainer>
                        <BarChart data={progress.learningData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="date" stroke="#A0AEC0" />
                            <YAxis stroke="#A0AEC0" />
                            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                            <Bar dataKey="score" fill="#4299E1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Complete some quizzes to see your learning curve!</p>
                    </div>
                )}
             </div>
        </div>
        
        {progress.quizHistory.length > 0 && (
             <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Quiz History</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {progress.quizHistory.slice().reverse().map((result, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                            <div>
                                <p className="font-semibold text-white">{result.topic}</p>
                                <p className="text-sm text-gray-400">{result.date}</p>
                            </div>
                            <p className={`font-bold text-lg ${result.score >= 70 ? 'text-green-400' : 'text-orange-400'}`}>
                                {result.score}%
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default ProgressTracker;