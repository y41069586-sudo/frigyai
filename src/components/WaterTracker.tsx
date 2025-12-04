import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const DAILY_GOAL = 8; // 8 glasses = ~2L

export const WaterTracker = () => {
  const { user } = useAuth();
  const [glasses, setGlasses] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
    } else if (newGlasses >= DAILY_GOAL && glasses < DAILY_GOAL) {
      toast({ title: '🎉 Tagesziel erreicht!', description: 'Super gemacht!' });
    }
    
    setIsLoading(false);
  };

  const progress = (glasses / DAILY_GOAL) * 100;

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-400" />
          Wasser-Tracker
        </h4>
        <span className="text-sm text-muted-foreground">{glasses}/{DAILY_GOAL} Gläser</span>
      </div>

      {/* Water visualization */}
      <div className="relative h-32 bg-background/50 rounded-xl overflow-hidden mb-4">
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500/80 to-blue-400/60"
          initial={{ height: 0 }}
          animate={{ height: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold">{glasses}</p>
            <p className="text-xs text-muted-foreground">Gläser heute</p>
          </div>
        </div>
        {progress >= 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full"
          >
            ✓ Ziel
          </motion.div>
        )}
      </div>

      {/* Glass icons */}
      <div className="flex flex-wrap gap-1 justify-center mb-4">
        {Array.from({ length: DAILY_GOAL }).map((_, i) => (
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
          <Plus className="h-4 w-4 mr-1" /> Glas trinken
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
        ~250ml pro Glas • Ziel: 2 Liter täglich
      </p>
    </Card>
  );
};
