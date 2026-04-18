import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIChatbotBubbleProps {
  onComplete?: () => void;
  isVisible?: boolean;
  position?: 'top-right' | 'bottom-right' | 'center';
}

export const AIChatbotBubble = ({ 
  onComplete, 
  isVisible = true,
  position = 'top-right'
}: AIChatbotBubbleProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showTyping, setShowTyping] = useState(true);

  const messages = [
    {
      text: "👋 Hallo! Ich bin Frigy, dein KI-Assistent!",
      delay: 500,
    },
    {
      text: "🎯 Ich kann dir bei all deinen Fitness-Zielen helfen!",
      delay: 2000,
    },
    {
      text: "💪 Tracker reseten, Gewicht setzen, Wochenplan generieren...",
      delay: 3500,
    },
    {
      text: "🌙 Und noch viel mehr! Dark Mode, Statistiken, und mehr!",
      delay: 5000,
    },
    {
      text: "✨ Sag mir einfach, was du brauchst, und ich mache es!",
      delay: 6500,
    },
  ];

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setCurrentMessageIndex(0);
      setShowTyping(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [isVisible]);

  // Auto-advance messages
  useEffect(() => {
    if (!isVisible || !showTyping) return;

    if (currentMessageIndex < messages.length) {
      const nextMessage = messages[currentMessageIndex];
      const timer = setTimeout(() => {
        setCurrentMessageIndex(prev => {
          if (prev + 1 < messages.length) {
            return prev + 1;
          } else {
            setShowTyping(false);
            return prev;
          }
        });
      }, nextMessage.delay);

      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex, isVisible, showTyping]);

  const handleSkip = () => {
    localStorage.setItem('aiBubbleIntroShown', 'true');
    onComplete?.();
  };

  const handleNext = () => {
    handleSkip();
  };

  if (!isVisible) return null;

  const positionClasses = {
    'top-right': 'fixed top-20 right-6 z-50',
    'bottom-right': 'fixed bottom-6 right-6 z-50',
    'center': 'fixed inset-0 z-50 flex items-center justify-center p-4',
  };

  const containerClasses = positionClasses[position] || positionClasses['top-right'];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {position === 'center' && (
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleSkip}
            />
          )}
          
          <motion.div
            className={containerClasses}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ 
              type: 'spring', 
              damping: 15, 
              stiffness: 300,
              duration: 0.4
            }}
          >
            {/* Floating animation wrapper */}
            <motion.div
              animate={{ 
                y: [0, -12, 0],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-full max-w-sm"
            >
              {/* Bubble Container with Speech Bubble Tail */}
              <div className="relative">
                {/* Main Speech Bubble */}
                <motion.div
                  className="bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-100 backdrop-blur-xl border border-emerald-200/60 shadow-xl overflow-visible relative"
                  style={{
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(16, 185, 129, 0.15)',
                    borderRadius: '28px 28px 28px 8px',
                  }}
                >
                  {/* Header with Bot Avatar */}
                  <div className="relative p-4 bg-gradient-to-r from-emerald-100/60 to-green-50/40 border-b border-emerald-200/40" style={{ borderRadius: '24px 24px 0 0' }}>
                    <div className="flex items-center gap-3">
                      {/* Animated Bot Avatar */}
                      <motion.div
                        className="relative"
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <motion.div
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg relative"
                          style={{
                            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                          }}
                        >
                          <Bot className="w-6 h-6 text-white" />
                        </motion.div>
                        
                        {/* Pulsing glow */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-emerald-500"
                          animate={{ 
                            opacity: [0.2, 0, 0.2],
                            scale: [1, 1.3, 1],
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>

                      <div className="flex-1">
                        <h3 className="font-bold text-base text-emerald-900">Frigy</h3>
                        <p className="text-xs text-emerald-600">Dein KI-Assistent</p>
                      </div>

                      {/* Close button */}
                      <motion.button
                        onClick={handleSkip}
                        className="p-2 hover:bg-emerald-200/50 rounded-lg transition-colors ml-auto"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronRight className="w-4 h-4 text-emerald-600 rotate-90" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Messages Container */}
                  <div className="p-4 min-h-[120px] max-h-[300px] overflow-y-auto space-y-3">
                    <AnimatePresence mode="wait">
                      {messages.slice(0, currentMessageIndex).map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10, x: -20 }}
                          animate={{ opacity: 1, y: 0, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex gap-2"
                        >
                          <div className="flex-shrink-0">
                            <motion.div
                              className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Bot className="w-3.5 h-3.5 text-white" />
                            </motion.div>
                          </div>
                          <motion.div
                            className="flex-1 bg-gradient-to-br from-white/80 to-emerald-50/60 rounded-2xl p-3 border border-emerald-200/50"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p className="text-sm text-emerald-900 leading-relaxed">
                              {message.text}
                            </p>
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    {showTyping && currentMessageIndex < messages.length && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 bg-gradient-to-br from-white/80 to-emerald-50/60 rounded-2xl p-3 flex gap-1.5 items-center border border-emerald-200/50">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-emerald-400"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ delay: i * 0.1, repeat: Infinity, duration: 0.6 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Footer / Actions */}
                  {!showTyping && (
                    <motion.div
                      className="p-4 bg-gradient-to-t from-emerald-100/40 to-transparent border-t border-emerald-200/40 space-y-2"
                      style={{ borderRadius: '0 0 24px 0' }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Button
                        onClick={handleNext}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                      >
                        Los geht's! 🚀
                      </Button>
                      <Button
                        onClick={handleSkip}
                        variant="ghost"
                        className="w-full text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/50"
                      >
                        Später
                      </Button>
                    </motion.div>
                  )}
                </motion.div>

                {/* Thought Bubble Tail - Three animated dots */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex gap-2 pointer-events-none">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 border border-emerald-200/60 shadow-md"
                    animate={{ 
                      y: [0, 3, 0],
                      scale: [0.95, 1, 0.95]
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 border border-emerald-200/60 shadow-md"
                    animate={{ 
                      y: [0, 3, 0],
                      scale: [0.95, 1, 0.95]
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2
                    }}
                  />
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 border border-emerald-200/60 shadow-md"
                    animate={{ 
                      y: [0, 3, 0],
                      scale: [0.95, 1, 0.95]
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
