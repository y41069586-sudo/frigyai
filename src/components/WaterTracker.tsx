import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Droplets, Plus, Minus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGamification } from '@/hooks/useGamification';
import { useSoundEffects } from '@/hooks/useSoundEffects';

const ML_PER_CUP = 200;

// Cup icon component
const CupIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" fill={filled ? "currentColor" : "none"} />
  </svg>
);

export const WaterTracker = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { recordActivity, checkAndAwardBadge } = useGamification();
  const { playWaterDrop, playGoalReached } = useSoundEffects();
  const [cups, setCups] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10); // Default 10 cups = 2L
  const [tempGoal, setTempGoal] = useState(10);

  useEffect(() => {
    // Load saved goal from localStorage
    const savedGoal = localStorage.getItem('waterDailyGoalCups');
    if (savedGoal) {
      const goal = parseInt(savedGoal);
      setDailyGoal(goal);
      setTempGoal(goal);
    }
    
    if (user) {
      loadTodayIntake();
    }
  }, [user]);

  const loadTodayIntake = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('water_intake')
      .select('glasses')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (!error && data) {
      setCups(data.glasses);
    }
  };

  const updateIntake = async (change: number) => {
    if (!user) return;
    
    const newCups = Math.max(0, Math.min(20, cups + change));
    const today = new Date().toISOString().split('T')[0];
    
    setIsLoading(true);
    setCups(newCups);

    const { error } = await supabase
      .from('water_intake')
      .upsert(
        { user_id: user.id, date: today, glasses: newCups },
        { onConflict: 'user_id,date' }
      );

    if (error) {
      console.error('Error updating water intake:', error);
      setCups(cups); // Revert on error
      toast({ title: t.error, variant: 'destructive' });
    } else {
      const mlDrunk = newCups * ML_PER_CUP;
      if (change > 0) {
        playWaterDrop();
        toast({ 
          title: t.waterAdded, 
          description: `${mlDrunk}ml ${t.today.toLowerCase()}` 
        });
        recordActivity();
      }
      if (newCups >= dailyGoal && cups < dailyGoal) {
        playGoalReached();
        toast({ title: `🎉 ${t.dailyGoalReached}`, description: t.wellDone });
        checkAndAwardBadge('water_goal');
      }
    }
    
    setIsLoading(false);
  };

  const saveGoal = () => {
    if (tempGoal >= 1 && tempGoal <= 20) {
      setDailyGoal(tempGoal);
      localStorage.setItem('waterDailyGoalCups', tempGoal.toString());
      toast({ title: t.goalSaved, description: `${tempGoal} Tassen (${tempGoal * ML_PER_CUP}ml) ${t.perDay}` });
    }
  };

  const progress = (cups / dailyGoal) * 100;
  const mlDrunk = cups * ML_PER_CUP;
  const mlGoal = dailyGoal * ML_PER_CUP;

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-400" />
          {t.waterTracker}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{cups}/{dailyGoal} {t.cups}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h5 className="font-medium">{t.setDailyGoal}</h5>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={tempGoal}
                    onChange={(e) => setTempGoal(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">{t.cups}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  = {tempGoal * ML_PER_CUP}ml {t.perDay}
                </p>
                <Button onClick={saveGoal} size="sm" className="w-full">
                  {t.save}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Water visualization */}
      <div className="relative h-32 bg-background/50 rounded-xl overflow-hidden mb-4">
        {/* Animated water fill */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600/90 via-blue-500/70 to-blue-400/50"
          initial={{ height: 0 }}
          animate={{ height: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Animated waves */}
          <svg className="absolute top-0 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none" style={{ height: '12px', transform: 'translateY(-50%)' }}>
            <motion.path
              d="M0 5 Q 12.5 0, 25 5 T 50 5 T 75 5 T 100 5 V 10 H 0 Z"
              fill="hsl(200 80% 55% / 0.8)"
              animate={{ d: [
                "M0 5 Q 12.5 0, 25 5 T 50 5 T 75 5 T 100 5 V 10 H 0 Z",
                "M0 5 Q 12.5 10, 25 5 T 50 5 T 75 5 T 100 5 V 10 H 0 Z",
                "M0 5 Q 12.5 0, 25 5 T 50 5 T 75 5 T 100 5 V 10 H 0 Z"
              ]}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
          <svg className="absolute top-0 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none" style={{ height: '10px', transform: 'translateY(-30%)' }}>
            <motion.path
              d="M0 5 Q 12.5 8, 25 5 T 50 5 T 75 5 T 100 5 V 10 H 0 Z"
              fill="hsl(200 70% 60% / 0.5)"
              animate={{ d: [
                "M0 5 Q 12.5 8, 25 5 T 50 5 T 75 5 T 100 5 V 10 H 0 Z",
                "M0 5 Q 12.5 2, 25 5 T 50 5 T 75 5 T 100 5 V 10 H 0 Z",
                "M0 5 Q 12.5 8, 25 5 T 50 5 T 75 5 T 100 5 V 10 H 0 Z"
              ]}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </svg>
          
          {/* Bubbles */}
          {progress > 20 && (
            <>
              <motion.div
                className="absolute w-2 h-2 bg-white/40 rounded-full"
                style={{ left: '20%' }}
                animate={{ y: [0, -30, -60], opacity: [0.6, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="absolute w-1.5 h-1.5 bg-white/30 rounded-full"
                style={{ left: '50%' }}
                animate={{ y: [0, -25, -50], opacity: [0.5, 0.2, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div
                className="absolute w-1 h-1 bg-white/35 rounded-full"
                style={{ left: '75%' }}
                animate={{ y: [0, -35, -70], opacity: [0.6, 0.3, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 1 }}
              />
            </>
          )}
        </motion.div>
        
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <p className="text-3xl font-bold drop-shadow-lg">{mlDrunk}ml</p>
            <p className="text-xs text-muted-foreground">{t.ofGoal} {mlGoal}ml</p>
          </div>
        </div>
        {progress >= 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10"
          >
            ✓ {t.goal}
          </motion.div>
        )}
      </div>

      {/* Cup icons - simple, no weird animations */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {Array.from({ length: dailyGoal }).map((_, i) => (
          <div
            key={i}
            className={`transition-all duration-200 ${
              i < cups 
                ? 'text-blue-400 scale-100 opacity-100' 
                : 'text-muted-foreground/30 scale-90 opacity-40'
            }`}
          >
            <CupIcon className="w-7 h-7" filled={i < cups} />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateIntake(-1)}
          disabled={isLoading || cups <= 0}
          className="rounded-full"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => updateIntake(1)}
          disabled={isLoading}
          className="glow-button px-6"
        >
          <CupIcon className="h-4 w-4 mr-1" /> +{ML_PER_CUP}ml
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateIntake(1)}
          disabled={isLoading}
          className="rounded-full"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-3">
        {ML_PER_CUP}{t.mlPerCup} • {t.goal}: {mlGoal / 1000}L
      </p>
    </Card>
  );
};
