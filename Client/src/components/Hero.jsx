import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUp, FileText, X, Bot, Github, Twitter, Sun, Moon } from 'lucide-react';
import axios from 'axios'

// --- Enhanced Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      type: 'spring', 
      stiffness: 120, 
      damping: 15,
      duration: 0.6
    } 
  },
  exit: { 
    y: -20, 
    opacity: 0, 
    transition: { 
      duration: 0.3,
      ease: 'easeInOut'
    } 
  },
};

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

const heroTitleVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 80
    }
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: { duration: 0.4, ease: 'easeInOut' }
  }
};

const inputContainerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 100
    }
  }
};

// --- The Main Component ---
function PdfHeroSection() {
  const [inputValue, setInputValue] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Enhanced dark mode with localStorage persistence
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });
  
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Enhanced effect to handle complete dark mode functionality
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    
    // Persist theme preference
    localStorage.setItem('theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f8fafc');
    }
  }, [theme]);

  // Auto-scroll to the latest message with smooth animation
  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollElement = chatContainerRef.current;
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);
  
  // --- Core Functions ---
  const handleSendMessage = () => {
    if (!inputValue.trim() && !uploadedFile) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      fileName: uploadedFile ? uploadedFile.name : null,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setUploadedFile(null);
    setIsLoading(true);
    
    // Reset textarea height after sending
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "This is a simulated response. The UI has been updated with enhanced animations and complete dark mode functionality. The theme now persists across sessions and provides a seamless experience.",
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2500);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) setUploadedFile(file);
    event.target.value = ''; // Clear the input value to allow re-uploading the same file
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // --- Main Render ---
  return (
    <motion.div 
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col items-center p-4 pt-20 md:pt-4 transition-all duration-500 ease-in-out"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      
      <TopNavBar onToggleTheme={toggleTheme} currentTheme={theme} />

      <div className="w-full max-w-3xl flex-grow flex flex-col">
        {/* Chat History Area */}
        <AnimatePresence mode="popLayout">
          {messages.length > 0 && (
            <motion.div 
              ref={chatContainerRef}
              className="flex-grow w-full space-y-6 overflow-y-auto pr-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <AnimatePresence mode="popLayout">
                {messages.map(msg => (
                  <motion.div 
                    key={msg.id} 
                    variants={messageVariants} 
                    initial="hidden" 
                    animate="visible"
                    exit="exit"
                    layout
                    layoutId={`message-${msg.id}`}
                  >
                    {msg.sender === 'user' ? (
                      <UserMessage message={msg} />
                    ) : (
                      <AiMessage message={msg} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && <LoadingIndicator />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* This container handles the transition from centered hero to bottom input */}
        <motion.div
          className={`w-full max-w-2xl mx-auto flex flex-col items-center ${messages.length > 0 ? 'mt-6' : 'justify-center flex-grow'}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          layout
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          {/* Initial Hero Title */}
          <AnimatePresence mode="wait">
            {messages.length === 0 && (
              <motion.h1
                className="text-4xl md:text-5xl font-medium text-center mb-4 text-slate-900 dark:text-slate-50"
                variants={heroTitleVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                layoutId="hero-title"
              >
                What can I help with?
              </motion.h1>
            )}
          </AnimatePresence>
          
          {/* Uploaded File Indicator (pre-send) */}
          <AnimatePresence mode="wait">
            {uploadedFile && messages.length === 0 && (
              <motion.div
                className="mt-4 mb-4 flex items-center gap-2 bg-indigo-50 text-indigo-800 text-sm font-medium px-3 py-2 rounded-lg border border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-800"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                layout
                layoutId="file-indicator"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                  <FileText className="w-4 h-4" />
                  <span>{uploadedFile.name}</span>
                  <motion.button 
                    onClick={removeFile} 
                    className="ml-2 text-indigo-500 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-100"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                      <X className="w-4 h-4" />
                  </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Input Area */}
          <motion.div 
            className="w-full relative" 
            variants={inputContainerVariants}
            layout
            layoutId="input-container"
          >
            <motion.div 
              className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-500 focus-within:border-indigo-500 dark:focus-within:border-indigo-500"
              whileHover={{ 
                boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                scale: 1.002
              }}
              whileFocus={{ scale: 1.005 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                onClick={handleFileUploadClick}
                className="absolute top-1/2 -translate-y-1/2 left-3 w-8 h-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg flex items-center justify-center transition-all duration-200"
                whileHover={{ 
                  scale: 1.1, 
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  rotate: 90
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
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
                placeholder={uploadedFile ? 'Ask anything about your document...' : 'Upload a document or ask anything...'}
                className="w-full bg-transparent text-base placeholder-slate-500 dark:placeholder-slate-400 rounded-xl p-4 pl-14 pr-14 outline-none resize-none max-h-48 overflow-y-auto transition-all duration-300"
                rows={1}
              />
              
              <motion.button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() && !uploadedFile}
                className="absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-slate-700 dark:hover:bg-slate-200 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                whileHover={{ 
                  scale: !inputValue.trim() && !uploadedFile ? 1 : 1.05,
                  rotate: 360
                }}
                whileTap={{ scale: 0.9 }}
                animate={{ 
                  backgroundColor: (!inputValue.trim() && !uploadedFile) ? undefined : theme === 'dark' ? '#ffffff' : '#0f172a'
                }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUp className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// --- Sub-components for better organization (with enhanced animations) ---

const TopNavBar = ({ onToggleTheme, currentTheme }) => (
  <motion.div
    className="fixed top-4 right-4 flex items-center gap-4 z-10"
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
  >
    <motion.div 
      className="hidden sm:block text-xs bg-white/70 dark:bg-slate-800/70 backdrop-blur-md text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <p>Free Plan. <a href="#" className="font-semibold underline text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Subscribe</a></p>
    </motion.div>
    
    <motion.a 
      href="https://github.com" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-300"
      whileHover={{ scale: 1.2, y: -2 }}
      whileTap={{ scale: 0.9 }}
    >
      <Github className="w-5 h-5" />
    </motion.a>
    
    <motion.a 
      href="https://x.com" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-300"
      whileHover={{ scale: 1.2, y: -2 }}
      whileTap={{ scale: 0.9 }}
    >
      <Twitter className="w-5 h-5" />
    </motion.a>
    
    <motion.button 
      onClick={onToggleTheme} 
      className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all duration-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentTheme}
          initial={{ y: -20, opacity: 0, rotate: -180 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 180 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {currentTheme === 'light' ? <Moon className="w-5 h-5"/> : <Sun className="w-5 h-5" />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  </motion.div>
);

const UserMessage = ({ message }) => (
  <motion.div 
    className="flex justify-end"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    <div className="max-w-xl">
      {message.fileName && (
        <motion.div
          className="flex items-center gap-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200 text-sm font-medium px-3 py-2 rounded-t-lg border-b border-indigo-200 dark:border-indigo-800"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <FileText className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{message.fileName}</span>
        </motion.div>
      )}
      {message.text && (
        <motion.div 
          className={`bg-indigo-500 text-white p-3 rounded-lg ${message.fileName ? 'rounded-t-none' : ''}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: message.fileName ? 0.2 : 0 }}
          whileHover={{ scale: 1.02 }}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
        </motion.div>
      )}
    </div>
  </motion.div>
);

const AiMessage = ({ message }) => (
  <motion.div 
    className="flex items-start gap-3"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    <motion.div 
      className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.1, rotate: 360 }}
    >
      <Bot className="w-5 h-5 text-slate-600 dark:text-slate-300" />
    </motion.div>
    <motion.div 
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 p-3 rounded-lg max-w-xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
    >
       <p className="whitespace-pre-wrap">{message.text}</p>
    </motion.div>
  </motion.div>
);

const LoadingIndicator = () => (
    <motion.div 
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <motion.div 
        className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Bot className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </motion.div>
      <div className="flex items-center justify-center gap-1.5 p-3 h-10">
        <motion.div
          className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full"
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            ease: 'easeInOut',
            repeatType: 'loop'
          }}
        />
        <motion.div
          className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full"
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            ease: 'easeInOut', 
            delay: 0.2,
            repeatType: 'loop'
          }}
        />
        <motion.div
          className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full"
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            ease: 'easeInOut', 
            delay: 0.4,
            repeatType: 'loop'
          }}
        />
      </div>
    </motion.div>
);


export default PdfHeroSection;