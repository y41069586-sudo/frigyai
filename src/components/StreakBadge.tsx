import { motion } from 'framer-motion';
import { Flame, Trophy, Droplets, Utensils, Scale, Camera, Lock, Check } from 'lucide-react';
import { useGamification, BADGE_DEFINITIONS } from '@/hooks/useGamification';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

// Group badges by category for clearer display
const BADGE_CATEGORIES = [
  {
    name: 'Streak-Badges',
    icon: Flame,
    color: 'orange',
    description: 'Sei jeden Tag aktiv um deinen Streak zu erhöhen',
    badges: ['streak_3', 'streak_7', 'streak_14', 'streak_30'],
  },
  {
    name: 'Aktivitäts-Badges',
    icon: Trophy,
    color: 'yellow',
    description: 'Erreiche diese durch tägliche Nutzung',
    badges: ['meal_logged', 'water_goal', 'water_week', 'weight_tracked', 'first_scan'],
  },
];

export function BadgeOverview() {
  const { streak, badges, loading } = useGamification();

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-32 rounded-2xl bg-orange-500/10 animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  const earnedBadgeTypes = badges.map(b => b.badge_type);
  const totalBadges = BADGE_DEFINITIONS.length;

  // Calculate progress to next streak badge
  const streakBadges = [3, 7, 14, 30];
  const nextStreakGoal = streakBadges.find(s => s > streak.current_streak) || 30;
  const prevStreakGoal = streakBadges.filter(s => s <= streak.current_streak).pop() || 0;
  const streakProgress = prevStreakGoal === nextStreakGoal 
    ? 100 
    : ((streak.current_streak - prevStreakGoal) / (nextStreakGoal - prevStreakGoal)) * 100;

  return (
    <div className="space-y-5">
        {/* Streak Card with Progress */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30">
              <Flame className="h-7 w-7 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">{streak.current_streak} Tage</p>
              <p className="text-xs text-muted-foreground">Aktueller Streak</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-yellow-500">{streak.longest_streak}</p>
              <p className="text-xs text-muted-foreground">Rekord</p>
            </div>
          </div>
          
          {/* Progress to next badge */}
          {streak.current_streak < 30 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Nächstes Badge: {nextStreakGoal} Tage</span>
                <span>{streak.current_streak}/{nextStreakGoal}</span>
              </div>
              <Progress value={streakProgress} className="h-2" />
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-3 text-center">
            💡 Logge Essen, trinke Wasser oder trage Gewicht ein um aktiv zu bleiben
          </p>
        </div>

        {/* Badge Categories */}
        <div className="space-y-4">
          {BADGE_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;
            const categoryBadges = BADGE_DEFINITIONS.filter(b => category.badges.includes(b.type));
            const earnedInCategory = categoryBadges.filter(b => earnedBadgeTypes.includes(b.type)).length;
            
            return (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                    <CategoryIcon className={`h-4 w-4 text-${category.color}-400`} />
                    {category.name}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {earnedInCategory}/{categoryBadges.length}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {categoryBadges.map((badgeDef) => {
                    const isEarned = earnedBadgeTypes.includes(badgeDef.type);
                    const earnedBadge = badges.find(b => b.badge_type === badgeDef.type);

                    return (
                      <motion.div
                        key={badgeDef.type}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                          isEarned
                            ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                            : 'bg-card/30 border-border/20'
                        }`}
                      >
                        <div className={`text-xl w-8 h-8 flex items-center justify-center rounded-lg ${
                          isEarned ? 'bg-yellow-500/20' : 'bg-muted/30'
                        }`}>
                          {isEarned ? badgeDef.icon : <Lock className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!isEarned && 'text-muted-foreground'}`}>
                            {badgeDef.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {badgeDef.description}
                          </p>
                        </div>
                        {isEarned ? (
                          <div className="flex flex-col items-end">
                            <Check className="h-4 w-4 text-green-500" />
                            {earnedBadge && (
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(earnedBadge.earned_at).toLocaleDateString('de-DE')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Gesamtfortschritt</span>
            <span className="text-sm text-primary font-bold">{badges.length}/{totalBadges}</span>
          </div>
          <Progress value={(badges.length / totalBadges) * 100} className="h-2" />
        </div>
    </div>
  );
}

const StreakBadge = () => {
  const { streak, badges, loading } = useGamification();

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-orange-500/20 animate-pulse" />
    );
  }

  const totalBadges = BADGE_DEFINITIONS.length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 hover:border-orange-500/60 transition-all"
        >
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="text-xs font-bold text-orange-400">
            {badges.length}/{totalBadges}
          </span>
          {streak.current_streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            >
              {streak.current_streak}
            </motion.div>
          )}
        </motion.button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Deine Erfolge
          </DialogTitle>
          <DialogDescription>
            Sammle Badges durch tägliche Aktivität
          </DialogDescription>
        </DialogHeader>
        <BadgeOverview />
      </DialogContent>
    </Dialog>
  );
};

export default StreakBadge;
