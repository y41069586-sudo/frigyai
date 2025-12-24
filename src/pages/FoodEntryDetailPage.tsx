import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Beef, Wheat, Droplets, Save, Trash2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const FoodEntryDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load entry from database
  useEffect(() => {
    const loadEntry = async () => {
      if (!id || !user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('food_entries')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setName(data.name);
          setCalories(data.calories);
          setProtein(data.protein);
          setCarbs(data.carbs);
          setFat(data.fat);
          setImageUrl(data.image_url);
          setOriginalData({
            name: data.name,
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fat: data.fat
          });
        }
      } catch (error) {
        console.error('Error loading entry:', error);
        toast({ title: 'Fehler beim Laden', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadEntry();
  }, [id, user]);

  const handleSave = async () => {
    if (!id || !user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('food_entries')
        .update({ name, calories, protein, carbs, fat })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Gespeichert' });
      navigate('/meal-plans?tab=tracker');
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Fehler beim Speichern', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Gelöscht' });
      navigate('/meal-plans?tab=tracker');
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Fehler beim Löschen', variant: 'destructive' });
    }
  };

  // Track changes
  useEffect(() => {
    const changed = 
      name !== originalData.name ||
      calories !== originalData.calories ||
      protein !== originalData.protein ||
      carbs !== originalData.carbs ||
      fat !== originalData.fat;
    setHasChanges(changed);
  }, [name, calories, protein, carbs, fat, originalData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative h-64 overflow-hidden"
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted/30 flex items-center justify-center">
            <Image className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Back Button */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-4 left-4 z-10"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/meal-plans?tab=tracker')}
            className="bg-background/60 backdrop-blur-md hover:bg-background/80 border border-border/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="px-4 pb-8 -mt-16 relative z-10"
      >
        {/* Name Input Card */}
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-5 mb-4 shadow-lg">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xl font-semibold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
            placeholder="Mahlzeit Name"
          />
        </div>

        {/* Macros Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {/* Calories */}
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-sm text-muted-foreground">Kalorien</span>
            </div>
            <div className="flex items-baseline gap-1">
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 w-20"
              />
              <span className="text-sm text-muted-foreground">kcal</span>
            </div>
          </div>

          {/* Protein */}
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                <Beef className="h-5 w-5 text-red-500" />
              </div>
              <span className="text-sm text-muted-foreground">Protein</span>
            </div>
            <div className="flex items-baseline gap-1">
              <Input
                type="number"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 w-16"
              />
              <span className="text-sm text-muted-foreground">g</span>
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Wheat className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">Carbs</span>
            </div>
            <div className="flex items-baseline gap-1">
              <Input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 w-16"
              />
              <span className="text-sm text-muted-foreground">g</span>
            </div>
          </div>

          {/* Fat */}
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
                <Droplets className="h-5 w-5 text-sky-500" />
              </div>
              <span className="text-sm text-muted-foreground">Fett</span>
            </div>
            <div className="flex items-baseline gap-1">
              <Input
                type="number"
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
                className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 w-16"
              />
              <span className="text-sm text-muted-foreground">g</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex-1 h-12 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex-1 h-12"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Speichert...' : 'Speichern'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FoodEntryDetailPage;