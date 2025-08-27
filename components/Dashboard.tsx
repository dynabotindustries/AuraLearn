
import React from 'react';
// Fix: Import `View` as a value because it's an enum used at runtime.
import { View, type Progress, type StudyPlan } from '../types';
import { BookOpenIcon, CheckCircleIcon, FlameIcon, MessageSquareIcon } from './icons';

interface DashboardProps {
  setView: (view: View) => void;
  progress: Progress;
  studyPlan: StudyPlan | null;
}

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string | number, color: string }) => (
    <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ setView, progress, studyPlan }) => {
    const today = new Date().getDay(); // Sunday - 0, Monday - 1, etc.
    const todaysPlan = studyPlan?.days.find(d => (d.day % 7) === (today % 7));

  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome Back!</h1>
        <p className="text-lg text-gray-400 mt-2">Ready to dive in and learn something new today?</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={<FlameIcon />} title="Current Streak" value={`${progress.streak} days`} color="bg-orange-500/30" />
        <StatCard icon={<CheckCircleIcon />} title="Tasks Completed" value={progress.completedTasks} color="bg-green-500/30" />
        <StatCard icon={<BookOpenIcon />} title="Current Subject" value={studyPlan?.subject || 'None Set'} color="bg-blue-500/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg space-y-4">
          <h2 className="text-2xl font-bold text-white">Today's Focus</h2>
          {todaysPlan ? (
            <div>
              <p className="text-blue-400 font-semibold">{todaysPlan.topic}</p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                {todaysPlan.tasks.slice(0, 3).map(task => <li key={task.id}>{task.name}</li>)}
                {todaysPlan.tasks.length > 3 && <li>...and more</li>}
              </ul>
              <button onClick={() => setView(View.STUDY_PLAN)} className="mt-4 text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                View Full Plan &rarr;
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-400">No study plan found for today.</p>
              <button onClick={() => setView(View.STUDY_PLAN)} className="mt-4 text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                Generate a New Plan &rarr;
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-2xl flex flex-col items-start justify-center text-white">
            <MessageSquareIcon className="w-12 h-12 mb-4 opacity-80" />
            <h2 className="text-3xl font-bold">Have a question?</h2>
            <p className="text-blue-200 mt-2 mb-6">Our AI Tutor is here to help you with any doubt, anytime.</p>
            <button 
                onClick={() => setView(View.TUTOR_CHAT)} 
                className="bg-white text-blue-600 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-200 transition-transform transform hover:scale-105"
            >
                Ask AI Tutor
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
