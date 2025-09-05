
import { GoogleGenAI, Type, GenerateContentResponse, File as GeminiFile, Part } from "@google/genai";
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

export const getTaskExplanation = async (subject: string, topic: string, taskName: string): Promise<string> => {
    const prompt = `You are an expert tutor for a student studying "${subject}".
The topic for the day is "${topic}".
The specific task is: "${taskName}".

Please provide a detailed and clear explanation for this task. 
- Start with a simple overview.
- Break down complex concepts into smaller, easy-to-understand parts.
- Use examples or analogies where helpful.
- If it's a practical task (like coding), provide a brief code snippet or pseudocode.
- Format your response using Markdown for readability (headings, lists, bold text, etc.).
- Keep the tone encouraging and supportive.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating task explanation:", error);
        throw new Error("Failed to generate an explanation for the task.");
    }
};

export const uploadFile = async (fileToUpload: globalThis.File): Promise<GeminiFile> => {
    try {
        const file = await ai.files.upload({
            file: fileToUpload,
            config: {
                displayName: fileToUpload.name,
            },
        });
        return file;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("Failed to upload the file to the server.");
    }
};

export const getFile = async (name: string): Promise<GeminiFile> => {
    try {
        const file = await ai.files.get({ name });
        return file;
    } catch (error) {
        console.error("Error getting file state:", error);
        throw new Error("Failed to get file status from the server.");
    }
};

export const getPDFQueryResponseStream = async (
  chatHistory: ChatMessage[],
  fileUri: string,
  mimeType: string,
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    const systemInstruction = `You are an AI assistant. Your task is to answer questions based *only* on the content of the provided document. Do not use any external knowledge. If the information to answer a question is not in the document, you must clearly state that the answer is not found in the provided text.`;

    const contents = chatHistory.map(({ role, text }) => ({
        role,
        parts: [{ text }] as Part[],
    }));
    
    const lastUserMessage = contents[contents.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
        lastUserMessage.parts.unshift({
            fileData: {
                mimeType: mimeType,
                fileUri: fileUri,
            }
        });
    }

    const response = await ai.models.generateContentStream({
        model: model,
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
        },
    });

    return response;
};

// Fix: Add the missing getTutorResponseStream function.
export const getTutorResponseStream = async (
  chatHistory: ChatMessage[],
  useWebSearch: boolean,
): Promise<AsyncGenerator<GenerateContentResponse>> => {
  const systemInstruction = `You are a friendly and knowledgeable AI tutor. Your goal is to help users understand complex topics in a clear and concise way. Be encouraging and supportive.`;

  const contents = chatHistory.map(({ role, text }) => ({
    role,
    parts: [{ text }],
  }));

  const config: any = {
    systemInstruction,
  };

  if (useWebSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContentStream({
    model: model,
    contents: contents,
    config,
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
