import React, { useState } from 'react';
import { generateCustomQuiz } from '../services/geminiService';
import type { QuizQuestion } from '../types';
import { LoaderIcon, CheckIcon, XIcon } from './icons';

interface QuizMakerProps {
  onQuizComplete: (result: { score: number; topic: string }) => void;
}

type QuizState = 'config' | 'loading' | 'taking' | 'results';

const QuizMaker: React.FC<QuizMakerProps> = ({ onQuizComplete }) => {
  const [quizState, setQuizState] = useState<QuizState>('config');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState<{ topic: string, questions: QuizQuestion[] } | null>(null);
  const [error, setError] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      setError('Please enter a topic.');
      return;
    }
    setError('');
    setQuizState('loading');
    try {
      const quizData = await generateCustomQuiz(topic, questionCount);
      setQuiz(quizData);
      setQuizState('taking');
    } catch (err) {
      setError((err as Error).message);
      setQuizState('config');
    }
  };
  
  const handleAnswerSubmit = (answer: string) => {
    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of quiz
      calculateScore(newAnswers);
      setQuizState('results');
    }
  };

  const calculateScore = (finalAnswers: string[]) => {
      if (!quiz) return;
      let correctCount = 0;
      quiz.questions.forEach((q, i) => {
        if (q.answer.toLowerCase().trim() === finalAnswers[i]?.toLowerCase().trim()) {
            correctCount++;
        }
      });
      const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
      setScore(finalScore);

      // Update parent component
      onQuizComplete({
        score: finalScore,
        topic: quiz.topic,
      });
  };
  
  const resetQuiz = () => {
      setQuizState('config');
      setTopic('');
      setQuestionCount(5);
      setQuiz(null);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setScore(0);
      setError('');
  };

  const renderContent = () => {
    switch (quizState) {
      case 'loading':
        return <div className="flex flex-col items-center justify-center text-center p-8"><LoaderIcon /><p className="mt-4 text-lg">Generating your quiz on "{topic}"...</p></div>;
      
      case 'taking':
        if (!quiz) return null;
        const question = quiz.questions[currentQuestionIndex];
        return <QuizTaker question={question} questionNumber={currentQuestionIndex + 1} totalQuestions={quiz.questions.length} onSubmit={handleAnswerSubmit} />;

      case 'results':
          if(!quiz) return null;
          return <QuizResults quiz={quiz} userAnswers={userAnswers} score={score} onReset={resetQuiz} />;
          
      case 'config':
      default:
        return (
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg max-w-lg mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Create a Quiz</h2>
            <form onSubmit={handleGenerateQuiz} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Topic</label>
                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., JavaScript Promises" className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Number of Questions: <span className="font-bold text-blue-400">{questionCount}</span></label>
                <input type="range" min="3" max="15" value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors transform hover:scale-105">Generate Quiz</button>
            </form>
          </div>
        );
    }
  };

  return <div className="animate-fade-in">{renderContent()}</div>;
};


const QuizTaker: React.FC<{
    question: QuizQuestion;
    questionNumber: number;
    totalQuestions: number;
    onSubmit: (answer: string) => void;
}> = ({ question, questionNumber, totalQuestions, onSubmit }) => {
    const [selectedAnswer, setSelectedAnswer] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(selectedAnswer) {
            onSubmit(selectedAnswer);
            setSelectedAnswer('');
        }
    };
    
    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-blue-400 mb-2">Question {questionNumber} of {totalQuestions}</p>
            <p className="text-xl text-white mb-6">{question.question}</p>
            <form onSubmit={handleSubmit}>
                <div className="space-y-3 mb-6">
                    {question.options.map((option, index) => (
                        <label key={index} className={`block p-4 rounded-lg cursor-pointer transition-all ${selectedAnswer === option ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            <input type="radio" name="option" value={option} checked={selectedAnswer === option} onChange={(e) => setSelectedAnswer(e.target.value)} className="hidden" />
                            {option}
                        </label>
                    ))}
                </div>
                 <button type="submit" disabled={!selectedAnswer} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                    {questionNumber < totalQuestions ? 'Next Question' : 'Finish Quiz'}
                </button>
            </form>
        </div>
    );
}

const QuizResults: React.FC<{
    quiz: { topic: string, questions: QuizQuestion[] };
    userAnswers: string[];
    score: number;
    onReset: () => void;
}> = ({ quiz, userAnswers, score, onReset }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                <h2 className="text-2xl font-bold text-white">Quiz Results for <span className="text-blue-400">{quiz.topic}</span></h2>
                <p className="text-6xl font-extrabold my-4" style={{ color: score >= 70 ? '#48BB78' : '#F56565' }}>{score}%</p>
                <p className="text-gray-400">You answered {Math.round(score/100 * quiz.questions.length)} out of {quiz.questions.length} questions correctly.</p>
                <button onClick={onReset} className="mt-6 bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-colors">Take Another Quiz</button>
            </div>

            <div className="space-y-4">
                 <h3 className="text-xl font-bold text-white">Review Your Answers</h3>
                 {quiz.questions.map((q, i) => {
                    const userAnswer = userAnswers[i];
                    const isCorrect = q.answer.toLowerCase().trim() === userAnswer?.toLowerCase().trim();
                    return (
                        <div key={i} className="bg-gray-800 p-5 rounded-lg border-l-4" style={{borderColor: isCorrect ? '#48BB78' : '#F56565'}}>
                            <p className="font-semibold text-white mb-2">{i + 1}. {q.question}</p>
                            <div className="flex items-center gap-2 mb-2">
                                {isCorrect ? <CheckIcon className="w-5 h-5 text-green-500"/> : <XIcon className="w-5 h-5 text-red-500"/>}
                                <p className={`italic ${isCorrect ? 'text-gray-400' : 'text-red-400 line-through'}`}>Your answer: {userAnswer || "No answer"}</p>
                            </div>
                            {!isCorrect && <p className="text-green-400 italic">Correct answer: {q.answer}</p>}
                            {q.explanation && <p className="text-sm text-gray-400 mt-3 pt-3 border-t border-gray-700"><strong>Explanation:</strong> {q.explanation}</p>}
                        </div>
                    );
                 })}
            </div>
        </div>
    );
}


export default QuizMaker;