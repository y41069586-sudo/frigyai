import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Heart, MessageCircle, Share2, Plus, ArrowLeft, 
  Flame, Users, TrendingUp, Send, Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/BottomNavigation';

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
  const [newPostContent, setNewPostContent] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
        content: '5kg in 4 Wochen geschafft! 💪 Die Meal Plans sind einfach genial. Danke FriG!',
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
      {
        id: '4',
        author: { name: 'Max B.' },
        content: 'Mein Kühlschrank-Scan hat mir heute das perfekte Frühstück vorgeschlagen! Joghurt mit Beeren und Haferflocken. Einfach aber lecker! 🍓',
        recipe: { name: 'Beeren-Joghurt-Bowl', calories: 280 },
        likes: 32,
        comments: 7,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8)
      }
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

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: 'FriG AI Community',
        text: post.content,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(post.content);
      toast({ title: 'In Zwischenablage kopiert!' });
    }
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: { name: user?.email?.split('@')[0] || 'Anonym' },
      content: newPostContent,
      likes: 0,
      comments: 0,
      isLiked: false,
      createdAt: new Date()
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setIsCreateDialogOpen(false);
    toast({ title: 'Beitrag veröffentlicht! 🎉' });
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (minutes < 60) return `vor ${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    return `vor ${Math.floor(hours / 24)} Tagen`;
  };

  // Check premium access
  if (!subscriptionStatus?.subscribed) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Community</h1>
        <p className="text-muted-foreground text-center mb-6">
          Die Community ist nur für Premium-Mitglieder verfügbar.
        </p>
        <Button onClick={() => navigate('/premium')}>
          Premium werden
        </Button>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/meal-plans')}>
          Zurück
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/meal-plans')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Community</h1>
              <p className="text-xs text-muted-foreground">Teile & entdecke</p>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Posten
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuer Beitrag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Was möchtest du teilen?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Bild
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Flame className="h-4 w-4" />
                    Rezept
                  </Button>
                </div>
                <Button className="w-full" onClick={handleCreatePost}>
                  <Send className="h-4 w-4 mr-2" />
                  Veröffentlichen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
            <MessageCircle className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">342</p>
            <p className="text-xs text-muted-foreground">Beiträge</p>
          </Card>
          <Card className="p-3 text-center bg-card/50">
            <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">89%</p>
            <p className="text-xs text-muted-foreground">Erfolgsrate</p>
          </Card>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-2xl mx-auto px-4 space-y-4">
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
                    onClick={() => handleShare(post)}
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <BottomNavigation activeTab="tracker" onTabChange={() => {}} />
    </div>
  );
};

export default CommunityPage;
