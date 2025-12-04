import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Droplets, Plus, Minus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ML_PER_GLASS = 250;

export const WaterTracker = () => {
  const { user } = useAuth();
  const [glasses, setGlasses] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(8); // Default 8 glasses = 2L
  const [tempGoal, setTempGoal] = useState(8);

  useEffect(() => {
    // Load saved goal from localStorage
    const savedGoal = localStorage.getItem('waterDailyGoal');
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
      setGlasses(data.glasses);
    }
  };

  const updateIntake = async (change: number) => {
    if (!user) return;
    
    const newGlasses = Math.max(0, Math.min(20, glasses + change));
    const today = new Date().toISOString().split('T')[0];
    
    setIsLoading(true);
    setGlasses(newGlasses);

    const { error } = await supabase
      .from('water_intake')
      .upsert(
        { user_id: user.id, date: today, glasses: newGlasses },
        { onConflict: 'user_id,date' }
      );

    if (error) {
      console.error('Error updating water intake:', error);
      setGlasses(glasses); // Revert on error
      toast({ title: 'Fehler', variant: 'destructive' });
    } else {
      const mlDrunk = newGlasses * ML_PER_GLASS;
      if (change > 0) {
        toast({ 
          title: `+${ML_PER_GLASS}ml getrunken! 💧`, 
          description: `Schon ${mlDrunk}ml heute` 
        });
      }
      if (newGlasses >= dailyGoal && glasses < dailyGoal) {
        toast({ title: '🎉 Tagesziel erreicht!', description: 'Super gemacht!' });
      }
    }
    
    setIsLoading(false);
  };

  const saveGoal = () => {
    if (tempGoal >= 1 && tempGoal <= 20) {
      setDailyGoal(tempGoal);
      localStorage.setItem('waterDailyGoal', tempGoal.toString());
      toast({ title: 'Ziel gespeichert', description: `${tempGoal} Gläser (${tempGoal * ML_PER_GLASS}ml) pro Tag` });
    }
  };

  const progress = (glasses / dailyGoal) * 100;
  const mlDrunk = glasses * ML_PER_GLASS;
  const mlGoal = dailyGoal * ML_PER_GLASS;

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-400" />
          Wasser-Tracker
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{glasses}/{dailyGoal} Gläser</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h5 className="font-medium">Tagesziel einstellen</h5>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={tempGoal}
                    onChange={(e) => setTempGoal(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">Gläser</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  = {tempGoal * ML_PER_GLASS}ml pro Tag
                </p>
                <Button onClick={saveGoal} size="sm" className="w-full">
                  Speichern
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
            <p className="text-xs text-muted-foreground">von {mlGoal}ml</p>
          </div>
        </div>
        {progress >= 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10"
          >
            ✓ Ziel
          </motion.div>
        )}
      </div>

      {/* Glass icons */}
      <div className="flex flex-wrap gap-1 justify-center mb-4">
        {Array.from({ length: dailyGoal }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ 
              scale: i < glasses ? 1 : 0.8, 
              opacity: i < glasses ? 1 : 0.3 
            }}
            className={`w-6 h-8 rounded-b-lg border-2 ${
              i < glasses 
                ? 'bg-blue-400/80 border-blue-500' 
                : 'bg-transparent border-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateIntake(-1)}
          disabled={isLoading || glasses <= 0}
          className="rounded-full"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => updateIntake(1)}
          disabled={isLoading}
          className="glow-button px-6"
        >
          <Plus className="h-4 w-4 mr-1" /> +{ML_PER_GLASS}ml
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
        {ML_PER_GLASS}ml pro Glas • Ziel: {mlGoal / 1000}L täglich
      </p>
    </Card>
  );
};
