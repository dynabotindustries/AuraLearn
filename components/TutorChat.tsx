import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { getTutorResponseStream } from '../services/geminiService';
import { MicIcon, SendIcon, SparklesIcon, LoaderIcon, Volume2Icon } from './icons';

// Fix: Add type definition for the Web Speech API to fix TypeScript error.
// The SpeechRecognition interface is not available in standard DOM typings.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
  start: () => void;
  stop: () => void;
}

interface TutorChatProps {
    chatHistory: ChatMessage[];
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const TutorChat: React.FC<TutorChatProps> = ({ chatHistory, setChatHistory }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [useWebSearch, setUseWebSearch] = useState(false);
    
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, scrollToBottom]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSend(transcript);
            };
            recognitionRef.current = recognition;
        }
    }, []);

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = speechSynthesis.getVoices();
        utterance.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        speechSynthesis.speak(utterance);
    };

    const handleSend = async (messageContent?: string) => {
        const content = (messageContent ?? input).trim();
        if (!content || isLoading) return;

        setInput('');
        setIsLoading(true);

        const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: content };
        const updatedHistory = [...chatHistory, newUserMessage];
        setChatHistory(updatedHistory);

        const modelMessageId = (Date.now() + 1).toString();
        // Add a placeholder for the model's response
        setChatHistory(prev => [...prev, { id: modelMessageId, role: 'model', text: '...' }]);

        try {
            const stream = await getTutorResponseStream(updatedHistory, useWebSearch);
            let fullReply = '';
            let sources: any[] = [];
            
            for await (const chunk of stream) {
                const text = chunk.text;
                const metadata = chunk.candidates?.[0]?.groundingMetadata;

                if (text) {
                    fullReply += text;
                    setChatHistory(prev => prev.map(m =>
                        m.id === modelMessageId ? { ...m, text: fullReply } : m
                    ));
                }
                if (metadata?.groundingChunks) {
                    sources = metadata.groundingChunks.map((c: any) => c.web).filter(Boolean);
                }
            }
            
            setChatHistory(prev => prev.map(m =>
                m.id === modelMessageId ? { ...m, text: fullReply || 'No response.', sources: sources.length > 0 ? sources : undefined } : m
            ));

        } catch (err) {
            console.error("Error streaming response:", err);
            setChatHistory(prev => prev.map(m =>
                m.id === modelMessageId ? { ...m, text: 'Sorry, I encountered an error. Please try again.' } : m
            ));
        } finally {
            setIsLoading(false);
        }
    };
    
    const toggleVoiceInput = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };
    
    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] bg-gray-900 text-gray-100 animate-fade-in">
            <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">AI Tutor</h1>
                    <p className="text-sm text-gray-400">Your personal learning assistant</p>
                </div>
                <div title={useWebSearch ? "Web search is ON" : "Web search is OFF"}>
                    <label htmlFor="web-search-toggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input id="web-search-toggle" type="checkbox" className="sr-only" checked={useWebSearch} onChange={() => setUseWebSearch(!useWebSearch)} />
                            <div className={`block w-14 h-8 rounded-full transition ${useWebSearch ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${useWebSearch ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                        <SparklesIcon className={`ml-3 w-6 h-6 transition-colors ${useWebSearch ? 'text-blue-400' : 'text-gray-500'}`} />
                    </label>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-gray-800 text-gray-200 rounded-bl-lg'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            {msg.sources && (
                                <div className="mt-3 pt-3 border-t border-gray-600">
                                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Sources:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.sources.map((source, index) => (
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" key={index} className="text-xs bg-gray-700 hover:bg-gray-600 text-blue-300 px-2 py-1 rounded-md transition-colors">
                                                {index + 1}. {source.title || new URL(source.uri).hostname}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {msg.role === 'model' && msg.text && msg.text !== '...' && (
                                <button onClick={() => speak(msg.text)} className="mt-2 text-gray-400 hover:text-white transition-colors">
                                    <Volume2Icon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && chatHistory[chatHistory.length - 1]?.role !== 'model' && (
                     <div className="flex gap-3 justify-start">
                         <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-lg inline-flex items-center">
                             <LoaderIcon className="w-5 h-5 animate-spin" />
                         </div>
                     </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-900">
                <div className="flex items-end gap-2 bg-gray-800 rounded-xl p-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask me anything about your studies..."
                        className="flex-1 bg-transparent resize-none focus:outline-none p-2 max-h-48"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button onClick={toggleVoiceInput} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/50 text-red-300' : 'hover:bg-gray-700'}`} disabled={isLoading}>
                         <MicIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="bg-blue-600 text-white p-3 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
                        {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <SendIcon />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorChat;