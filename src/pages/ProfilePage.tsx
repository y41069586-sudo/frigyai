import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Mail,
  Crown,
  LogOut,
  RefreshCw,
  Trash2,
  Globe,
  ChevronRight,
  CreditCard,
  Settings,
  Apple,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAppLocale } from "@/lib/mealPlanLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LanguageSettings } from "@/components/LanguageSettings";
import { ReminderSettings } from "@/components/ReminderSettings";
import { DietPreferencesSettings } from "@/components/DietPreferencesSettings";
import { ReferralCodesAdmin } from "@/components/ReferralCodesAdmin";
import { isReferralAdmin } from "@/lib/admin";
import { clearOnboardingForLogout } from "@/components/onboarding/utils";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { cn } from "@/lib/utils";
import { canManageStripeSubscription, canManageStoreSubscription } from "@/lib/subscription";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionError";
import { getPublicErrorMessage } from "@/lib/publicErrorMessage";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { openStoreSubscriptionManagement, restoreStorePurchases } from "@/lib/storeBilling";
import { usesStoreBilling } from "@/lib/billingPlatform";
import { isAppleSignInAvailable } from "@/lib/appleSignIn";
import { PRIVACY_POLICY_URL } from "@/lib/legalUrls";

function SettingsGroup({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      {title && (
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 divide-y divide-slate-100">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  description,
  onClick,
  trailing,
  destructive,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
  className?: string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
        onClick && "hover:bg-slate-50/90 active:bg-slate-100/80",
        destructive && "text-destructive",
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            destructive ? "bg-destructive/10" : "bg-primary/8 text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[15px] font-medium", destructive && "text-destructive")}>
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      {trailing ?? (onClick && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />)}
    </Comp>
  );
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, session, subscriptionStatus, signOut, checkSubscription, linkAppleAccount } = useAuth();
  const [restoreLoading, setRestoreLoading] = useState(false);
  const { saveProgress } = useOnboardingProgress();
  const { t, language } = useLanguage();
  const dateLocale = getAppLocale(language);
  const [refreshing, setRefreshing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const canManageStripe = canManageStripeSubscription(subscriptionStatus);
  const canManageStore = canManageStoreSubscription(subscriptionStatus);
  const canManageSubscription = canManageStripe || canManageStore;

  const handleSignOut = async () => {
    try {
      await saveProgress({ onboarding_complete: false });
    } catch {
      /* still log out if DB update fails */
    }
    clearOnboardingForLogout();
    await signOut();
    navigate("/", { replace: true });
  };

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast({ title: t.success, description: t.subscriptionRefreshed });
  };

  const handleRestorePurchases = async () => {
    if (!session?.access_token) return;
    setRestoreLoading(true);
    try {
      const result = await restoreStorePurchases(session.access_token);
      await checkSubscription();
      if (result.ok) {
        toast({ title: t.success, description: "Käufe wiederhergestellt." });
      } else if (result.message) {
        toast({ title: t.error, description: result.message, variant: "destructive" });
      }
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) {
      toast({ title: t.error, variant: "destructive" });
      return;
    }
    setPortalLoading(true);
    try {
      if (canManageStore) {
        await openStoreSubscriptionManagement();
        return;
      }
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        throw new Error(await getEdgeFunctionErrorMessage(error, data));
      }
      if (data?.url) {
        await openExternalUrl(data.url);
      }
    } catch (error: unknown) {
      toast({
        title: t.error,
        description: getPublicErrorMessage(error, "Die Aboverwaltung konnte gerade nicht geöffnet werden. Bitte versuche es erneut."),
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !session) {
      toast({
        title: t.error,
        description: "Benutzer nicht authentifiziert",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const { error: functionError } = await supabase.functions.invoke("delete-user", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (functionError) throw functionError;

      toast({
        title: "Konto gelöscht",
        description: "Dein Konto wurde erfolgreich gelöscht",
      });

      localStorage.clear();
      await signOut();
      navigate("/auth");
    } catch (error: unknown) {
      toast({
        title: t.error,
        description: getPublicErrorMessage(error, "Dein Konto konnte gerade nicht gelöscht werden. Bitte versuche es erneut."),
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const userInitials = user.email?.substring(0, 2).toUpperCase() || "U";
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0];

  return (
    <div className="min-h-screen bg-[#F7FAF7] safe-area-inset">
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[#F7FAF7]/90 backdrop-blur-md safe-top">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-9 w-9 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-[17px] font-bold tracking-[-0.02em]">{t.settings}</h1>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col px-4 py-6">
        <div className="space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-4 px-1">
            <Avatar className="h-[4.25rem] w-[4.25rem] border-2 border-white shadow-sm ring-1 ring-slate-200/80">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary/12 text-lg font-bold text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[18px] font-bold tracking-[-0.03em] text-foreground">
                {displayName}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                <Crown className="h-3 w-3" />
                Premium
              </span>
            </div>
          </div>

          <SettingsGroup title={t.settingsSubscriptionGroup}>
            <SettingsRow
              icon={Crown}
              label={t.premiumActive}
              description={
                subscriptionStatus?.subscription_end
                  ? `${t.renewsOn}: ${new Date(subscriptionStatus.subscription_end).toLocaleDateString(dateLocale)}`
                  : undefined
              }
              trailing={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleRefreshSubscription();
                  }}
                  disabled={refreshing}
                >
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                </Button>
              }
            />
            {canManageSubscription && (
              <SettingsRow
                icon={CreditCard}
                label={t.manageSubscription}
                description={portalLoading ? t.settingsOpeningPortal : undefined}
                onClick={() => void handleManageSubscription()}
              />
            )}
            {usesStoreBilling() && (
              <SettingsRow
                icon={RefreshCw}
                label={t.restorePurchases}
                description={restoreLoading ? t.loading : undefined}
                onClick={() => void handleRestorePurchases()}
              />
            )}
            {isAppleSignInAvailable() &&
              !user?.identities?.some((id) => id.provider === "apple") && (
              <SettingsRow
                icon={Apple}
                label={t.linkAppleAccount}
                onClick={() => void linkAppleAccount()}
              />
            )}
          </SettingsGroup>

          <SettingsGroup title={t.settingsLabel}>
            <LanguageSettings
              trigger={
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/90 active:bg-slate-100/80"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <Globe className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-medium">{t.languageSettings}</span>
                  <Settings className="h-4 w-4 shrink-0 text-muted-foreground/55" aria-hidden />
                </button>
              }
            />
            {isReferralAdmin(user.email) && (
              <div className="px-4 py-3">
                <ReferralCodesAdmin />
              </div>
            )}
          </SettingsGroup>

          <SettingsGroup title={t.profileNutritionSection}>
            <DietPreferencesSettings />
          </SettingsGroup>

          <SettingsGroup title={t.reminders}>
            <div className="px-4 py-4">
              <ReminderSettings compact />
            </div>
          </SettingsGroup>

          <SettingsGroup title={t.settingsAccountGroup}>
            <SettingsRow icon={LogOut} label={t.logout} onClick={() => void handleSignOut()} />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <SettingsRow icon={Trash2} label={t.deleteAccount} destructive />
              </DialogTrigger>
              <DialogContent className="max-w-sm rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-destructive">{t.deleteAccountConfirmTitle}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  {t.deleteAccountConfirmDesc}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleteLoading}
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? t.profileDeleting : t.profileDeleteBtn}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </SettingsGroup>
        </div>

        <footer className="mt-auto pt-10 pb-4">
          <nav className="flex flex-col items-start gap-1" aria-label={t.legal}>
            <button
              type="button"
              onClick={() => navigate("/legal/impressum", { state: { from: "/profile" } })}
              className="text-left text-[11px] font-medium text-primary/55 transition-colors hover:text-primary/80"
            >
              {t.imprint}
            </button>
            <button
              type="button"
              onClick={() => navigate("/legal/agb", { state: { from: "/profile" } })}
              className="text-left text-[11px] font-medium text-primary/55 transition-colors hover:text-primary/80"
            >
              {t.termsOfService}
            </button>
            <button
              type="button"
              onClick={() => navigate("/legal/datenschutz", { state: { from: "/profile" } })}
              className="text-left text-[11px] font-medium text-primary/55 transition-colors hover:text-primary/80"
            >
              {t.privacyPolicy}
            </button>
          </nav>
          <p className="mt-4 text-[10px] text-muted-foreground/60">Frigy v1.0.0</p>
        </footer>
      </main>
    </div>
  );
};

export default ProfilePage;
