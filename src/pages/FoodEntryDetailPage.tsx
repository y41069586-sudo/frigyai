import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Beef, Wheat, Droplets, Save, Trash2, Image, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { notifyFrigyStorageUpdated } from '@/lib/frigyStorageSync';
interface LocalFoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  image_url?: string;
}

// Image component with skeleton loading
const ImageWithSkeleton = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-muted/30">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      <img 
        src={src} 
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

const FoodEntryDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [isLocalEntry, setIsLocalEntry] = useState(false);
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
  const [notFound, setNotFound] = useState(false);

  // Check if ID is a UUID (database) or timestamp (localStorage)
  const isUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Load entry from database or localStorage
  useEffect(() => {
    const loadEntry = async () => {
      if (!id) {
        setLoading(false);
        setNotFound(true);
        return;
      }

      // Check if it's a UUID (database entry) or timestamp (localStorage)
      if (isUUID(id) && user) {
        // Try loading from database
        try {
          const { data, error } = await supabase
            .from('food_entries')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .maybeSingle();

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
            setIsLocalEntry(false);
          } else {
            setNotFound(true);
          }
        } catch (error) {
          console.error('Error loading entry from DB:', error);
          setNotFound(true);
        }
      } else {
        // Try loading from localStorage
        try {
          const saved = localStorage.getItem('todayFood');
          if (saved) {
            const data = JSON.parse(saved);
            const foundEntry = data.entries?.find((e: LocalFoodEntry) => e.id === id);
            if (foundEntry) {
              setName(foundEntry.name);
              setCalories(foundEntry.calories);
              setProtein(foundEntry.protein);
              setCarbs(foundEntry.carbs);
              setFat(foundEntry.fat);
              setImageUrl(foundEntry.image_url || null);
              setOriginalData({
                name: foundEntry.name,
                calories: foundEntry.calories,
                protein: foundEntry.protein,
                carbs: foundEntry.carbs,
                fat: foundEntry.fat
              });
              setIsLocalEntry(true);
            } else {
              setNotFound(true);
            }
          } else {
            setNotFound(true);
          }
        } catch (error) {
          console.error('Error loading entry from localStorage:', error);
          setNotFound(true);
        }
      }
      
      setLoading(false);
    };

    loadEntry();
  }, [id, user]);

  const handleSave = async () => {
    if (!id) return;
    
    setSaving(true);
    
    if (isLocalEntry) {
      // Save to localStorage
      try {
        const saved = localStorage.getItem('todayFood');
        if (saved) {
          const data = JSON.parse(saved);
          const updatedEntries = data.entries.map((e: LocalFoodEntry) =>
            e.id === id
              ? { ...e, name, calories, protein, carbs, fat }
              : e
          );
          localStorage.setItem('todayFood', JSON.stringify({
            ...data,
            entries: updatedEntries,
          }));
          notifyFrigyStorageUpdated();
          toast({ title: t.saved });
          navigate('/meal-plans?tab=tracker');
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        toast({ title: t.errorSaving, variant: 'destructive' });
      }
    } else if (user) {
      // Save to database
      try {
        const { error } = await supabase
          .from('food_entries')
          .update({ name, calories, protein, carbs, fat })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({ title: t.saved });
        navigate('/meal-plans?tab=tracker');
      } catch (error) {
        console.error('Error saving to DB:', error);
        toast({ title: t.errorSaving, variant: 'destructive' });
      }
    }
    
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (isLocalEntry) {
      // Delete from localStorage
      try {
        const saved = localStorage.getItem('todayFood');
        if (saved) {
          const data = JSON.parse(saved);
          const updatedEntries = data.entries.filter((e: LocalFoodEntry) => e.id !== id);
          localStorage.setItem('todayFood', JSON.stringify({
            ...data,
            entries: updatedEntries,
          }));
          notifyFrigyStorageUpdated();
          toast({ title: t.deleted });
          navigate('/meal-plans?tab=tracker');
        }
      } catch (error) {
        console.error('Error deleting from localStorage:', error);
        toast({ title: t.errorDeleting, variant: 'destructive' });
      }
    } else if (user) {
      // Delete from database
      try {
        const { error } = await supabase
          .from('food_entries')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({ title: t.deleted });
        navigate('/meal-plans?tab=tracker');
      } catch (error) {
        console.error('Error deleting from DB:', error);
        toast({ title: t.errorDeleting, variant: 'destructive' });
      }
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

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">{t.entryNotFound}</p>
        <Button onClick={() => navigate('/meal-plans?tab=tracker')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.back}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image Section with lazy loading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative h-64 overflow-hidden"
      >
        {imageUrl ? (
          <ImageWithSkeleton src={imageUrl} alt={name} />
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
            placeholder={t.mealName}
          />
        </div>

        {/* Macros Grid - Editable with neon glow */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {/* Calories */}
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl border-2 border-primary/50 p-4 group hover:border-primary transition-colors shadow-[0_0_10px_rgba(57,255,20,0.15)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-sm text-muted-foreground">{t.calories}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-20 caret-primary"
              />
              <span className="text-sm text-muted-foreground">{t.kcal}</span>
              <Pencil className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors ml-auto" />
            </div>
          </div>

          {/* Protein */}
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl border-2 border-primary/50 p-4 group hover:border-primary transition-colors shadow-[0_0_10px_rgba(57,255,20,0.15)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                <Beef className="h-5 w-5 text-red-500" />
              </div>
              <span className="text-sm text-muted-foreground">Protein</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-16 caret-primary"
              />
              <span className="text-sm text-muted-foreground">g</span>
              <Pencil className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors ml-auto" />
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl border-2 border-primary/50 p-4 group hover:border-primary transition-colors shadow-[0_0_10px_rgba(57,255,20,0.15)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Wheat className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">Carbs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-16 caret-primary"
              />
              <span className="text-sm text-muted-foreground">g</span>
              <Pencil className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors ml-auto" />
            </div>
          </div>

          {/* Fat */}
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl border-2 border-primary/50 p-4 group hover:border-primary transition-colors shadow-[0_0_10px_rgba(57,255,20,0.15)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
                <Droplets className="h-5 w-5 text-sky-500" />
              </div>
              <span className="text-sm text-muted-foreground">{t.fat}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
                className="text-2xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-16 caret-primary"
              />
              <span className="text-sm text-muted-foreground">g</span>
              <Pencil className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors ml-auto" />
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
            {t.deleted}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex-1 h-12"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? t.saving : t.save}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FoodEntryDetailPage;