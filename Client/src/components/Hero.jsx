import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUp, FileText, X, Bot, Sun, Moon, Github, Twitter, Copy, Check } from 'lucide-react';

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
    /* Smooth fade in for messages */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .message-fade-in {
      animation: fadeInUp 0.3s ease-out;
    }
    /* Custom scrollbar for webkit browsers */
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.3);
      border-radius: 2px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.5);
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(71, 85, 105, 0.3);
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(71, 85, 105, 0.5);
    }
  `}</style>
);

// --- Animation Variants ---
const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.3, 
      ease: [0.4, 0, 0.2, 1],
      type: 'spring',
      stiffness: 300,
      damping: 30
    } 
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
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
  const [isScrolled, setIsScrolled] = useState(false);
  
  const streamIntervalRef = useRef(null);
  const [theme, setTheme] = useState('light');
  const fileInputRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    const scrollableArea = scrollAreaRef.current;
    if (!scrollableArea) return;

    const handleScroll = () => {
        setIsScrolled(scrollableArea.scrollTop > 20);
    };

    scrollableArea.addEventListener('scroll', handleScroll);
    return () => scrollableArea.removeEventListener('scroll', handleScroll);
  }, []);

  // Core Functions
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
        fileName: isFirstMessage ? currentFile?.name : null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    if (isFirstMessage) setChatTitle(currentFile?.name || 'New Chat');

    setInputValue('');
    setUploadedFile(null);
    setIsLoading(true);
    setError('');

    try {
        let currentSessionId = sessionId;

        if (isFirstMessage && currentFile) {
            const formData = new FormData();
            formData.append('file', currentFile);
            const uploadResponse = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });
            const uploadData = await uploadResponse.json();
            currentSessionId = uploadData.session_id;
            setSessionId(currentSessionId);
        }

        if (!currentSessionId) {
            throw new Error("Session ID missing. Please start a new chat.");
        }

        const chatResponse = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: currentSessionId,
                question: currentQuestion,
            }),
        });
        
        const chatData = await chatResponse.json();
        setIsLoading(false);

        const fullAnswer = chatData.answer;
        const aiMessageId = Date.now() + 1;

        setMessages(prev => [
            ...prev,
            { 
                id: aiMessageId, 
                sender: 'ai', 
                text: '',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        
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
        }, 15);

    } catch (err) {
        const errorMessage = err.message || "An error occurred. Please try again.";
        setError(errorMessage);
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        if (isFirstMessage) setChatTitle('');
        setIsLoading(false);
    }
  };

  const handleFileUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (event) => { 
    if (event.target.files?.[0]) setUploadedFile(event.target.files[0]); 
    event.target.value = ''; 
  };
  const removeFile = () => setUploadedFile(null);
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <motion.div 
      className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col transition-colors duration-300"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <CustomStyles />
      <TopNavBar onToggleTheme={toggleTheme} currentTheme={theme} onNewChat={handleNewChat} isScrolled={isScrolled} />
      
      {/* IMPROVED CHAT AREA */}
      <main 
        ref={scrollAreaRef} 
        className="flex-grow w-full overflow-y-auto pt-16 pb-32 custom-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <motion.div 
              className="h-full flex flex-col items-center justify-center text-center py-20" 
              variants={heroContentVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit"
            >
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
                variants={heroContentVariants}
                whileHover={{ scale: 1.05, rotate: 2 }}
              >
                <Bot className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h1 variants={heroContentVariants} className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-50 dark:to-slate-300 bg-clip-text text-transparent mb-4">
                Chat With Your PDF
              </motion.h1>
              <motion.p variants={heroContentVariants} className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
                Upload a document and start asking questions. Get instant, accurate answers from your PDFs.
              </motion.p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, index) => (
                  <motion.div 
                    key={msg.id} 
                    variants={messageVariants} 
                    initial="hidden" 
                    animate="visible" 
                    exit="exit"
                    layout
                    className="message-fade-in"
                  >
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
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* INPUT AREA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50/95 dark:via-slate-950/95 to-transparent backdrop-blur-sm z-20 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto p-4">
          <AnimatePresence>
            {chatTitle && !uploadedFile && (
              <motion.div
                className="text-center text-xs text-slate-500 dark:text-slate-400 mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                Chatting with <span className="font-semibold text-indigo-600 dark:text-indigo-400">{chatTitle}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="relative max-w-3xl mx-auto">
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="absolute bottom-full left-0 right-0 text-center text-red-500 dark:text-red-400 text-sm mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2"
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 5 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {uploadedFile && (
                <motion.div
                  className="absolute bottom-full left-0 right-0 mb-3"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                >
                  <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-sm font-medium px-4 py-3 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{uploadedFile.name}</span>
                    <motion.button 
                      onClick={removeFile} 
                      className="ml-auto text-indigo-500 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-100 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800/50" 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-all">
              <button 
                onClick={handleFileUploadClick} 
                className="absolute top-1/2 -translate-y-1/2 left-4 p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <textarea
                ref={textareaRef} 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleSendMessage(); 
                  } 
                }}
                placeholder={chatTitle ? `Ask about ${chatTitle}...` : 'Upload a PDF to start chatting...'}
                className="w-full bg-transparent text-base placeholder-slate-500 dark:placeholder-slate-400 rounded-2xl p-4 pl-16 pr-16 outline-none resize-none min-h-[56px] max-h-32"
                rows={1}
                disabled={isLoading}
              />
              <motion.button 
                onClick={handleSendMessage} 
                disabled={isLoading || streamIntervalRef.current !== null || (!inputValue.trim() && !uploadedFile)} 
                className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg flex items-center justify-center disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowUp className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// TopNavBar Component
const TopNavBar = ({ onToggleTheme, currentTheme, onNewChat, isScrolled }) => (
  <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
    isScrolled 
      ? 'bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm'
      : 'bg-slate-50 dark:bg-slate-950'
  }`}>
    <div className="max-w-4xl mx-auto flex justify-between items-center px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-50 dark:to-slate-300 bg-clip-text text-transparent">
          Quill.ai
        </span>
      </div>
      <div className="flex items-center gap-1">
        <motion.button 
          onClick={onNewChat} 
          className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
        </motion.button>
        <a 
          href="https://github.com/Srilochan7/doc-gpt" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Github className="w-5 h-5" />
        </a>
        <a 
          href="https://x.com/Srilochan7" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Twitter className="w-5 h-5" />
        </a>
        <motion.button 
          onClick={onToggleTheme} 
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div 
              key={currentTheme} 
              initial={{ rotate: -90, opacity: 0 }} 
              animate={{ rotate: 0, opacity: 1 }} 
              exit={{ rotate: 90, opacity: 0 }} 
              transition={{ duration: 0.2 }}
            >
              {currentTheme === 'light' ? <Moon className="w-5 h-5"/> : <Sun className="w-5 h-5" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  </header>
);

