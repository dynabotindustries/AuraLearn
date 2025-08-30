import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { getPDFQueryResponseStream } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { LoaderIcon, SendIcon, UploadCloudIcon, FileTextIcon } from './icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const genId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const PDFChat: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs`;
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = async (file: File | null) => {
    if (file && file.type === 'application/pdf') {
      setError('');
      setIsParsing(true);
      setPdfFile(file);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setPdfText(fullText);
        setMessages([{
            id: genId(),
            role: 'model',
            text: `I've finished reading "${file.name}". What would you like to know?`
        }])
      } catch (err) {
        setError('Failed to parse PDF. The file might be corrupted.');
        setPdfFile(null);
      } finally {
        setIsParsing(false);
      }
    } else {
      setError('Please upload a valid PDF file.');
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
  };

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || isLoading || !pdfText) return;

    const userMsg: ChatMessage = { id: genId(), role: 'user', text: content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const botMsgId = genId();
    setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '' }]);

    try {
      const stream = await getPDFQueryResponseStream(newMessages, pdfText);
      let fullReply = '';
      for await (const chunk of stream) {
        const delta = chunk.text;
        if(delta) {
            fullReply += delta;
            setMessages(prev => prev.map(m => (m.id === botMsgId ? { ...m, text: fullReply } : m)));
        }
      }
    } catch (err) {
      console.error("Error fetching Gemini response:", err);
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: "Sorry, an error occurred." } : m));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, pdfText]);

  const reset = () => {
    setPdfFile(null);
    setPdfText('');
    setMessages([]);
    setError('');
  }

  if (isParsing) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center">
              <LoaderIcon className="w-12 h-12" />
              <p className="mt-4 text-lg text-gray-300">Analyzing your document: {pdfFile?.name}</p>
          </div>
      )
  }

  if (!pdfFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-4">
        <h1 className="text-3xl font-bold text-white mb-2">Chat With Your PDF</h1>
        <p className="text-gray-400 mb-8">Upload a document to start asking questions.</p>
        <div onDragOver={handleDragOver} onDrop={handleDrop} className="w-full max-w-lg p-10 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-gray-800/50 transition-all">
          <input type="file" id="pdf-upload" accept="application/pdf" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} className="hidden" />
          <label htmlFor="pdf-upload" className="flex flex-col items-center cursor-pointer">
            <UploadCloudIcon />
            <p className="mt-4 text-lg font-semibold text-white">Drag & drop your PDF here</p>
            <p className="text-gray-500">or click to browse</p>
          </label>
        </div>
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto bg-gray-900 text-white animate-fade-in">
      <header className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileTextIcon className="w-6 h-6 text-blue-400" /> Q&A on your Document</h1>
            <p className="text-gray-400 truncate max-w-sm" title={pdfFile.name}>{pdfFile.name}</p>
        </div>
        <button onClick={reset} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors">New PDF</button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
           <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-4 rounded-2xl max-w-lg ${ msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-800 text-gray-200 rounded-bl-none" }`}>
                    {msg.text ? (
                        <div 
                            className="prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(msg.text) as string) }}
                        />
                    ) : <LoaderIcon />}
                </div>
            </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex items-center bg-gray-800 rounded-xl p-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Ask something about the document..."
                className="flex-1 bg-transparent text-white px-4 py-2 focus:outline-none"
                disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || !input} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg ml-2 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                {isLoading ? <LoaderIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5"/>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PDFChat;