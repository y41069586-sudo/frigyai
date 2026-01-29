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
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [previousWeight, setPreviousWeight] = useState<number | null>(null);
  const [inputWeight, setInputWeight] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

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
          .order('recorded_at', { ascending: false })
          .limit(2);

        if (error) {
          console.error('Error loading weight entries:', error);
          return;
        }

        if (data && data.length > 0) {
          const latest = data[0] as WeightEntry;
          setCurrentWeight(latest.weight);
          setLastUpdated(latest.recorded_at);
          
          if (data.length > 1) {
            const previous = data[1] as WeightEntry;
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
  const isWeightLoss = weightChange !== null && weightChange < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: 0.15, duration: 0.4 }}
    >
      <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <Scale className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Gewichtsverlauf</p>
              <p className="text-xs text-muted-foreground">
                {lastUpdated ? new Date(lastUpdated).toLocaleDateString('de-DE') : 'Kein Eintrag'}
              </p>
            </div>
          </div>

          {currentWeight && weightChange !== null && (
            <motion.div
              className={`text-right ${isWeightLoss ? 'text-green-600' : 'text-red-600'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-1 justify-end">
                <TrendingDown className="h-4 w-4" />
                <span className="font-semibold text-sm">
                  {isWeightLoss ? '-' : '+'}{Math.abs(weightChange).toFixed(1)}kg
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Current Weight Display */}
        {currentWeight !== null ? (
          <motion.div
            className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-xs text-muted-foreground mb-1">Aktuelles Gewicht</p>
            <p className="text-2xl font-bold text-primary">{currentWeight}kg</p>
          </motion.div>
        ) : (
          <motion.div
            className="mb-4 p-3 rounded-xl bg-muted/30 border border-border/50"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
          >
            <p className="text-sm text-muted-foreground">Noch kein Gewicht eingetragen</p>
          </motion.div>
        )}

        {/* Input Form */}
        {isAdding ? (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
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
                onClick={handleAddWeight}
                disabled={!inputWeight}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                size="sm"
              >
                Speichern
              </Button>
              <Button
                onClick={() => {
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
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full gap-2"
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
