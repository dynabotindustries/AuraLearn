export enum View {
  DASHBOARD = 'DASHBOARD',
  STUDY_PLAN = 'STUDY_PLAN',
  PROGRESS = 'PROGRESS',
  QUIZ = 'QUIZ',
  PDF_CHAT = 'PDF_CHAT',
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
  options: string[];
  answer: string;
  type: 'multiple-choice';
  explanation?: string;
}

export interface QuizResult {
  date: string;
  score: number;
  topic: string;
}

export interface Progress {
  streak: number;
  lastActivityDate?: string; // YYYY-MM-DD
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


// Add type definitions for the Web Speech API to avoid TypeScript errors.
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: Event) => void;
    onend: () => void;
    start(): void;
    stop(): void;
  }
  
  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
  }
  
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
}