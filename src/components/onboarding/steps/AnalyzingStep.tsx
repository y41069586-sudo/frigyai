import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { StepCard } from "../components";

// Analysis Step component
const AnalysisStepItem = ({ text, delay }: { text: string; delay: number }) => {
  const [status, setStatus] = useState<'waiting' | 'loading' | 'done'>('waiting');
  
  useEffect(() => {
    const loadTimer = setTimeout(() => setStatus('loading'), delay);
    const doneTimer = setTimeout(() => setStatus('done'), delay + 600);
    return () => { clearTimeout(loadTimer); clearTimeout(doneTimer); };
  }, [delay]);
  
  return (
    <motion.div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
        status === 'done' 
          ? 'bg-primary/10 border border-primary/30' 
          : status === 'loading'
            ? 'bg-muted/50 border border-border'
            : 'bg-transparent border border-transparent'
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay / 1000, duration: 0.3 }}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        {status === 'waiting' && <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
        {status === 'loading' && (
          <motion.div
            className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
          />
        )}
        {status === 'done' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}
      </div>
      <span className={`text-sm transition-colors ${status === 'done' ? 'text-primary font-medium' : 'text-muted-foreground/60'}`}>
        {text}
      </span>
      {status === 'done' && (
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto text-xs text-primary">✓</motion.span>
      )}
    </motion.div>
  );
};

// Analysis Progress Counter
const AnalysisProgress = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const milestones = [
      { time: 1200, target: 20 }, { time: 2800, target: 40 },
      { time: 4400, target: 60 }, { time: 6000, target: 80 },
      { time: 7600, target: 95 }, { time: 8400, target: 100 },
    ];
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let targetProgress = 0;
      
      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        const prevMilestone = milestones[i - 1] || { time: 0, target: 0 };
        if (elapsed <= milestone.time) {
          const timeInSegment = elapsed - prevMilestone.time;
          const segmentDuration = milestone.time - prevMilestone.time;
          const segmentProgress = milestone.target - prevMilestone.target;
          const fraction = timeInSegment / segmentDuration;
          const eased = fraction * fraction * (3 - 2 * fraction);
          targetProgress = prevMilestone.target + (segmentProgress * eased);
          break;
        }
        targetProgress = milestone.target;
      }
      
      setProgress(Math.round(targetProgress));
      if (elapsed >= 8400) clearInterval(interval);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  return <span>{progress}%</span>;
};

export const AnalyzingStep = () => {
  const analysisSteps = [
    { id: 1, text: "Ziele werden analysiert", delay: 0 },
    { id: 2, text: "Körperdaten verarbeiten", delay: 1600 },
    { id: 3, text: "Zielgewicht berechnen", delay: 3200 },
    { id: 4, text: "Optimale Makros ermitteln", delay: 4800 },
    { id: 5, text: "Plan wird erstellt", delay: 6400 },
  ];
  
  return (
    <StepCard step="analyzing">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div
          className="relative w-28 h-28 mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-primary/40"
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">🧠</span>
          </div>
        </motion.div>
        
        <motion.h1 
          className="text-2xl font-bold mb-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Analysiere dein Profil...
        </motion.h1>
        
        <motion.div
          className="text-5xl font-bold text-primary mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <AnalysisProgress />
        </motion.div>
        
        <div className="w-full max-w-sm space-y-3">
          {analysisSteps.map((step) => (
            <AnalysisStepItem key={step.id} text={step.text} delay={step.delay} />
          ))}
        </div>
      </div>
    </StepCard>
  );
};
