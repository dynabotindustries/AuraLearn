
import React, { useState, useCallback, useEffect } from 'react';
import type { StudyPlan, StudyTask } from '../types';
import { generateStudyPlan, getTaskExplanation } from '../services/geminiService';
import { CheckIcon, LoaderIcon, XIcon } from './icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface StudyPlanProps {
  studyPlan: StudyPlan | null;
  setStudyPlan: (plan: StudyPlan | null) => void;
  updateProgress: (taskId: string) => void;
}

const PlanGenerator: React.FC<{ setStudyPlan: (plan: StudyPlan) => void; setLoading: (loading: boolean) => void; }> = ({ setStudyPlan, setLoading }) => {
    const [subject, setSubject] = useState('');
    const [hours, setHours] = useState('2');
    const [goal, setGoal] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !hours || !goal) {
            setError('Please fill out all fields.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const plan = await generateStudyPlan(subject, parseInt(hours), goal);
            setStudyPlan(plan);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Create Your Study Plan</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Subject</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., React & TypeScript" className="w-full bg-gray-700 text-white p-2 mt-1 rounded-md border border-gray-600 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Daily Study Time (hours)</label>
                <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="1" max="12" className="w-full bg-gray-700 text-white p-2 mt-1 rounded-md border border-gray-600 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Your Goal</label>
                <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g., Build a full-stack application" rows={3} className="w-full bg-gray-700 text-white p-2 mt-1 rounded-md border border-gray-600 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Generate Plan</button>
        </form>
      </div>
    );
};

const TaskItem: React.FC<{ task: StudyTask; onToggle: () => void; onExplain: () => void; }> = ({ task, onToggle, onExplain }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
        <div onClick={onToggle} className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all cursor-pointer ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-500 hover:border-blue-400'}`}>
            {task.completed && <CheckIcon />}
        </div>
        <span onClick={onExplain} className={`flex-1 cursor-pointer hover:text-blue-400 transition-colors ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.name}</span>
        <span className="text-sm text-gray-400">{task.duration} min</span>
    </div>
);

const ExplanationModal: React.FC<{ task: StudyTask, explanation: string, isLoading: boolean, onClose: () => void }> = ({ task, explanation, isLoading, onClose }) => (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="explanation-modal-title"
    >
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                <h2 id="explanation-modal-title" className="text-xl font-bold text-white">Explanation: <span className="text-blue-400">{task.name}</span></h2>
                <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-gray-700 transition-colors">
                    <XIcon />
                </button>
            </div>
            <div className="overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <LoaderIcon />
                        <span className="ml-3">Generating explanation...</span>
                    </div>
                ) : (
                    <div 
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(explanation) as string) }}
                    />
                )}
            </div>
        </div>
    </div>
);

const StudyPlanComponent: React.FC<StudyPlanProps> = ({ studyPlan, setStudyPlan, updateProgress }) => {
    const [loading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState<{ task: StudyTask; topic: string } | null>(null);
    const [explanation, setExplanation] = useState('');
    const [isExplanationLoading, setIsExplanationLoading] = useState(false);

    const handleCloseModal = useCallback(() => {
        setSelectedTask(null);
        setExplanation('');
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCloseModal();
            }
        };
        if (selectedTask) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedTask, handleCloseModal]);
    
    const handleExplainClick = async (task: StudyTask, topic: string) => {
        setSelectedTask({ task, topic });
        setIsExplanationLoading(true);
        setExplanation('');
        try {
            const result = await getTaskExplanation(studyPlan!.subject, topic, task.name);
            setExplanation(result);
        } catch (error) {
            setExplanation("Sorry, I couldn't generate an explanation for this task. Please try again later.");
            console.error(error);
        } finally {
            setIsExplanationLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><LoaderIcon /> <span className="ml-3 text-lg">Generating your personalized plan...</span></div>
    }

    if (!studyPlan) {
        return <PlanGenerator setStudyPlan={setStudyPlan} setLoading={setLoading} />;
    }

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                 <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Your Plan: <span className="text-blue-400">{studyPlan.subject}</span></h1>
                        <p className="text-gray-400">{studyPlan.goal}</p>
                    </div>
                    <button onClick={() => setStudyPlan(null)} className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors">New Plan</button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studyPlan.days.map(day => (
                        <div key={day.day} className="bg-gray-800 p-5 rounded-2xl shadow-lg">
                            <h3 className="text-xl font-bold text-white">Day {day.day}</h3>
                            <p className="text-blue-400 mb-4 font-medium">{day.topic}</p>
                            <div className="space-y-3">
                                {day.tasks.map(task => (
                                    <TaskItem key={task.id} task={task} onToggle={() => updateProgress(task.id)} onExplain={() => handleExplainClick(task, day.topic)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {selectedTask && (
                <ExplanationModal 
                    task={selectedTask.task} 
                    explanation={explanation} 
                    isLoading={isExplanationLoading}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default StudyPlanComponent;
