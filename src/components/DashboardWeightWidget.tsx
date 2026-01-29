import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scale, ArrowUp, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface DashboardWeightWidgetProps {
  onWeightUpdate?: (weight: number) => void;
  targetWeight?: number;
}

interface WeightEntry {
  id: string;
  weight: number;
  recorded_at: string;
}

export const DashboardWeightWidget = ({ onWeightUpdate, targetWeight }: DashboardWeightWidgetProps) => {
  const { user } = useAuth();
  const { settings } = useTrackerSettings();
  const navigate = useNavigate();
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [previousWeight, setPreviousWeight] = useState<number | null>(null);
  const [inputWeight, setInputWeight] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [initialWeight, setInitialWeight] = useState<number | null>(null);
  const [weightHistory, setWeightHistory] = useState<number[]>([]);

  const goal = targetWeight || settings?.targetWeight || 70;

  // Load weight entries on mount
  useEffect(() => {
    if (!user) return;

    const loadWeights = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('weight_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: true });

        if (error) {
          console.error('Error loading weight entries:', error);
          return;
        }

        if (data && data.length > 0) {
          const weights = data.map((entry: WeightEntry) => entry.weight);
          setWeightHistory(weights);

          // Set initial weight (oldest entry)
          setInitialWeight(weights[0]);

          // Set current weight (newest entry)
          const latest = data[data.length - 1] as WeightEntry;
          setCurrentWeight(latest.weight);
          setLastUpdated(latest.recorded_at);

          if (data.length > 1) {
            const previous = data[data.length - 2] as WeightEntry;
            setPreviousWeight(previous.weight);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadWeights();
  }, [user]);

  const handleAddWeight = async () => {
    if (!inputWeight || !user) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib dein Gewicht ein',
        variant: 'destructive',
      });
      return;
    }

    const weight = parseFloat(inputWeight);
    if (isNaN(weight) || weight < 20 || weight > 500) {
      toast({
        title: 'Ungültiges Gewicht',
        description: 'Gewicht muss zwischen 20kg und 500kg liegen',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from('weight_entries').insert({
        user_id: user.id,
        weight,
        recorded_at: new Date().toISOString(),
      } as any);

      if (error) throw error;

      // Update local state
      setPreviousWeight(currentWeight);
      setCurrentWeight(weight);
      setLastUpdated(new Date().toISOString());
      setInputWeight('');

      // Add to weight history
      setWeightHistory([...weightHistory, weight]);

      onWeightUpdate?.(weight);

      toast({
        title: '✅ Gewicht eingetragen!',
        description: `${weight}kg erfolgreich gespeichert`,
      });
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Gewicht konnte nicht gespeichert werden',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const weightChange = currentWeight && previousWeight ? currentWeight - previousWeight : null;
  // Only show red if below initial weight, only show green if above/equal to initial weight
  const isBelowInitial = currentWeight && initialWeight ? currentWeight < initialWeight : false;
  const isAboveInitial = currentWeight && initialWeight ? currentWeight >= initialWeight : false;
  const progressToGoal = currentWeight && goal ? Math.max(0, 100 - (Math.abs(goal - currentWeight) / Math.abs(goal)) * 100) : 0;

  const handleCardClick = () => {
    if (!isAdding) {
      navigate('/meal-plans?tab=progress');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: 0.15, duration: 0.4 }}
      onClick={handleCardClick}
    >
      <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg border border-blue-500/20 cursor-pointer active:scale-[0.99] transition-transform">
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30">
            <Scale className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="font-semibold text-sm">Gewichtsverlauf</h3>
        </div>

        {/* Top Section: Current Weight + Goal + Change */}
        <div className="flex items-start justify-between mb-4">
          {/* Left: Current Weight & Goal */}
          {currentWeight !== null ? (
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Aktuell</p>
                <p className="text-3xl font-bold text-blue-600">{currentWeight}<span className="text-sm">kg</span></p>
              </div>
              <div className="border-l border-blue-300/50" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Ziel</p>
                <p className="text-3xl font-bold text-muted-foreground">{goal}<span className="text-sm">kg</span></p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Noch kein Gewicht eingetragen</p>
          )}

          {/* Right: Change Indicator with Animation */}
          {currentWeight && weightChange !== null && (
            <motion.div
              className="text-right"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <motion.div
                className={`flex items-center justify-end gap-1 mb-2 ${isBelowInitial ? 'text-red-500' : 'text-green-600'}`}
                animate={isBelowInitial ? { y: [0, -6, 0] } : { y: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={isBelowInitial ? { y: -4 } : { y: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowUp className={`h-4 w-4 ${isBelowInitial ? 'text-red-500' : 'text-green-600'}`} />
                </motion.div>
                <span className="font-semibold text-sm">
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg
                </span>
              </motion.div>
              <p className="text-xs text-muted-foreground">
                {lastUpdated ? new Date(lastUpdated).toLocaleDateString('de-DE') : ''}
              </p>
            </motion.div>
          )}
        </div>

        {/* Mini Weight Chart with Fade Out */}
        {weightHistory.length > 1 && (
          <div className="mb-4 relative">
            <p className="text-xs text-muted-foreground mb-2">Verlauf</p>
            <div className="h-28 relative overflow-hidden rounded-lg">
              {/* Fade out overlay on both sides */}
              <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-card pointer-events-none z-10" />

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weightHistory.map((weight, index, arr) => {
                    let date = '';
                    if (index < arr.length) {
                      const d = new Date();
                      d.setDate(d.getDate() - (arr.length - 1 - index));
                      date = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                    }
                    return {
                      date,
                      weight,
                    };
                  })}
                  margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="dashWeightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, dx: -5 }}
                    width={35}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Area
                    type="natural"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#dashWeightGradient)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {currentWeight !== null && (
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-muted-foreground">Fortschritt zum Ziel</span>
              <span className="text-xs font-semibold text-blue-600">
                {Math.abs(goal - currentWeight).toFixed(1)}kg verbleibend
              </span>
            </div>
            <div className="h-2 bg-background/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.abs(progressToGoal), 100)}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        )}

        {/* Input Form */}
        {isAdding ? (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              type="number"
              placeholder="z.B. 75.5"
              value={inputWeight}
              onChange={(e) => setInputWeight(e.target.value)}
              step={0.1}
              min={20}
              max={500}
              className="text-center"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddWeight();
                }}
                disabled={!inputWeight}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                size="sm"
              >
                Speichern
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAdding(false);
                  setInputWeight('');
                }}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </motion.div>
        ) : (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
            className="w-full gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Gewicht hinzufügen
          </Button>
        )}
      </Card>
    </motion.div>
  );
};
