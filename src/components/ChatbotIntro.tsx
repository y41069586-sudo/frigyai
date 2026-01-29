import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatbotIntroProps {
  onComplete: () => void;
  isVisible: boolean;
}

export const ChatbotIntro = ({ onComplete, isVisible }: ChatbotIntroProps) => {
  const [showMessage, setShowMessage] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    
    // Show chatbot after a short delay
    const timer = setTimeout(() => {
      setShowMessage(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [isVisible]);

  const messages = [
    "👋 Hallo! Ich bin dein Chatbot-Assistent!",
    "🎯 Ich kann dir bei deinen Ernährungszielen helfen",
    "💪 Ich verfolge dein Gewicht, dein Wasser-Intake und deine Makros",
    "🤖 Gib mir einfach Befehle und ich erfülle sie dir!",
    "⚡ Beispiele: 'Addiere 200g Hühnchen', 'Zeige mir mein Gewicht', 'Reset Tracker'",
  ];

  useEffect(() => {
    if (!showMessage || messageIndex >= messages.length) return;

    const timer = setTimeout(() => {
      setMessageIndex(prev => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [showMessage, messageIndex]);

  const handleSkip = () => {
    localStorage.setItem('chatbotIntroShown', 'true');
    onComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('chatbotIntroShown', 'true');
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Blurred Background */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
          />

          {/* Content Container */}
          <motion.div
            className="relative z-10 w-full max-w-md bg-gradient-to-b from-card to-card/80 rounded-3xl border border-primary/20 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b border-primary/20">
              <div className="flex items-center justify-between">
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  >
                    <Bot className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="font-bold text-lg text-foreground">Frigy Bot</h2>
                    <p className="text-xs text-muted-foreground">Dein KI-Assistent</p>
                  </div>
                </motion.div>

                <motion.button
                  onClick={handleSkip}
                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
              <AnimatePresence mode="wait">
                {messages.slice(0, messageIndex).map((message, index) => (
                  <motion.div
                    key={index}
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <motion.div
                      className="flex-1 bg-primary/10 rounded-xl p-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-sm text-foreground leading-relaxed">{message}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {showMessage && messageIndex < messages.length && (
                <motion.div
                  className="flex gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 bg-primary/10 rounded-xl p-3 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary/60"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ delay: i * 0.1, repeat: Infinity, duration: 0.6 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer / Actions */}
            {messageIndex >= messages.length && (
              <motion.div
                className="p-6 bg-gradient-to-t from-muted/30 to-transparent border-t border-primary/20 space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  Lass uns anfangen! 🚀
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="w-full"
                >
                  Später ansehen
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
