import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, X, Sparkles, User, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatbotProps {
  userProfile?: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
    weight: number;
    targetWeight: number;
  } | null;
  onResetTracker?: () => void;
  onRegenerateMealPlan?: () => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  /** Beim Setzen: Chat öffnen und diese Nachricht senden (z. B. vom Dashboard-Prompt) */
  bootstrapMessage?: string | null;
  onBootstrapConsumed?: () => void;
}

export const AIChatbot = ({
  userProfile,
  onResetTracker,
  onRegenerateMealPlan,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  bootstrapMessage,
  onBootstrapConsumed,
}: AIChatbotProps) => {
  // All hooks MUST be called unconditionally, before any conditional returns
  const { session } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isMobile ? 'auto' : 'smooth' });
  }, [isMobile, messages]);

  // Use external state if provided, otherwise use local state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : localIsOpen;
  const setIsOpen = externalSetIsOpen || setLocalIsOpen;

  const processActions = (response: string): string => {
    let processedResponse = response;

    // Check for reset tracker action
    if (processedResponse.includes('[ACTION:RESET_TRACKER]')) {
      if (onResetTracker) {
        onResetTracker();
        toast({
          title: t.trackerReset || "Tracker zurückgesetzt",
          description: t.goalsReset || "Deine Ziele wurden zurückgesetzt",
        });
      }
      processedResponse = processedResponse.replace('[ACTION:RESET_TRACKER]', '').trim();
    }

    // Check for dark mode toggle action
    if (processedResponse.includes('[ACTION:TOGGLE_DARK_MODE:ON]')) {
      setTheme('dark');
      toast({
        title: "🌙 Dark Mode aktiviert",
        description: "Deine App ist jetzt im dunklen Modus",
      });
      processedResponse = processedResponse.replace('[ACTION:TOGGLE_DARK_MODE:ON]', '').trim();
    }

    if (processedResponse.includes('[ACTION:TOGGLE_DARK_MODE:OFF]')) {
      setTheme('light');
      toast({
        title: "☀️ Light Mode aktiviert",
        description: "Deine App ist jetzt im hellen Modus",
      });
      processedResponse = processedResponse.replace('[ACTION:TOGGLE_DARK_MODE:OFF]', '').trim();
    }

    // Check for meal plan regeneration action
    if (processedResponse.includes('[ACTION:REGENERATE_MEAL_PLAN]')) {
      if (onRegenerateMealPlan) {
        onRegenerateMealPlan();
        toast({
          title: "📋 Neuer Wochenplan",
          description: "Dein Wochenplan wird generiert",
        });
      }
      processedResponse = processedResponse.replace('[ACTION:REGENERATE_MEAL_PLAN]', '').trim();
    }

    return processedResponse;
  };

  const sendMessageWithText = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        headers: session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : undefined,
        body: {
          message: trimmed,
          userProfile: userProfile,
          history: messages.slice(-10),
        },
      });

      if (error) throw error;

      const aiResponse = data?.message || data?.response || "";
      if (!aiResponse) throw new Error("Leere Antwort");

      const processedResponse = processActions(aiResponse);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: processedResponse,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: t.couldNotProcess,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageWithTextRef = useRef(sendMessageWithText);
  sendMessageWithTextRef.current = sendMessageWithText;

  useEffect(() => {
    if (!bootstrapMessage?.trim() || !isOpen) return;
    const msg = bootstrapMessage.trim();
    onBootstrapConsumed?.();
    void sendMessageWithTextRef.current(msg);
  }, [bootstrapMessage, isOpen, onBootstrapConsumed]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessageWithText(input);
  };

  return (
    <>
      {/* Floating Chat Button - Top Right Corner */}
      {externalIsOpen === undefined && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-20 z-[60] p-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-xl ring-4 ring-emerald-200/50"
          whileHover={isMobile ? undefined : { scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          initial={isMobile ? { opacity: 0 } : { scale: 0, opacity: 0 }}
          animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
          transition={{ duration: isMobile ? 0.12 : 0.2 }}
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-background animate-pulse" />
        </motion.button>
      )}

      {/* Chat Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="KI-Chat schließen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: isMobile ? 0.12 : 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/45"
            />
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 48, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed z-[51] flex flex-col gpu-smooth left-3 right-3 md:left-auto md:right-4 md:w-[28rem] top-[max(4.75rem,env(safe-area-inset-top,0px)+3.25rem)] bottom-[max(5.25rem,env(safe-area-inset-bottom,0px)+4.75rem)]"
            >
            <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border-slate-200/90 bg-gradient-to-br from-white to-emerald-50/30 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]">
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-emerald-200/40 bg-gradient-to-r from-emerald-100/60 to-green-50/40 p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-emerald-200/50">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-emerald-900">{t.aiAdvisor}</h3>
                    <p className="text-xs text-emerald-600">{t.yourNutritionExpert}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-emerald-200/50">
                  <X className="h-5 w-5 text-emerald-600" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
                {messages.length === 0 && (
                  <div className="text-center text-emerald-600 py-8">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                    <p className="text-sm text-emerald-800">{t.helloImAI}</p>
                    <p className="text-xs mt-1 text-emerald-600">{t.askAboutRecipes}</p>
                    {userProfile && (
                      <div className="mt-4 p-3 bg-emerald-100/60 rounded-lg text-xs border border-emerald-200/50">
                        <p className="font-medium text-emerald-700">{t.yourGoalLabel}:</p>
                        <p className="text-emerald-600">{userProfile.dailyCalories} kcal • {userProfile.dailyProtein}g {t.protein}</p>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={isMobile ? false : { opacity: 0, y: 10 }}
                    animate={isMobile ? undefined : { opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="p-1.5 rounded-full bg-emerald-200/50 h-fit">
                        <Bot className="h-4 w-4 text-emerald-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-emerald-500 text-white rounded-br-sm'
                          : 'bg-emerald-100/50 text-emerald-900 border border-emerald-200/50 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="p-1.5 rounded-full bg-emerald-100/50 border border-emerald-200/50 h-fit">
                        <User className="h-4 w-4 text-emerald-600" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2"
                  >
                    <div className="p-1.5 rounded-full bg-emerald-200/50">
                      <Bot className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="bg-emerald-100/50 p-3 rounded-2xl rounded-bl-sm border border-emerald-200/50">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-emerald-200/40 bg-gradient-to-t from-emerald-50/40 pb-[max(1rem,env(safe-area-inset-bottom,0px)+0.75rem)]">
                <div className="flex gap-2">
                  <Input
                    placeholder={t.askMeSomething}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={isLoading}
                    className="flex-1 border-emerald-200/40 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
