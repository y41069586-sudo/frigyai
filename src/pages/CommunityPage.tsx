import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Heart, MessageCircle, Share2, Plus, ArrowLeft, 
  Flame, Users, TrendingUp, Star, Clock, ChefHat, Loader2, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import UploadRecipeDialog from '@/components/UploadRecipeDialog';
import ShareRecipeDialog from '@/components/ShareRecipeDialog';

interface CommunityRecipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  prep_time: number | null;
  created_at: string;
  average_rating: number;
  rating_count: number;
  likes_count: number;
  isLiked?: boolean;
}

interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  recipe?: {
    name: string;
    calories: number;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: Date;
}

export const CommunityPage = () => {
  const navigate = useNavigate();
  const { user, subscriptionStatus } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [communityRecipes, setCommunityRecipes] = useState<CommunityRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<CommunityRecipe | null>(null);
  const [activeTab, setActiveTab] = useState('recipes');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Load user's likes
  const loadUserLikes = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('recipe_likes')
        .select('recipe_id')
        .eq('user_id', user.id);
      
      if (data) {
        setUserLikes(new Set(data.map(l => l.recipe_id)));
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  }, [user]);

  // Load community recipes from database
  const loadCommunityRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const { data, error } = await supabase
        .from('community_recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const recipesWithLikes = (data || []).map(recipe => ({
        ...recipe,
        average_rating: Number(recipe.average_rating) || 0,
        rating_count: recipe.rating_count || 0,
        likes_count: recipe.likes_count || 0,
        isLiked: userLikes.has(recipe.id)
      }));
      
      setCommunityRecipes(recipesWithLikes);
    } catch (error) {
      console.error('Error loading community recipes:', error);
    } finally {
      setLoadingRecipes(false);
    }
  }, [userLikes]);

  useEffect(() => {
    loadUserLikes();
  }, [loadUserLikes]);

  useEffect(() => {
    loadCommunityRecipes();
  }, [loadCommunityRecipes]);

  // Like/unlike a recipe
  const handleRecipeLike = async (recipeId: string) => {
    if (!user) {
      toast({ title: 'Bitte einloggen', variant: 'destructive' });
      return;
    }

    const isLiked = userLikes.has(recipeId);
    
    try {
      if (isLiked) {
        await supabase
          .from('recipe_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);
        
        setUserLikes(prev => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      } else {
        await supabase
          .from('recipe_likes')
          .insert({ user_id: user.id, recipe_id: recipeId });
        
        setUserLikes(prev => new Set([...prev, recipeId]));
      }
      
      // Update local state
      setCommunityRecipes(prev => prev.map(r => 
        r.id === recipeId 
          ? { ...r, likes_count: r.likes_count + (isLiked ? -1 : 1), isLiked: !isLiked }
          : r
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Load demo posts
  useEffect(() => {
    const demoPosts: Post[] = [
      {
        id: '1',
        author: { name: 'Sarah M.' },
        content: 'Heute mein neues Lieblingsrezept entdeckt! 🥗 Hähnchen-Avocado-Salat mit nur 350 kcal. Perfekt für den Sommer!',
        recipe: { name: 'Hähnchen-Avocado-Salat', calories: 350 },
        likes: 24,
        comments: 5,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: '2',
        author: { name: 'Thomas K.' },
        content: '5kg in 4 Wochen geschafft! 💪 Die Meal Plans sind einfach genial. Danke Frigy!',
        likes: 45,
        comments: 12,
        isLiked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        id: '3',
        author: { name: 'Lisa W.' },
        content: 'Hat jemand gute Low-Carb Rezepte für unter 400 kcal? Suche neue Inspiration! 🤔',
        likes: 8,
        comments: 15,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
      },
    ];
    setPosts(demoPosts);
  }, []);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handleSharePost = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: 'Frigy Community',
        text: post.content,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(post.content);
      toast({ title: 'In Zwischenablage kopiert!' });
    }
  };

  const handleShareRecipe = (recipe: CommunityRecipe) => {
    setSelectedRecipe(recipe);
    setShareDialogOpen(true);
  };

  const formatTimeAgo = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const minutes = Math.floor((Date.now() - d.getTime()) / 1000 / 60);
    if (minutes < 60) return `vor ${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    return `vor ${Math.floor(hours / 24)} Tagen`;
  };

  // Free users can view community but not post
  const isPremium = subscriptionStatus?.subscribed === true;

  return (
    <div className="min-h-screen bg-background pb-bottom-nav">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/meal-plans')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Community</h1>
              <p className="text-xs text-muted-foreground">Teile & entdecke Rezepte</p>
            </div>
          </div>
          
          {isPremium ? (
            <Button size="sm" className="gap-2 gradient-neon text-black" onClick={() => setUploadDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Rezept teilen
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 opacity-70"
              onClick={() => {
                toast({
                  title: 'Premium Feature',
                  description: 'Upgrade auf Premium, um Rezepte zu teilen.',
                });
                navigate('/premium');
              }}
            >
              <Lock className="h-4 w-4" />
              Rezept teilen
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center bg-card/50">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">1.2k</p>
            <p className="text-xs text-muted-foreground">Mitglieder</p>
          </Card>
          <Card className="p-3 text-center bg-card/50">
            <ChefHat className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{communityRecipes.length}</p>
            <p className="text-xs text-muted-foreground">Rezepte</p>
          </Card>
          <Card className="p-3 text-center bg-card/50">
            <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">89%</p>
            <p className="text-xs text-muted-foreground">Erfolgsrate</p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="recipes">
              <ChefHat className="h-4 w-4 mr-2" />
              Rezepte
            </TabsTrigger>
            <TabsTrigger value="posts">
              <MessageCircle className="h-4 w-4 mr-2" />
              Beiträge
            </TabsTrigger>
          </TabsList>

          {/* Community Recipes Tab */}
          <TabsContent value="recipes" className="space-y-4">
            {loadingRecipes ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-2">Rezepte werden geladen...</p>
              </div>
            ) : communityRecipes.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Noch keine Rezepte</h3>
                <p className="text-muted-foreground text-sm mb-4">Sei der Erste, der ein Rezept teilt!</p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Erstes Rezept teilen
                </Button>
              </div>
            ) : (
              <AnimatePresence>
                {communityRecipes.map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="p-4 bg-card/50 backdrop-blur cursor-pointer hover:border-primary/50 transition-all"
                      onClick={() => {
                        // Navigate to recipe detail with community recipe data
                        const recipeData = {
                          id: recipe.id,
                          title: recipe.title,
                          calories: recipe.calories || 0,
                          protein: recipe.protein || 0,
                          carbs: recipe.carbs || 0,
                          fat: recipe.fat || 0,
                          prepTime: recipe.prep_time || 15,
                          difficulty: "Mittel",
                          ingredients: recipe.ingredients,
                          instructions: recipe.instructions,
                        };
                        // Store in localStorage for detail page
                        const recipes = JSON.parse(localStorage.getItem("recipeDetails") || "{}");
                        recipes[recipe.id] = recipeData;
                        localStorage.setItem("recipeDetails", JSON.stringify(recipes));
                        navigate(`/recipe/${recipe.id}`, { state: { recipe: recipeData } });
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{recipe.title}</h3>
                          {recipe.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareRecipe(recipe);
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        {recipe.calories && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-primary" />
                            <span>{recipe.calories} kcal</span>
                          </div>
                        )}
                        {recipe.prep_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{recipe.prep_time} min</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>4.5</span>
                        </div>
                      </div>

                      {/* Ingredients Preview */}
                      <div className="flex flex-wrap gap-2">
                        {recipe.ingredients.slice(0, 3).map((ingredient, i) => (
                          <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">
                            {ingredient}
                          </span>
                        ))}
                        {recipe.ingredients.length > 3 && (
                          <span className="text-xs text-muted-foreground px-2 py-1">
                            +{recipe.ingredients.length - 3} mehr
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-3">
                        {formatTimeAgo(recipe.created_at)}
                      </p>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 bg-card/50 backdrop-blur">
                    {/* Author */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {post.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(post.createdAt)}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm mb-3">{post.content}</p>

                    {/* Recipe Card */}
                    {post.recipe && (
                      <div className="bg-primary/10 rounded-xl p-3 mb-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Flame className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{post.recipe.name}</p>
                          <p className="text-xs text-muted-foreground">{post.recipe.calories} kcal</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                      <button 
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => handleLike(post.id)}
                      >
                        <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        {post.likes}
                      </button>
                      <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments}
                      </button>
                      <button 
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto"
                        onClick={() => handleSharePost(post)}
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <UploadRecipeDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen}
        onSuccess={loadCommunityRecipes}
      />

      {selectedRecipe && (
        <ShareRecipeDialog
          recipe={{
            id: selectedRecipe.id,
            title: selectedRecipe.title,
            calories: selectedRecipe.calories || 0,
            ingredients: selectedRecipe.ingredients,
          }}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}

      <BottomNavigation />
    </div>
  );
};

export default CommunityPage;
