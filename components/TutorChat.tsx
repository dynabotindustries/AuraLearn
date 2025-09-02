import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getTutorResponseStream } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { LoaderIcon, SendIcon, SparklesIcon } from './icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const genId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Fix: Define component props to accept chat history and its setter from the parent.
interface TutorChatProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const TutorChat: React.FC<TutorChatProps> = ({ chatHistory, setChatHistory }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Fix: Add state for web search toggle.
  const [useWebSearch, setUseWebSearch] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    const userMsg: ChatMessage = { id: genId(), role: 'user', text: content };
    const newMessages = [...chatHistory, userMsg];
    setChatHistory(newMessages);
    setInput('');
    setIsLoading(true);

    const botMsgId = genId();
    setChatHistory(prev => [...prev, { id: botMsgId, role: 'model', text: '' }]);

    try {
      // Fix: Pass the `useWebSearch` boolean to the service function.
      const stream = await getTutorResponseStream(newMessages, useWebSearch);
      let fullReply = '';
      for await (const chunk of stream) {
        const delta = chunk.text;
        if (delta) {
          fullReply += delta;
          setChatHistory(prev =>
            prev.map(m => (m.id === botMsgId ? { ...m, text: fullReply } : m))
          );
        }
      }
    } catch (err) {
      console.error('Error fetching Gemini response:', err);
      setChatHistory(prev =>
        prev.map(m =>
          m.id === botMsgId ? { ...m, text: '⚠️ Sorry, an error occurred.' } : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chatHistory, setChatHistory, useWebSearch]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto bg-gray-900 text-white animate-fade-in">
      <header className="p-4 border-b border-gray-700 flex items-center gap-2">
        <SparklesIcon className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold">Tutor Chat</h1>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-4 rounded-2xl max-w-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-800 text-gray-200 rounded-bl-none'
              }`}
            >
              {msg.text ? (
                <div
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parse(msg.text) as string),
                  }}
                />
              ) : (
                <LoaderIcon />
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex items-center bg-gray-800 rounded-xl p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())
            }
            placeholder="Ask your tutor..."
            className="flex-1 bg-transparent text-white px-4 py-2 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg ml-2 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <LoaderIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
          </button>
        </div>
        {/* Fix: Add a toggle for web search. */}
        <div className="flex items-center justify-end text-xs text-gray-400 pt-2 pr-2">
          <label htmlFor="web-search-toggle" className="flex items-center cursor-pointer">
            <input
              id="web-search-toggle"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              checked={useWebSearch}
              onChange={e => setUseWebSearch(e.target.checked)}
            />
            <span className="ml-2">Search with Google for recent topics</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TutorChat;
