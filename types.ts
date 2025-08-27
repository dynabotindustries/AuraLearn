export enum View {
  DASHBOARD = 'DASHBOARD',
  STUDY_PLAN = 'STUDY_PLAN',
  TUTOR_CHAT = 'TUTOR_CHAT',
  PROGRESS = 'PROGRESS',
  QUIZ = 'QUIZ',
}

export interface StudyTask {
  id: string;
  name: string;
  duration: number; // in minutes
  completed: boolean;
}

export interface StudyDay {
  day: number;
  topic: string;
  tasks: StudyTask[];
}

export interface StudyPlan {
  subject: string;
  dailyHours: number;
  goal: string;
  days: StudyDay[];
}

export interface QuizQuestion {
  question: string;
  options?: string[];
  answer: string;
  type: 'multiple-choice' | 'short-answer';
  explanation?: string;
}

export interface QuizResult {
  date: string;
  score: number;
  topic: string;
}

export interface Progress {
  streak: number;
  completedTasks: number;
  quizHistory: QuizResult[];
  learningData: { date: string; score: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}
