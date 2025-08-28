import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { getTutorResponseStream } from '../services/geminiService';
import { LoaderIcon, MicIcon, SendIcon, SparklesIcon, Volume2Icon } from './icons';

// Fix: Add type definitions for the Web Speech API to resolve TypeScript errors.
// These types are not always included in default TypeScript lib configurations.
interface SpeechRecognitionAlternative {
    transcript: string;
}
interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    length: number;
}
interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}
interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

interface TutorChatProps {
    chatHistory: ChatMessage[];
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex ${isModel ? 'justify-start' : 'justify-end'} my-2`}>
            <div className={`max-w-xl lg:max-w-2xl px-5 py-3 rounded-2xl ${isModel ? 'bg-gray-700 text-gray-200 rounded-bl-sm' : 'bg-blue-600 text-white rounded-br-sm'}`}>
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-600">
                        <h4 className="text-sm font-semibold mb-2 text-gray-300">Sources:</h4>
                        <ul className="space-y-1">
                            {message.sources.map((source, index) => (
                                <li key={index}>
                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline">
                                        [{index + 1}] {source.title || source.uri}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

const TutorChat: React.FC<TutorChatProps> = ({ chatHistory, setChatHistory }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useWebSearch, setUseWebSearch] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // Setup Speech Recognition
    useEffect(() => {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            console.warn("Speech recognition is not supported by this browser.");
            return;
        }

        const recognition: SpeechRecognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            setInput(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognitionRef.current?.abort();
        };
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input.trim() };
        const historyForAPI = [...chatHistory, newUserMessage];

        setChatHistory(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await getTutorResponseStream(historyForAPI, useWebSearch);
            let fullText = '';
            let sources: { uri: string; title: string }[] | undefined = undefined;
            const modelMessageId = (Date.now() + 1).toString();
            let firstChunk = true;

            for await (const chunk of stream) {
                fullText += chunk.text;
                if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    sources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
                        .filter((c: any) => c.web)
                        .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
                }

                if (firstChunk) {
                    firstChunk = false;
                    // On the first chunk, add the new model message to the history
                    setChatHistory(prev => [...prev, { id: modelMessageId, role: 'model', text: fullText, sources }]);
                } else {
                    // On subsequent chunks, update the last message (which must be the model's)
                    setChatHistory(prev => {
                        const newHistory = [...prev];
                        const lastMsg = newHistory[newHistory.length - 1];
                        // Ensure we are updating the model's message
                        if (lastMsg && lastMsg.id === modelMessageId) {
                            newHistory[newHistory.length - 1] = { ...lastMsg, text: fullText, sources };
                            return newHistory;
                        }
                        return prev; // Should not happen, but a safe fallback
                    });
                }
            }
             if (firstChunk) {
                // Handle cases where the stream is empty (e.g., safety filters)
                setChatHistory(prev => [...prev, { id: modelMessageId, role: 'model', text: "I'm sorry, I can't respond to that." }]);
            }
        } catch (error) {
            console.error(error);
            setChatHistory(prev =>
                [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleMicClick = () => {
        if (isLoading || !recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setInput('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] animate-fade-in">
            <header className="mb-4">
                <h1 className="text-3xl font-bold text-white">AI Tutor</h1>
                <p className="text-gray-400">Ask me anything about your studies!</p>
            </header>

            <div className="flex-1 overflow-y-auto pr-2">
                {chatHistory.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                <div ref={chatEndRef} />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                     <label htmlFor="webSearchToggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input id="webSearchToggle" type="checkbox" className="sr-only" checked={useWebSearch} onChange={() => setUseWebSearch(!useWebSearch)} />
                            <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useWebSearch ? 'transform translate-x-full bg-blue-400' : ''}`}></div>
                        </div>
                        <div className="ml-3 text-gray-300 text-sm font-medium flex items-center">
                            <SparklesIcon className="w-4 h-4 mr-1"/> Gather from Web
                        </div>
                    </label>
                </div>
                <div className="relative flex items-center">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Type your question here, or use the mic..."
                        rows={1}
                        className="w-full bg-gray-800 text-white p-4 pr-32 rounded-xl border border-gray-600 focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="absolute right-4 flex items-center space-x-2">
                        <button onClick={handleMicClick} disabled={isLoading} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white disabled:text-gray-600'}`}>
                            <MicIcon />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white"><Volume2Icon /></button>
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isLoading ? <LoaderIcon className="w-5 h-5"/> : <SendIcon />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorChat;