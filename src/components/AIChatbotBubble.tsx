import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIChatbotBubbleProps {
  onComplete?: () => void;
  isVisible?: boolean;
  position?: 'bottom-right' | 'center';
}

export const AIChatbotBubble = ({ 
  onComplete, 
  isVisible = true,
  position = 'bottom-right'
}: AIChatbotBubbleProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showTyping, setShowTyping] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    localStorage.setItem('aiBubbleShown', 'true');
    onComplete?.();
  };

  const handleNext = () => {
    handleSkip();
  };

  const toggleSpeech = () => {
    setIsSpeaking(!isSpeaking);
  };

  if (!isVisible) return null;

  const containerClasses = position === 'center' 
    ? 'fixed inset-0 z-50 flex items-center justify-center p-4'
    : 'fixed bottom-6 right-6 z-50';

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
              {/* Bubble Container */}
              <motion.div
                className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl rounded-3xl border border-blue-500/30 shadow-2xl overflow-hidden"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 32px rgba(31, 38, 135, 0.15)'
                }}
              >
                {/* Header with Bot Avatar */}
                <div className="relative p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/10 border-b border-blue-500/20">
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
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg relative"
                        style={{
                          boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
                        }}
                      >
                        <Bot className="w-6 h-6 text-white" />
                      </motion.div>
                      
                      {/* Pulsing glow */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-blue-500"
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
                      <h3 className="font-bold text-base text-foreground">Frigy AI</h3>
                      <p className="text-xs text-muted-foreground">Dein KI-Assistent</p>
                    </div>

                    {/* Close button */}
                    <motion.button
                      onClick={handleSkip}
                      className="p-2 hover:bg-primary/10 rounded-lg transition-colors ml-auto"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
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
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </div>
                        <motion.div
                          className="flex-1 bg-gradient-to-br from-blue-500/15 to-purple-500/10 rounded-2xl p-3 border border-blue-500/20"
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-sm text-foreground leading-relaxed">
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
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 bg-gradient-to-br from-blue-500/15 to-purple-500/10 rounded-2xl p-3 flex gap-1.5 items-center border border-blue-500/20">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary/60"
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
                    className="p-4 bg-gradient-to-t from-blue-500/5 to-transparent border-t border-blue-500/20 space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Button
                      onClick={handleNext}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      Los geht's! 🚀
                    </Button>
                    <Button
                      onClick={handleSkip}
                      variant="ghost"
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      Später
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
