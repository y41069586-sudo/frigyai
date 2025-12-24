import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Beef, Wheat, Droplets, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

const FoodEntryDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Load entry from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('todayFood');
    if (saved && id) {
      const data = JSON.parse(saved);
      const foundEntry = data.entries?.find((e: FoodEntry) => e.id === id);
      if (foundEntry) {
        setEntry(foundEntry);
        setName(foundEntry.name);
        setCalories(foundEntry.calories);
        setProtein(foundEntry.protein);
        setCarbs(foundEntry.carbs);
        setFat(foundEntry.fat);
      }
    }
  }, [id]);

  const handleSave = () => {
    if (!entry) return;
    
    const saved = localStorage.getItem('todayFood');
    if (saved) {
      const data = JSON.parse(saved);
      const updatedEntries = data.entries.map((e: FoodEntry) =>
        e.id === entry.id
          ? { ...e, name, calories, protein, carbs, fat }
          : e
      );
      localStorage.setItem('todayFood', JSON.stringify({
        ...data,
        entries: updatedEntries,
      }));
      toast({ title: 'Gespeichert', description: `${name} wurde aktualisiert` });
      navigate('/meal-plans?tab=tracker');
    }
  };

  const handleDelete = () => {
    if (!entry) return;
    
    const saved = localStorage.getItem('todayFood');
    if (saved) {
      const data = JSON.parse(saved);
      const updatedEntries = data.entries.filter((e: FoodEntry) => e.id !== entry.id);
      localStorage.setItem('todayFood', JSON.stringify({
        ...data,
        entries: updatedEntries,
      }));
      toast({ title: 'Gelöscht', description: `${entry.name} wurde entfernt` });
      navigate('/meal-plans?tab=tracker');
    }
  };

  // Track changes
  useEffect(() => {
    if (entry) {
      const changed = 
        name !== entry.name ||
        calories !== entry.calories ||
        protein !== entry.protein ||
        carbs !== entry.carbs ||
        fat !== entry.fat;
      setHasChanges(changed);
    }
  }, [name, calories, protein, carbs, fat, entry]);

  if (!entry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Eintrag nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative h-56 bg-gradient-to-br from-primary/20 via-primary/10 to-background"
      >
        {/* Food Emoji as placeholder for photo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-28 h-28 rounded-3xl bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-primary/20"
          >
            <span className="text-6xl">🍽️</span>
          </motion.div>
        </div>
        
        {/* Back Button */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-4 left-4"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/meal-plans?tab=tracker')}
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Time Badge */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm text-xs font-medium text-muted-foreground"
        >
          {entry.time}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="px-4 py-6 space-y-6 -mt-6"
      >
        {/* Name Input */}
        <Card className="p-4 bg-card border-border/30">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg font-semibold border-0 bg-transparent px-0 focus-visible:ring-0"
            placeholder="Mahlzeit Name"
          />
        </Card>

        {/* Macros Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Calories */}
          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Kalorien</span>
            </div>
            <Input
              type="number"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0"
            />
            <span className="text-xs text-muted-foreground">kcal</span>
          </Card>

          {/* Protein */}
          <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Beef className="h-4 w-4 text-red-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Protein</span>
            </div>
            <Input
              type="number"
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value))}
              className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0"
            />
            <span className="text-xs text-muted-foreground">g</span>
          </Card>

          {/* Carbs */}
          <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Wheat className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Kohlenhydrate</span>
            </div>
            <Input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(Number(e.target.value))}
              className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0"
            />
            <span className="text-xs text-muted-foreground">g</span>
          </Card>

          {/* Fat */}
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Droplets className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Fett</span>
            </div>
            <Input
              type="number"
              value={fat}
              onChange={(e) => setFat(Number(e.target.value))}
              className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0"
            />
            <span className="text-xs text-muted-foreground">g</span>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3 pt-4"
        >
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex-1 h-12 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 h-12"
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FoodEntryDetailPage;
