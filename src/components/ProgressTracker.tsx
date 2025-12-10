import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingDown, Plus, Trash2, Target, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGamification } from '@/hooks/useGamification';

interface WeightEntry {
  id: string;
  weight: number;
  recorded_at: string;
}

export const ProgressTracker = () => {
  const { user } = useAuth();
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
      toast({ title: 'Ungültiges Gewicht', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from('weight_entries')
      .insert({ user_id: user.id, weight });

    if (error) {
      toast({ title: 'Fehler', description: 'Konnte Eintrag nicht speichern', variant: 'destructive' });
    } else {
      toast({ title: 'Gewicht eingetragen!' });
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
      toast({ title: 'Fehler', variant: 'destructive' });
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
          Gewichtsverlauf
        </h3>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-background/50 rounded-xl">
            <p className="text-2xl font-bold text-primary">{currentWeight?.toFixed(1) || '--'}</p>
            <p className="text-xs text-muted-foreground">Aktuell (kg)</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-xl">
            <p className="text-2xl font-bold text-green-500">
              {weightLost !== null ? `-${weightLost.toFixed(1)}` : '--'}
            </p>
            <p className="text-xs text-muted-foreground">Verloren (kg)</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-xl">
            <p className="text-2xl font-bold">{targetWeight?.toFixed(1) || '--'}</p>
            <p className="text-xs text-muted-foreground">Ziel (kg)</p>
          </div>
        </div>

        {/* Progress Bar */}
        {targetWeight && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Fortschritt zum Ziel</span>
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
                <span className="text-sm font-medium">Ziel erreicht! 🎉</span>
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="h-48 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--primary) / 0.3)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Add Entry */}
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Gewicht in kg"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="flex-1"
            step="0.1"
            min="30"
            max="300"
          />
          <Button onClick={addEntry} disabled={isLoading || !newWeight} className="glow-button">
            <Plus className="h-4 w-4 mr-1" /> Eintragen
          </Button>
        </div>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {entries.slice().reverse().slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-2 bg-background/30 rounded-lg">
                <div>
                  <span className="font-medium">{entry.weight} kg</span>
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
