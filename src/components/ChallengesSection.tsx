import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Flame, Droplet, Zap, Users, Check, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO, isAfter } from "date-fns";
import { de } from "date-fns/locale";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  target_value: number;
  start_date: string;
  end_date: string;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  current_progress: number;
  completed: boolean;
  joined_at: string;
  completed_at?: string;
}

const CHALLENGE_ICONS: Record<string, React.ElementType> = {
  calories: Flame,
  protein: Target,
  water: Droplet,
  streak: Zap,
  recipes: Trophy
};

const CHALLENGE_COLORS: Record<string, string> = {
  calories: "text-orange-500",
  protein: "text-blue-500",
  water: "text-cyan-500",
  streak: "text-yellow-500",
  recipes: "text-primary"
};

// Sample challenges (in production, these would come from the database)
const SAMPLE_CHALLENGES: Omit<Challenge, "id">[] = [
  {
    title: "Protein-Power Woche",
    description: "Erreiche 7 Tage lang dein Protein-Ziel",
    type: "protein",
    target_value: 7,
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  },
  {
    title: "Hydration Hero",
    description: "Trinke 7 Tage lang mindestens 8 Gläser Wasser",
    type: "water",
    target_value: 7,
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  },
  {
    title: "Streak Champion",
    description: "Halte eine 14-Tage-Streak aufrecht",
    type: "streak",
    target_value: 14,
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  }
];

const ChallengesSection = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChallenges();
    }
  }, [user]);

  const loadChallenges = async () => {
    if (!user) return;

    try {
      // Load available challenges
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select("*")
        .gte("end_date", format(new Date(), "yyyy-MM-dd"))
        .order("start_date", { ascending: true });

      if (challengeError) throw challengeError;

      // If no challenges exist, create sample ones
      if (!challengeData || challengeData.length === 0) {
        // Insert sample challenges
        const { data: newChallenges } = await supabase
          .from("challenges")
          .insert(SAMPLE_CHALLENGES)
          .select();
        
        setChallenges(newChallenges || []);
      } else {
        setChallenges(challengeData);
      }

      // Load user's challenge participation
      const { data: userChallengeData, error: userChallengeError } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", user.id);

      if (userChallengeError) throw userChallengeError;
      setUserChallenges(userChallengeData || []);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_challenges")
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          current_progress: 0,
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      setUserChallenges([...userChallenges, data]);
      toast({
        title: "Challenge beigetreten!",
        description: "Viel Erfolg bei der Challenge!"
      });
    } catch (error: any) {
      if (error.code === "23505") {
        toast({
          title: "Bereits beigetreten",
          description: "Du nimmst bereits an dieser Challenge teil.",
          variant: "destructive"
        });
      } else {
        console.error("Error joining challenge:", error);
        toast({
          title: "Fehler",
          description: "Challenge konnte nicht beigetreten werden.",
          variant: "destructive"
        });
      }
    }
  };

  const getUserChallengeData = (challengeId: string) => {
    return userChallenges.find(uc => uc.challenge_id === challengeId);
  };

  if (loading) {
    return (
      <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Challenges</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Melde dich an, um an Challenges teilzunehmen.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Challenges</h3>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {userChallenges.length} aktiv
        </Badge>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {challenges.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Keine aktiven Challenges verfügbar.
            </p>
          ) : (
            challenges.map((challenge, index) => {
              const Icon = CHALLENGE_ICONS[challenge.type] || Target;
              const color = CHALLENGE_COLORS[challenge.type] || "text-primary";
              const userChallenge = getUserChallengeData(challenge.id);
              const isJoined = !!userChallenge;
              const isCompleted = userChallenge?.completed;
              const progress = userChallenge 
                ? Math.min((userChallenge.current_progress / challenge.target_value) * 100, 100)
                : 0;
              const daysLeft = differenceInDays(parseISO(challenge.end_date), new Date());

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted 
                      ? "bg-primary/10 border-primary/30" 
                      : isJoined 
                        ? "bg-muted/50 border-border" 
                        : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-background ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{challenge.title}</h4>
                        {isCompleted && (
                          <Badge className="bg-primary/20 text-primary text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Abgeschlossen
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {challenge.description}
                      </p>
                      
                      {isJoined && !isCompleted && (
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Fortschritt: {userChallenge?.current_progress || 0}/{challenge.target_value}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {daysLeft} Tage übrig
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                      
                      {!isJoined && (
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {daysLeft} Tage
                          </span>
                          <Button
                            size="sm"
                            onClick={() => joinChallenge(challenge.id)}
                            className="gradient-neon text-primary-foreground text-xs h-7"
                          >
                            Beitreten
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

export default ChallengesSection;
