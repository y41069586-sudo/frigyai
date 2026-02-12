import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Mail, Crown, Settings, LogOut, RefreshCw, Trash2, Users, Activity, RotateCcw, BarChart3, FileText, Shield, Scale, Bell } from "lucide-react";
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
import { ReminderSettings } from "@/components/ReminderSettings";

import frigLogo from "@/assets/frig-logo.png";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, session, subscriptionStatus, signOut, checkSubscription } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast({ title: t.success, description: t.subscriptionRefreshed });
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
        // On mobile/in-app browsers, window.open can be blocked.
        // Using same-tab navigation makes "Abo kündigen" reliably reachable.
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !session) {
      toast({
        title: t.error,
        description: "Benutzer nicht authentifiziert",
        variant: "destructive"
      });
      return;
    }

    setDeleteLoading(true);
    try {
      // Server function handles all deletions atomically (DB + Auth)
      const { error: functionError } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        throw functionError;
      }

      toast({
        title: "Konto gelöscht",
        description: "Dein Konto wurde erfolgreich gelöscht",
        variant: "default"
      });

      // Clear local storage and logout
      localStorage.clear();
      await signOut();

      // Redirect to auth page
      navigate('/auth');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: t.error,
        description: error.message || "Fehler beim Löschen des Kontos",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('onboardingComplete');
    localStorage.removeItem('onboardingUserData');
    toast({ 
      title: t.resetOnboarding, 
      description: t.onboardingResetMessage
    });
    // Reload to start onboarding
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <img src={frigLogo} alt="frigy" className="h-16 w-16 rounded-2xl mb-6" />
        <h1 className="text-xl font-bold text-foreground mb-2">{t.notLoggedIn}</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Melde dich an, um dein Profil zu sehen
        </p>
        <Button onClick={() => navigate("/auth")} className="w-full max-w-xs">
          {t.login}
        </Button>
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
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
              <h3 className="font-semibold">{t.subscriptionStatus}</h3>
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
                <p className="text-sm text-muted-foreground">{t.freePlanLabel}</p>
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
          <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20 space-y-4">
            <h3 className="font-semibold">{t.settingsLabel}</h3>
            <div>
              <h4 className="text-sm font-medium mb-2">{t.languageSettings}</h4>
              <LanguageSettings />
            </div>
          </Card>
        </motion.div>

        {/* Reminder Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{t.reminders}</h3>
            </div>
            <ReminderSettings />
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

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t.deleteAccount}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-destructive">Konto permanent löschen?</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten werden permanent gelöscht:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                  <li>Deine Mahlzeitseinträge</li>
                  <li>Deine Makro-Ziele</li>
                  <li>Dein Profil</li>
                  <li>Alle Einstellungen</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleteLoading}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1"
                >
                  {deleteLoading ? "Wird gelöscht..." : "Konto löschen"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dev/Test: Reset Onboarding */}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleResetOnboarding}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t.resetOnboarding}
          </Button>
        </motion.div>

        {/* Legal Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
            <h3 className="font-semibold mb-3">{t.legal}</h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/legal/datenschutz")}
              >
                <Shield className="h-4 w-4 mr-2" />
                {t.privacyPolicy}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/legal/agb")}
              >
                <FileText className="h-4 w-4 mr-2" />
                {t.termsOfService}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/legal/impressum")}
              >
                <Scale className="h-4 w-4 mr-2" />
                {t.imprint}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center py-4"
        >
          <img src={frigLogo} alt="frigy" className="h-10 w-10 mx-auto mb-2 rounded-lg" />
          <p className="text-xs text-muted-foreground">frigy v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">© 2024 frigy</p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
