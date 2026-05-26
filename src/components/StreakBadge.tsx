import { motion } from 'framer-motion';
import { Flame, Trophy, Lock, Check } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

function getBadgeCategories(language: 'de' | 'en' | 'fr') {
  if (language === 'en') {
    return [
      {
        name: 'Streak Badges',
        icon: Flame,
        iconClassName: 'text-orange-400',
        description: 'Stay active every day to grow your streak',
        badges: ['streak_3', 'streak_7', 'streak_14', 'streak_30'],
      },
      {
        name: 'Activity Badges',
        icon: Trophy,
        iconClassName: 'text-yellow-500',
        description: 'Unlock these through regular activity',
        badges: ['meal_logged', 'water_goal', 'water_week', 'weight_tracked', 'first_scan'],
      },
    ];
  }

  if (language === 'fr') {
    return [
      {
        name: 'Badges de serie',
        icon: Flame,
        iconClassName: 'text-orange-400',
        description: 'Reste actif chaque jour pour augmenter ta serie',
        badges: ['streak_3', 'streak_7', 'streak_14', 'streak_30'],
      },
      {
        name: 'Badges d activite',
        icon: Trophy,
        iconClassName: 'text-yellow-500',
        description: 'Debloque-les avec une utilisation reguliere',
        badges: ['meal_logged', 'water_goal', 'water_week', 'weight_tracked', 'first_scan'],
      },
    ];
  }

  return [
    {
      name: 'Streak-Badges',
      icon: Flame,
      iconClassName: 'text-orange-400',
      description: 'Sei jeden Tag aktiv, um deinen Streak zu erhohen',
      badges: ['streak_3', 'streak_7', 'streak_14', 'streak_30'],
    },
    {
      name: 'Aktivitats-Badges',
      icon: Trophy,
      iconClassName: 'text-yellow-500',
      description: 'Erreiche diese durch regelmassige Nutzung',
      badges: ['meal_logged', 'water_goal', 'water_week', 'weight_tracked', 'first_scan'],
    },
  ];
}

export function BadgeOverview() {
  const { language } = useLanguage();
  const { streak, badges, badgeDefinitions, loading } = useGamification();
  const locale = language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'de-DE';
  const badgeCategories = getBadgeCategories(language);
  const badgeCopy = language === 'fr'
    ? {
        days: 'jours',
        currentStreak: 'Serie actuelle',
        record: 'Record',
        nextBadge: 'Prochain badge',
        streakHint: 'Consigne tes repas, bois de l eau ou ajoute ton poids pour rester actif.',
        overallProgress: 'Progression totale',
        achievementsTitle: 'Tes succes',
        achievementsDesc: 'Collectionne des badges grace a ton activite quotidienne',
      }
    : language === 'en'
      ? {
          days: 'days',
          currentStreak: 'Current streak',
          record: 'Record',
          nextBadge: 'Next badge',
          streakHint: 'Log meals, drink water, or add your weight to stay active.',
          overallProgress: 'Overall progress',
          achievementsTitle: 'Your achievements',
          achievementsDesc: 'Collect badges through your daily activity',
        }
      : {
          days: 'Tage',
          currentStreak: 'Aktueller Streak',
          record: 'Rekord',
          nextBadge: 'Nächstes Badge',
          streakHint: 'Logge Essen, trinke Wasser oder trage Gewicht ein, um aktiv zu bleiben.',
          overallProgress: 'Gesamtfortschritt',
          achievementsTitle: 'Deine Erfolge',
          achievementsDesc: 'Sammle Badges durch tägliche Aktivität',
        };

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
  const totalBadges = badgeDefinitions.length;

  // Calculate progress to next streak badge
  const streakBadges = [3, 7, 14, 30];
  const nextStreakGoal = streakBadges.find(s => s > streak.current_streak) || 30;
  const prevStreakGoal = streakBadges.filter(s => s <= streak.current_streak).pop() || 0;
  const streakProgress = prevStreakGoal === nextStreakGoal 
    ? 100 
    : ((streak.current_streak - prevStreakGoal) / (nextStreakGoal - prevStreakGoal)) * 100;

  return (
    <div className="space-y-5 pb-[max(1rem,env(safe-area-inset-bottom,0px)+1rem)]">
        {/* Streak Card with Progress */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
          <div className="mb-3 flex items-center gap-3 sm:gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30">
              <Flame className="h-7 w-7 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold sm:text-2xl">{streak.current_streak} {badgeCopy.days}</p>
              <p className="text-xs text-muted-foreground">{badgeCopy.currentStreak}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-semibold text-yellow-500">{streak.longest_streak}</p>
              <p className="text-xs text-muted-foreground">{badgeCopy.record}</p>
            </div>
          </div>
          
          {/* Progress to next badge */}
          {streak.current_streak < 30 && (
            <div className="space-y-1">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>{badgeCopy.nextBadge}: {nextStreakGoal} {badgeCopy.days}</span>
                <span>{streak.current_streak}/{nextStreakGoal}</span>
              </div>
              <Progress value={streakProgress} className="h-2" />
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {badgeCopy.streakHint}
          </p>
        </div>

        {/* Badge Categories */}
        <div className="space-y-4">
          {badgeCategories.map((category) => {
            const CategoryIcon = category.icon;
            const categoryBadges = badgeDefinitions.filter(b => category.badges.includes(b.type));
            const earnedInCategory = categoryBadges.filter(b => earnedBadgeTypes.includes(b.type)).length;
            
            return (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold flex min-w-0 items-center gap-2 text-sm">
                    <CategoryIcon className={`h-4 w-4 shrink-0 ${category.iconClassName}`} />
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
                                {new Date(earnedBadge.earned_at).toLocaleDateString(locale)}
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
            <span className="text-sm font-medium">{badgeCopy.overallProgress}</span>
            <span className="text-sm text-primary font-bold">{badges.length}/{totalBadges}</span>
          </div>
          <Progress value={(badges.length / totalBadges) * 100} className="h-2" />
        </div>
    </div>
  );
}

const StreakBadge = () => {
  const { language } = useLanguage();
  const { streak, badges, badgeDefinitions, loading } = useGamification();

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-orange-500/20 animate-pulse" />
    );
  }

  const totalBadges = badgeDefinitions.length;
  const dialogCopy = language === 'fr'
    ? {
        title: 'Tes succes',
        description: 'Collectionne des badges grace a ton activite quotidienne',
      }
    : language === 'en'
      ? {
          title: 'Your achievements',
          description: 'Collect badges through your daily activity',
        }
      : {
          title: 'Deine Erfolge',
          description: 'Sammle Badges durch tägliche Aktivität',
        };

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

      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] max-h-[88svh] overflow-y-auto rounded-[24px] p-0 sm:max-w-md">
        <DialogHeader className="px-4 pb-0 pt-5 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {dialogCopy.title}
          </DialogTitle>
          <DialogDescription>
            {dialogCopy.description}
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px)+1rem)] pt-4 sm:px-6">
          <BadgeOverview />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StreakBadge;
