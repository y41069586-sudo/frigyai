import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Mail, Crown, Settings, LogOut, RefreshCw, Trash2, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LanguageSettings } from "@/components/LanguageSettings";
import { HealthSync } from "@/components/HealthSync";
import frigLogo from "@/assets/frig-logo.png";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, session, subscriptionStatus, signOut, checkSubscription } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast({ title: t.success, description: "Abo-Status aktualisiert" });
  };

  const handleManageSubscription = async () => {
    if (!session) {
      toast({ title: t.error, variant: "destructive" });
      return;
    }
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion with confirmation
    toast({ 
      title: "Konto löschen", 
      description: "Diese Funktion wird bald verfügbar sein.",
      variant: "destructive"
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <p className="text-muted-foreground">{t.notLoggedIn}</p>
          <Button onClick={() => navigate("/auth")} className="mt-4">
            {t.login}
          </Button>
        </div>
      </div>
    );
  }

  const userInitials = user.email?.substring(0, 2).toUpperCase() || "U";
  const isPremium = subscriptionStatus?.subscribed;

  return (
    <div className="min-h-screen bg-gradient-primary safe-area-inset">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50 safe-top">
        <div className="container mx-auto px-3 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{t.settings}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-card/80 backdrop-blur-lg border-primary/20">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/30">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg">
                    {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </h2>
                  {isPremium && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Abo-Status</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshSubscription}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {isPremium ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Crown className="h-5 w-5" />
                  <span className="font-medium">{t.premiumActive}</span>
                </div>
                {subscriptionStatus?.subscription_end && (
                  <p className="text-sm text-muted-foreground">
                    {t.renewsOn}: {new Date(subscriptionStatus.subscription_end).toLocaleDateString("de-DE")}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full mt-2"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t.manageSubscription}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Kostenloser Plan</p>
                <Button
                  onClick={() => navigate("/premium")}
                  className="w-full glow-button"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {t.unlockPremium}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
            <h3 className="font-semibold mb-3">{t.languageSettings}</h3>
            <LanguageSettings />
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {isPremium && (
            <>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/community")}
              >
                <Users className="h-4 w-4 mr-2" />
                Community
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Health Sync
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Health Sync</DialogTitle>
                  </DialogHeader>
                  <HealthSync />
                </DialogContent>
              </Dialog>
            </>
          )}
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t.logout}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDeleteAccount}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Konto löschen
          </Button>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center py-4"
        >
          <img src={frigLogo} alt="FrigBuddy" className="h-10 w-10 mx-auto mb-2 rounded-lg" />
          <p className="text-xs text-muted-foreground">FrigBuddy v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">© 2024 FrigBuddy</p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
