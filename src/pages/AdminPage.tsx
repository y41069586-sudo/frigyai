import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Crown, Gift, Loader2, Shield, Check } from 'lucide-react';
import frigLogo from '@/assets/frigy-mascot.png';

import { isPremiumGrantAdmin } from "@/lib/admin";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionError";
import { useLanguage } from "@/contexts/LanguageContext";

const AdminPage = () => {
  const { t } = useLanguage();
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastGranted, setLastGranted] = useState<{ email: string; until: string } | null>(null);

  // Check if current user is admin
  const isAdmin = isPremiumGrantAdmin(user?.email);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <img src={frigLogo} alt="Frigy" className="h-12 w-12 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-primary p-6">
        <Shield className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t.adminNoAccessTitle}</h1>
        <p className="text-muted-foreground text-center mb-6">{t.adminNoAccessDesc}</p>
        <Button onClick={() => navigate('/')}>{t.adminBackToApp}</Button>
      </div>
    );
  }

  const handleGrantPremium = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({ title: "Bitte E-Mail eingeben", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setLastGranted(null);

    try {
      const { data, error } = await supabase.functions.invoke('grant-premium', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { 
          email: email.trim(), 
          duration_days: durationDays,
          reason: reason.trim() || 'Influencer Promo'
        },
      });

      if (error) {
        throw new Error(await getEdgeFunctionErrorMessage(error, data));
      }

      if (data?.success) {
        toast({
          title: `${t.adminPremiumGranted} 🎉`,
          description: data.message,
        });
        setLastGranted({
          email: data.user_email,
          until: new Date(data.subscription_end).toLocaleDateString('de-DE')
        });
        setEmail('');
        setReason('');
      } else {
        throw new Error(data.error || 'Unbekannter Fehler');
      }
    } catch (error: unknown) {
      console.error("Error granting premium:", error);
      const message = error instanceof Error ? error.message : t.adminPremiumGrantFailed;
      toast({
        title: t.error,
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{t.adminPanelTitle}</h1>
          </div>
        </div>

        {/* Grant Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t.adminGrantPremiumTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.adminGrantPremiumDesc}</p>
            </div>
          </div>

          <form onSubmit={handleGrantPremium} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.adminUserEmailLabel}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.adminEmailPlaceholder}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">{t.adminDurationLabel}</Label>
              <div className="flex gap-2">
                {[30, 90, 180, 365].map((days) => (
                  <Button
                    key={days}
                    type="button"
                    variant={durationDays === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDurationDays(days)}
                    className="flex-1"
                  >
                    {days === 365 ? t.adminDurationOneYear : `${days}d`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">{t.adminReasonLabel}</Label>
              <Input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.adminReasonPlaceholder}
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {t.adminGranting}
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  {t.adminGrantPremiumButton}
                </>
              )}
            </Button>
          </form>

          {/* Success Message */}
          {lastGranted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-primary">Premium aktiv!</p>
                  <p className="text-sm text-muted-foreground">
                    {lastGranted.email} bis {lastGranted.until}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Info */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Der Nutzer muss bereits registriert sein.
        </p>
      </div>
    </div>
  );
};

export default AdminPage;
