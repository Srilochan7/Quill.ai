import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUp, FileText, X, Bot, Sun, Moon, Github, Twitter } from 'lucide-react';
import axios from 'axios';

// --- Helper for CSS styles ---
const CustomStyles = () => (
  <style>{`
    /* Hide the scrollbar */
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    /* Classic blinking cursor animation */
    @keyframes blink {
      50% { opacity: 0; }
    }
    .cursor-blink {
      animation: blink 1.2s step-end infinite;
    }
  `}</style>
);

// --- Animation Variants (Unchanged) ---
const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: 'easeOut',
      type: 'spring',
      stiffness: 100
    } 
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const heroContentVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 80,
      staggerChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: { duration: 0.4, ease: 'easeInOut' }
  }
};


// --- The Main Application Component ---
function ChatPdfApp() {
  const [inputValue, setInputValue] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatTitle, setChatTitle] = useState('');
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState(null);

  const streamIntervalRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  
  const fileInputRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const textareaRef = useRef(null);
  
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f8fafc');
    }
  }, [theme]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);
  
  useEffect(() => {
    if (uploadedFile) setError('');
  }, [uploadedFile]);

  // --- Core Functions ---

  const handleNewChat = () => {
    if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
    }
    setMessages([]);
    setChatTitle('');
    setSessionId(null);
    setUploadedFile(null);
    setInputValue('');
    setError('');
  };

  const handleSendMessage = async () => {
    if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
    }

    const isFirstMessage = messages.length === 0;
    const currentQuestion = inputValue.trim();
    const currentFile = uploadedFile;

    if (!currentQuestion && !currentFile) return;

    if (isFirstMessage && !currentFile) {
        setError('Please add a file to start a new chat.');
        return;
    }

    const userMessage = {
        id: Date.now(),
        sender: 'user',
        text: currentQuestion,
        fileName: isFirstMessage ? currentFile.name : null,
    };
    
    setMessages(prev => [...prev, userMessage]);
    if (isFirstMessage) setChatTitle(currentFile.name);

    setInputValue('');
    setUploadedFile(null);
    setIsLoading(true);
    setError('');

    try {
        let currentSessionId = sessionId;

        if (isFirstMessage && currentFile) {
            const formData = new FormData();
            formData.append('file', currentFile);
            const uploadResponse = await axios.post('http://localhost:8000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            currentSessionId = uploadResponse.data.session_id;
            setSessionId(currentSessionId);
        }

        if (!currentSessionId) {
            throw new Error("Session ID missing. Please start a new chat.");
        }

        const chatResponse = await axios.post('http://localhost:8000/chat', {
            session_id: currentSessionId,
            question: currentQuestion,
        });
        
        setIsLoading(false);

        const fullAnswer = chatResponse.data.answer;
        const aiMessageId = Date.now() + 1;

        setMessages(prev => [
            ...prev,
            { id: aiMessageId, sender: 'ai', text: '' }
        ]);
        
        // --- MODIFICATION: Switched from word-by-word to character-by-character ---
        const chars = fullAnswer.split('');
        let currentCharIndex = 0;
        
        streamIntervalRef.current = setInterval(() => {
            if (currentCharIndex < chars.length) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiMessageId
                            ? { ...msg, text: msg.text + chars[currentCharIndex] }
                            : msg
                    )
                );
                currentCharIndex++;
            } else {
                clearInterval(streamIntervalRef.current);
                streamIntervalRef.current = null;
            }
        }, 20); // Interval is faster for smoother character typing

    } catch (err) {
        const errorMessage = err.response?.data?.detail || "An error occurred. Please try again.";
        setError(errorMessage);
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        if (isFirstMessage) setChatTitle('');
        setIsLoading(false);
    } finally {
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUploadClick = () => fileInputRef.current.click();
  const handleFileChange = (event) => { if (event.target.files[0]) setUploadedFile(event.target.files[0]); event.target.value = ''; };
  const removeFile = () => setUploadedFile(null);
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <motion.div 
      className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col transition-colors duration-500"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <CustomStyles />
      <TopNavBar onToggleTheme={toggleTheme} currentTheme={theme} onNewChat={handleNewChat} />
      
      <main ref={scrollAreaRef} className="flex-grow w-full max-w-3xl mx-auto overflow-y-auto pt-20 pb-10 min-h-0 no-scrollbar">
        <div className="px-4">
            <AnimatePresence>
              {messages.length > 0 ? (
                <div className="w-full space-y-6 pb-8">
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, index) => (
                            <motion.div key={msg.id} variants={messageVariants} initial="hidden" animate="visible" exit="exit" layout>
                                {msg.sender === 'user' ? (
                                    <UserMessage message={msg} />
                                 ) : (
                                    <AiMessage 
                                        message={msg}
                                        isStreaming={streamIntervalRef.current !== null && index === messages.length - 1}
                                    />
                                 )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && <LoadingIndicator />}
                </div>
              ) : (
                <motion.div 
                    className="h-full flex flex-col items-center justify-center text-center" 
                    variants={heroContentVariants} 
                    initial="hidden" 
                    animate="visible" 
                    exit="exit"
                >
                  <motion.h1 variants={heroContentVariants} className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50">Chat With Your PDF</motion.h1>
                  <motion.p variants={heroContentVariants} className="mt-4 text-lg text-slate-600 dark:text-slate-400">Upload a document to get started.</motion.p>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </main>

      <div className="w-full fixed bottom-0 left-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent z-10">
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <AnimatePresence>
            {chatTitle && !uploadedFile && (
                <motion.div
                    className="text-center text-xs text-slate-500 dark:text-slate-400 mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                >
                    Chatting with <span className="font-semibold text-slate-600 dark:text-slate-300">{chatTitle}</span>
                </motion.div>
            )}
          </AnimatePresence>
          <motion.div className="w-full relative" layoutId="input-container">
            <AnimatePresence>{error && <motion.p className="absolute bottom-full w-full text-center text-red-500 dark:text-red-400 text-sm mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}>{error}</motion.p>}</AnimatePresence>
            <AnimatePresence>
              {uploadedFile && (
                <motion.div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-full max-w-md"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                >
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 text-sm font-medium px-3 py-2 rounded-lg border border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-800">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{uploadedFile.name}</span>
                        <motion.button onClick={removeFile} className="ml-auto text-indigo-500 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-100 p-1 rounded-full" whileHover={{ scale: 1.1, rotate: 90 }}><X className="w-4 h-4" /></motion.button>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500">
              <button onClick={handleFileUploadClick} className="absolute top-1/2 -translate-y-1/2 left-3 p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"><Plus className="w-5 h-5" /></button>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="hidden" />
              <textarea
                ref={textareaRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={chatTitle ? `Ask about ${chatTitle}` : 'Upload a document to start chatting...'}
                className="w-full bg-transparent text-base placeholder-slate-500 dark:placeholder-slate-400 rounded-xl p-4 pl-14 pr-14 outline-none resize-none max-h-48" rows={1}
              />
              <button onClick={handleSendMessage} disabled={isLoading || streamIntervalRef.current !== null} className="absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"><ArrowUp className="w-5 h-5" /></button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Child Components ---

const TopNavBar = ({ onToggleTheme, currentTheme, onNewChat }) => (
  <motion.header className="fixed top-0 left-0 right-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 z-20" initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
    <div className="max-w-3xl mx-auto flex justify-between items-center p-3">
        <div className="flex items-center gap-2"><Bot className="w-6 h-6 text-indigo-500" /><span className="font-bold text-lg text-slate-800 dark:text-slate-100">Quill.ai</span></div>
        <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={onNewChat} className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400" aria-label="New Chat"><Plus className="w-5 h-5" /></button>
            <a href="https://github.com/Srilochan7/doc-gpt" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><Github className="w-5 h-5" /></a>
            <a href="https://x.com/Srilochan7" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><Twitter className="w-5 h-5" /></a>
            <button onClick={onToggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={currentTheme} initial={{ y: -20, opacity: 0, rotate: -90 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: 20, opacity: 0, rotate: 90 }} transition={{ duration: 0.3 }}>
                        {currentTheme === 'light' ? <Moon className="w-5 h-5"/> : <Sun className="w-5 h-5" />}
                    </motion.div>
                </AnimatePresence>
            </button>
        </div>
    </div>
  </motion.header>
);

const UserMessage = ({ message }) => (
  <div className="flex justify-end ml-10">
    <div className="bg-indigo-500 text-white p-3 rounded-lg max-w-xl">
      {message.fileName && <div className="border-b border-indigo-300 pb-2 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate text-sm">{message.fileName}</span></div>}
      {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
    </div>
  </div>
);

const AiMessage = ({ message, isStreaming }) => (
  <div className="flex items-start gap-3 mr-10">
    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5 text-slate-600 dark:text-slate-300" /></div>
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg max-w-xl">
        {/* MODIFICATION: Using the new 'cursor-blink' class for a better animation */}
        <p className="whitespace-pre-wrap">{message.text}{isStreaming ? <span className="cursor-blink ml-1">▌</span> : ''}</p>
    </div>
  </div>
);

const LoadingIndicator = () => (
    <motion.div className="flex items-start gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5 text-slate-600 dark:text-slate-300" /></div>
      <div className="flex items-center gap-1.5 p-3 h-10 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <motion.div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
      </div>
    </motion.div>
);

export default ChatPdfApp;