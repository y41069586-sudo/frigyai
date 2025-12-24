import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingDown, Plus, Trash2, Target, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useGamification } from '@/hooks/useGamification';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeightEntry {
  id: string;
  weight: number;
  recorded_at: string;
}

export const ProgressTracker = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { recordActivity, checkAndAwardBadge } = useGamification();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [startWeight, setStartWeight] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadEntries();
      loadProfile();
    }
  }, [user]);

  const loadProfile = () => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const data = JSON.parse(profile);
      // MacroTracker saves: weight (current) and targetWeight (goal)
      setStartWeight(data.weight);
      setTargetWeight(data.targetWeight);
    }
  };

  const loadEntries = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: true });

    if (error) {
      console.error('Error loading entries:', error);
      return;
    }

    setEntries(data || []);
  };

  const addEntry = async () => {
    if (!user || !newWeight) return;
    
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 30 || weight > 300) {
      toast({ title: t.invalidWeight, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from('weight_entries')
      .insert({ user_id: user.id, weight });

    if (error) {
      toast({ title: t.error, description: t.toastError, variant: 'destructive' });
    } else {
      toast({ title: t.weightAdded });
      setNewWeight('');
      loadEntries();
      // Record activity for streak and award badge
      recordActivity();
      checkAndAwardBadge('weight_tracked');
    }
    setIsLoading(false);
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('weight_entries')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: t.error, variant: 'destructive' });
    } else {
      loadEntries();
    }
  };

  const chartData = entries.map(e => ({
    date: new Date(e.recorded_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    weight: e.weight,
  }));

  const currentWeight = entries.length > 0 ? entries[entries.length - 1].weight : startWeight;
  const weightLost = startWeight && currentWeight && entries.length > 0 ? Math.max(0, startWeight - currentWeight) : null;
  const progress = startWeight && targetWeight && currentWeight 
    ? Math.min(100, Math.max(0, ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100))
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="p-6 bg-card/80 backdrop-blur-lg border-primary/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          {t.weightProgress}
        </h3>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-background/50 rounded-xl">
            <p className="text-2xl font-bold text-primary">{currentWeight?.toFixed(1) || '--'}</p>
            <p className="text-xs text-muted-foreground">{t.current} ({t.kg})</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-xl">
            <p className="text-2xl font-bold text-green-500">
              {weightLost !== null ? `-${weightLost.toFixed(1)}` : '--'}
            </p>
            <p className="text-xs text-muted-foreground">{t.lost} ({t.kg})</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-xl">
            <p className="text-2xl font-bold">{targetWeight?.toFixed(1) || '--'}</p>
            <p className="text-xs text-muted-foreground">{t.goal} ({t.kg})</p>
          </div>
        </div>

        {/* Progress Bar */}
        {targetWeight && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t.progressToGoal}</span>
              <span className="text-sm font-medium text-primary">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-background rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/60"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            {progress >= 100 && (
              <div className="flex items-center gap-2 mt-2 text-green-500">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">{t.goalAchieved} 🎉</span>
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="h-52 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="progressWeightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, dy: 8 }}
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, dx: -5 }}
                  width={40}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl px-4 py-3 shadow-2xl">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                          <p className="text-xl font-bold text-foreground">
                            {Number(payload[0].value).toFixed(1)}
                            <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="natural"
                  dataKey="weight" 
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#progressWeightGradient)"
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: '#10b981',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 3
                  }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Add Entry */}
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={`${t.weight} (${t.kg})`}
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="flex-1"
            step="0.1"
            min="30"
            max="300"
          />
          <Button onClick={addEntry} disabled={isLoading || !newWeight} className="glow-button">
            <Plus className="h-4 w-4 mr-1" /> {t.addWeight}
          </Button>
        </div>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {entries.slice().reverse().slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-2 bg-background/30 rounded-lg">
                <div>
                  <span className="font-medium">{entry.weight} {t.kg}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(entry.recorded_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
};