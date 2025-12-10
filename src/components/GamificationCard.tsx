import { motion } from 'framer-motion';
import { Flame, Trophy, Star, Lock } from 'lucide-react';
import { useGamification, BADGE_DEFINITIONS } from '@/hooks/useGamification';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const GamificationCard = () => {
  const { streak, badges, loading } = useGamification();

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }

  const earnedBadgeTypes = badges.map(b => b.badge_type);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 via-yellow-500/15 to-red-500/20 border border-orange-500/40 hover:border-orange-500/60 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            {/* Streak Section */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30">
                  <Flame className="h-6 w-6 text-orange-400" />
                </div>
                {streak.current_streak > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  >
                    {streak.current_streak}
                  </motion.div>
                )}
              </div>
              <div>
                <p className="font-bold text-sm">
                  {streak.current_streak > 0 ? `${streak.current_streak} Tage Streak!` : 'Starte deinen Streak!'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {streak.longest_streak > 0 ? `Rekord: ${streak.longest_streak} Tage` : 'Sei jeden Tag aktiv'}
                </p>
              </div>
            </div>

            {/* Badges Preview */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {badges.slice(0, 3).map((badge, index) => {
                  const badgeDef = BADGE_DEFINITIONS.find(b => b.type === badge.badge_type);
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-2 border-background flex items-center justify-center text-sm"
                    >
                      {badgeDef?.icon}
                    </motion.div>
                  );
                })}
              </div>
              {badges.length > 3 && (
                <span className="text-xs text-muted-foreground">+{badges.length - 3}</span>
              )}
              <Trophy className="h-4 w-4 text-yellow-500 ml-1" />
            </div>
          </div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Deine Erfolge
          </DialogTitle>
        </DialogHeader>

        {/* Streak Details */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30">
              <Flame className="h-8 w-8 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak.current_streak} Tage</p>
              <p className="text-sm text-muted-foreground">Aktueller Streak</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-semibold text-yellow-500">{streak.longest_streak}</p>
              <p className="text-xs text-muted-foreground">Rekord</p>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Badges ({badges.length}/{BADGE_DEFINITIONS.length})
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {BADGE_DEFINITIONS.map((badgeDef) => {
              const isEarned = earnedBadgeTypes.includes(badgeDef.type);
              const earnedBadge = badges.find(b => b.badge_type === badgeDef.type);

              return (
                <motion.div
                  key={badgeDef.type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isEarned
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/40'
                      : 'bg-card/50 border-border/30 opacity-50'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {isEarned ? badgeDef.icon : <Lock className="h-6 w-6 mx-auto text-muted-foreground" />}
                  </div>
                  <p className="text-xs font-medium truncate">{badgeDef.name}</p>
                  {isEarned && earnedBadge && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(earnedBadge.earned_at).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Motivation */}
        {badges.length < BADGE_DEFINITIONS.length && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <p className="text-sm">
              🎯 Noch <span className="font-bold text-primary">{BADGE_DEFINITIONS.length - badges.length}</span> Badges zu sammeln!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GamificationCard;
