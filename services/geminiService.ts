import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { ChatMessage, QuizQuestion, StudyPlan } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder.");
    process.env.API_KEY = "YOUR_API_KEY_HERE";
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const studyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    dailyHours: { type: Type.NUMBER },
    goal: { type: Type.STRING },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.NUMBER },
          topic: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "A unique ID for the task, e.g., a timestamp or random string." },
                name: { type: Type.STRING },
                duration: { type: Type.NUMBER },
                completed: { type: Type.BOOLEAN, description: "Should always be false initially." },
              },
              required: ["id", "name", "duration", "completed"],
            },
          },
        },
        required: ["day", "topic", "tasks"],
      },
    },
  },
  required: ["subject", "dailyHours", "goal", "days"],
};

export const generateStudyPlan = async (subject: string, dailyHours: number, goal: string): Promise<StudyPlan> => {
  const prompt = `You are a study planner. Given the subject "${subject}", daily study time of ${dailyHours} hours, and the goal "${goal}", generate a balanced 7-day study plan. Include daily topics and specific tasks with time allocations in minutes. Each task must have a unique ID.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: studyPlanSchema,
      },
    });
    
    const plan = JSON.parse(response.text);
    // Ensure all tasks have a completed field
    plan.days.forEach((day: any) => {
        day.tasks.forEach((task: any) => {
            task.completed = false;
        });
    });

    return plan;
  } catch (error) {
    console.error("Error generating study plan:", error);
    throw new Error("Failed to generate a study plan. The model might be unavailable or the request was malformed.");
  }
};

export const getTutorResponseStream = async (
  chatHistory: ChatMessage[],
  useWebSearch: boolean
): Promise<AsyncGenerator<GenerateContentResponse>> => {
  const contents = chatHistory.map(({ role, text }) => ({
    role,
    parts: [{ text }],
  }));

  const config: any = {};
  if (useWebSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContentStream({
    model: model,
    contents: contents,
    config: config,
  });

  return response;
};


const quizSchema = {
    type: Type.OBJECT,
    properties: {
        topic: { type: Type.STRING },
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['multiple-choice', 'short-answer'] },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING, description: "A brief explanation of why the answer is correct." }
                },
                required: ["question", "type", "answer", "explanation"]
            }
        }
    },
    required: ["topic", "questions"]
};

export const generateCustomQuiz = async (topic: string, questionCount: number): Promise<{ topic: string, questions: QuizQuestion[] }> => {
    const prompt = `Generate a quiz with exactly ${questionCount} questions on the topic of "${topic}". The questions should be a mix of multiple-choice and short-answer types. For each question, provide the question text, its type, options (if multiple-choice), the correct answer, and a brief explanation for the correct answer.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            },
        });
        const quizData = JSON.parse(response.text);
        if (!quizData.questions || quizData.questions.length === 0) {
            throw new Error("Generated quiz has no questions.");
        }
        return quizData;
    } catch (error) {
        console.error("Error generating custom quiz:", error);
        throw new Error("Failed to generate a quiz. Please try a different topic or try again later.");
    }
};
