import React, { useState, useEffect, useCallback } from 'react';
import { View, StudyPlan, Progress, ChatMessage } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Dashboard from './components/Dashboard';
import StudyPlanComponent from './components/StudyPlan';
import TutorChat from './components/TutorChat';
import ProgressTracker from './components/ProgressTracker';
import QuizMaker from './components/QuizMaker';
import { BookOpenIcon, ChartBarIcon, HomeIcon, MessageSquareIcon, XIcon, ClipboardCheckIcon } from './components/icons';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [studyPlan, setStudyPlan] = useLocalStorage<StudyPlan | null>('studyPlan', null);
  const [progress, setProgress] = useLocalStorage<Progress>('progress', {
    streak: 0,
    completedTasks: 0,
    quizHistory: [],
    learningData: [
        { date: 'Mon', score: 65 },
        { date: 'Tue', score: 70 },
        { date: 'Wed', score: 68 },
        { date: 'Thu', score: 80 },
    ]
  });
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('chatHistory', []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const updateProgress = useCallback((taskId: string) => {
    if (!studyPlan) return;

    let taskFound = false;
    const updatedPlan: StudyPlan = {
      ...studyPlan,
      days: studyPlan.days.map(day => ({
        ...day,
        tasks: day.tasks.map(task => {
          if (task.id === taskId) {
            taskFound = true;
            return { ...task, completed: !task.completed };
          }
          return task;
        }),
      })),
    };
    
    if (taskFound) {
      setStudyPlan(updatedPlan);
      const completedCount = updatedPlan.days.flatMap(d => d.tasks).filter(t => t.completed).length;
      setProgress(prev => ({...prev, completedTasks: completedCount}));
    }
  }, [studyPlan, setProgress, setStudyPlan]);

  const NavButton = ({ icon, label, targetView }: { icon: React.ReactNode, label: string, targetView: View }) => (
    <button
      onClick={() => {
        setView(targetView);
        setIsMenuOpen(false);
      }}
      className={`flex flex-col items-center justify-center space-y-1 w-full py-2 rounded-lg transition-colors duration-200 ${
        view === targetView ? 'text-blue-400 bg-gray-700/50' : 'text-gray-400 hover:bg-gray-700/30 hover:text-blue-300'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  const renderView = () => {
    switch (view) {
      case View.STUDY_PLAN:
        return <StudyPlanComponent studyPlan={studyPlan} setStudyPlan={setStudyPlan} updateProgress={updateProgress} />;
      case View.TUTOR_CHAT:
        return <TutorChat chatHistory={chatHistory} setChatHistory={setChatHistory} />;
      case View.PROGRESS:
        return <ProgressTracker progress={progress} />;
      case View.QUIZ:
        return <QuizMaker setProgress={setProgress} />;
      case View.DASHBOARD:
      default:
        return <Dashboard setView={setView} progress={progress} studyPlan={studyPlan} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 bg-gray-900/80 backdrop-blur-sm z-20 p-4 flex justify-between items-center border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">AuraLearn</h1>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
           {isMenuOpen ? <XIcon /> : <HomeIcon />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:relative top-0 left-0 h-full bg-gray-800/50 backdrop-blur-lg md:bg-gray-900 border-r border-gray-700 p-4 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-30 md:z-auto w-48 md:w-20 lg:w-48 flex flex-col items-center space-y-6`}>
         <div className="hidden md:flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                 <BookOpenIcon className="w-6 h-6 text-white"/>
            </div>
            <h1 className="text-xl font-bold text-blue-400 hidden lg:block">AuraLearn</h1>
         </div>
         <nav className="flex flex-col items-center w-full space-y-4 pt-10 md:pt-16">
           <NavButton icon={<HomeIcon />} label="Dashboard" targetView={View.DASHBOARD} />
           <NavButton icon={<BookOpenIcon />} label="Study Plan" targetView={View.STUDY_PLAN} />
           <NavButton icon={<MessageSquareIcon />} label="AI Tutor" targetView={View.TUTOR_CHAT} />
           <NavButton icon={<ChartBarIcon />} label="Progress" targetView={View.PROGRESS} />
           <NavButton icon={<ClipboardCheckIcon />} label="Quiz" targetView={View.QUIZ} />
         </nav>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
