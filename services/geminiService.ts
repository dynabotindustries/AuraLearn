import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { ChatMessage, QuizQuestion, StudyPlan } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
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

export const getPDFQueryResponseStream = async (
  chatHistory: ChatMessage[],
  pdfText: string
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    const userMessages = chatHistory.filter(m => m.role === 'user');
    const lastUserQuestion = userMessages.length > 0 ? userMessages[userMessages.length - 1].text : '';

    const systemInstruction = `You are an AI assistant that answers questions based *only* on the provided text from a PDF document. Do not use any external knowledge. If the answer cannot be found in the document, you must state that the information is not available in the provided text. Here is the document content:\n\n---\n${pdfText}\n---`;

    const contentsForApi = [
        ...chatHistory.map(({ role, text }) => ({
            role: role === 'model' ? 'model' : 'user', // Ensure role is 'user' or 'model'
            parts: [{ text }],
        })),
    ];

    const response = await ai.models.generateContentStream({
        model: model,
        contents: contentsForApi,
        config: {
            systemInstruction: systemInstruction,
        },
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
                    type: { type: Type.STRING, enum: ['multiple-choice'] },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING, description: "A brief explanation of why the answer is correct." }
                },
                required: ["question", "type", "options", "answer", "explanation"]
            }
        }
    },
    required: ["topic", "questions"]
};

export const generateCustomQuiz = async (topic: string, questionCount: number): Promise<{ topic: string, questions: QuizQuestion[] }> => {
    const prompt = `Generate a quiz with exactly ${questionCount} multiple-choice questions on the topic of "${topic}". For each question, provide the question text, its type as 'multiple-choice', an array of options (ideally 4), the correct answer, and a brief explanation for the correct answer.`;

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