// Message Components
const UserMessage = ({ message }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (message.text) {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex justify-end group">
      <div className="flex items-start gap-3 max-w-3xl">
        <motion.button
          onClick={copyToClipboard}
          className="opacity-0 group-hover:opacity-100 mt-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </motion.button>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-lg">
          {message.fileName && (
            <div className="border-b border-indigo-300/30 pb-2 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate text-sm font-medium">{message.fileName}</span>
            </div>
          )}
          {message.text && (
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          )}
          <div className="text-xs text-indigo-100 mt-2 opacity-70">
            {message.timestamp}
          </div>
        </div>
      </div>
    </div>
  );
};

const AiMessage = ({ message, isStreaming }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (message.text) {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-start gap-4 group max-w-3xl">
      <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-slate-600 dark:text-slate-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-200">
            {message.text}
            {isStreaming && <span className="cursor-blink ml-1 text-indigo-500">▌</span>}
          </p>
          {message.timestamp && !isStreaming && (
            <div className="text-xs text-slate-400 mt-2">
              {message.timestamp}
            </div>
          )}
        </div>
        {message.text && !isStreaming && (
          <motion.button
            onClick={copyToClipboard}
            className="opacity-0 group-hover:opacity-100 mt-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </motion.button>
        )}
      </div>
    </div>
  );
};

const LoadingIndicator = () => (
  <motion.div 
    className="flex items-start gap-4 max-w-3xl" 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: -10 }}
  >
    <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
      <Bot className="w-4 h-4 text-slate-600 dark:text-slate-300" />
    </div>
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-md border border-slate-200 dark:border-slate-700 shadow-sm">
      <motion.div 
        className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} 
      />
      <motion.div 
        className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} 
      />
      <motion.div 
        className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} 
      />
    </div>
  </motion.div>
);

export default ChatPdfApp;