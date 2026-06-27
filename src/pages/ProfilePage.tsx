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
  Ticket,
  Shield,
  FileText,
  Landmark,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
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
import { canManageStoreSubscription, isSubscriptionActive } from "@/lib/subscription";
import { buildPremiumPricingRoute, resolveTrialEligibleFromLocal } from "@/lib/trialEligibility";
import { getPublicErrorMessage } from "@/lib/publicErrorMessage";
import { openStoreSubscriptionManagement, isStoreBillingConfigured, restoreStorePurchases } from "@/lib/storeBilling";
import { usesStoreBilling } from "@/lib/billingPlatform";
import { useStorePromoRedeem } from "@/hooks/useStorePromoRedeem";
import { markEverPremium } from "@/lib/trialEligibility";
import { waitForPremiumAfterPurchase } from "@/lib/subscriptionRefresh";
import { APP_BUILD, APP_VERSION } from "@/lib/appVersion";

// ─── Language flag helper ────────────────────────────────────────────────────
function languageFlag(lang: string) {
  if (lang === "de") return "🇩🇪";
  if (lang === "fr") return "🇫🇷";
  return "🇬🇧";
}

// ─── Icon badge component ─────────────────────────────────────────────────────
type IconColor = "green" | "blue" | "purple" | "amber" | "gray" | "red";

function IconBadge({
  icon: Icon,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: IconColor;
}) {
  const colorMap: Record<IconColor, string> = {
    green: "bg-[#E8FAF0] text-[#39D47F]",
    blue: "bg-[#EBF4FF] text-[#3B82F6]",
    purple: "bg-[#F3EEFF] text-[#8B5CF6]",
    amber: "bg-[#FFF8E6] text-[#F59E0B]",
    gray: "bg-[#F3F4F6] text-[#6B7280]",
    red: "bg-[#FEF2F2] text-[#EF4444]",
  };
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
        colorMap[color],
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

// ─── Settings group ───────────────────────────────────────────────────────────
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
    <section className={cn("space-y-1.5", className)}>
      {title && (
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
          {title}
        </h2>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm divide-y divide-slate-100/80">
        {children}
      </div>
    </section>
  );
}

// ─── Settings row ─────────────────────────────────────────────────────────────
function SettingsRow({
  icon: Icon,
  iconColor = "gray",
  label,
  description,
  onClick,
  trailing,
  destructive,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: IconColor;
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
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150",
        onClick && "hover:bg-slate-50/80 active:scale-[0.98] active:bg-slate-100/70",
        destructive && "text-destructive",
        className,
      )}
    >
      {Icon && (
        <IconBadge
          icon={Icon}
          color={destructive ? "red" : iconColor}
        />
      )}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-[15px] font-medium leading-snug text-[#1F2937]",
            destructive && "text-red-500",
          )}
        >
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[12px] text-[#6B7280]">{description}</span>
        )}
      </span>
      {trailing ?? (
        onClick && (
          <ChevronRight className="h-4 w-4 shrink-0 text-[#6B7280]/50" />
        )
      )}
    </Comp>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// ─── Main component ───────────────────────────────────────────────────────────
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, session, subscriptionStatus, isPremium, signOut, checkSubscription } = useAuth();
  const premiumActive = isPremium || isSubscriptionActive(subscriptionStatus);
  const { saveProgress } = useOnboardingProgress();
  const { t, language } = useLanguage();
  const dateLocale = getAppLocale(language);
  const [refreshing, setRefreshing] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const canManageSubscription = canManageStoreSubscription(subscriptionStatus);
  const showPromoRedeem = !premiumActive && usesStoreBilling() && isStoreBillingConfigured();

  const { startRedeem: startPromoRedeem, loading: promoRedeemLoading, promoCodeDialog } =
    useStorePromoRedeem({
      accessToken: session?.access_token,
      userId: user?.id,
      checkSubscription,
      onSuccess: () => {
        markEverPremium();
        toast({ title: t.success, description: t.premiumActive });
      },
    });

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
    if (restoreLoading || !session?.access_token) {
      if (!session?.access_token) {
        toast({ title: t.error, variant: "destructive" });
      }
      return;
    }
    setRestoreLoading(true);
    try {
      const result = await restoreStorePurchases(session.access_token);
      const active = await waitForPremiumAfterPurchase(
        checkSubscription,
        session.access_token,
        4,
      );
      if (result.ok || active) {
        markEverPremium();
        toast({ title: t.success, description: t.premiumActive });
        return;
      }
      if (result.message) {
        toast({
          title: t.error,
          description: result.message,
          variant: "destructive",
        });
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
      await openStoreSubscriptionManagement();
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
        description: t.userNotAuthenticated,
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
        title: t.accountDeletedTitle,
        description: t.accountDeletedDesc,
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
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Frigy User";

  return (
    <div className="min-h-screen bg-[#F7FAF7] safe-area-inset">
      {promoCodeDialog}

      {/* ── Header ── */}
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
        <motion.div
          className="space-y-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* ── Profile card ── */}
          <motion.div variants={itemVariants}>
            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm px-5 py-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white shadow ring-2 ring-[#75FBB2]/40">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-[#75FBB2]/30 to-[#39D47F]/20 text-xl font-bold text-[#39D47F]">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[18px] font-bold tracking-[-0.03em] text-[#1F2937]">
                    {displayName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#6B7280]">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </p>
                  {premiumActive ? (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-400/30">
                      <Sparkles className="h-3 w-3" />
                      Premium
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(buildPremiumPricingRoute({ trialEligible: resolveTrialEligibleFromLocal() }))
                      }
                      className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#39D47F] hover:underline"
                    >
                      {t.settingsPremiumActivate} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Subscription group ── */}
          <motion.div variants={itemVariants}>
            <SettingsGroup title={t.settingsSubscriptionGroup}>
              <SettingsRow
                icon={Crown}
                iconColor="amber"
                label={premiumActive ? t.premiumActive : t.settingsPremiumInactiveLabel}
                description={
                  premiumActive && subscriptionStatus?.subscription_end
                    ? `${t.renewsOn}: ${new Date(subscriptionStatus.subscription_end).toLocaleDateString(dateLocale)}`
                    : premiumActive
                      ? undefined
                      : t.settingsPremiumInactiveDesc
                }
                onClick={
                  premiumActive
                    ? undefined
                    : () => navigate(buildPremiumPricingRoute({ trialEligible: resolveTrialEligibleFromLocal() }))
                }
                trailing={
                  premiumActive ? (
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
                      <RefreshCw className={cn("h-4 w-4 text-[#6B7280]", refreshing && "animate-spin")} />
                    </Button>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-[#39D47F]">
                      {t.settingsPremiumActivate}
                    </span>
                  )
                }
              />
              {showPromoRedeem && (
                <SettingsRow
                  icon={Ticket}
                  iconColor="purple"
                  label={t.redeemPromoCode}
                  description={promoRedeemLoading ? t.loading : undefined}
                  onClick={() => void startPromoRedeem()}
                />
              )}
              {usesStoreBilling() && (
                <SettingsRow
                  icon={RefreshCw}
                  iconColor="blue"
                  label={t.restorePurchases}
                  description={restoreLoading ? t.loading : undefined}
                  onClick={() => void handleRestorePurchases()}
                />
              )}
              {canManageSubscription && (
                <SettingsRow
                  icon={CreditCard}
                  iconColor="purple"
                  label={t.manageSubscription}
                  description={portalLoading ? t.settingsOpeningPortal : undefined}
                  onClick={() => void handleManageSubscription()}
                />
              )}
            </SettingsGroup>
          </motion.div>

          {/* ── Goals & Tracking ── */}
          <motion.div variants={itemVariants}>
            <SettingsGroup title={t.profileNutritionSection}>
              <DietPreferencesSettings />
            </SettingsGroup>
          </motion.div>

          {/* ── App & Notifications ── */}
          <motion.div variants={itemVariants}>
            <SettingsGroup title={t.settingsLabel}>
              <LanguageSettings
                trigger={
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-slate-50/80 active:scale-[0.98] active:bg-slate-100/70"
                  >
                    <IconBadge icon={Globe} color="blue" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium leading-snug text-[#1F2937]">
                        {t.languageSettings}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-[#6B7280]">
                        {languageFlag(language)}{" "}
                        {language === "de" ? "Deutsch" : language === "fr" ? "Français" : "English"}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#6B7280]/50" />
                  </button>
                }
              />
              {isReferralAdmin(user.email) && (
                <div className="px-4 py-3">
                  <ReferralCodesAdmin />
                </div>
              )}
            </SettingsGroup>
          </motion.div>

          {/* ── Reminders ── */}
          <motion.div variants={itemVariants}>
            <SettingsGroup title={t.reminders}>
              <div className="px-4 py-4">
                <ReminderSettings compact />
              </div>
            </SettingsGroup>
          </motion.div>

          {/* ── Account ── */}
          <motion.div variants={itemVariants}>
            <SettingsGroup title={t.settingsAccountGroup}>
              <SettingsRow
                icon={Mail}
                iconColor="purple"
                label={user.email ?? ""}
                trailing={<span />}
              />
            </SettingsGroup>
          </motion.div>

          {/* ── Legal ── */}
          <motion.div variants={itemVariants}>
            <SettingsGroup title={t.legal ?? "Rechtliches"}>
              <SettingsRow
                icon={Shield}
                iconColor="gray"
                label={t.privacyPolicy}
                onClick={() => navigate("/legal/datenschutz", { state: { from: "/profile" } })}
              />
              <SettingsRow
                icon={FileText}
                iconColor="gray"
                label={t.termsOfService}
                onClick={() => navigate("/legal/agb", { state: { from: "/profile" } })}
              />
              <SettingsRow
                icon={Landmark}
                iconColor="gray"
                label={t.imprint}
                onClick={() => navigate("/legal/impressum", { state: { from: "/profile" } })}
              />
            </SettingsGroup>
          </motion.div>

          {/* ── Danger zone ── */}
          <motion.div variants={itemVariants}>
            <SettingsGroup>
              <SettingsRow
                icon={LogOut}
                iconColor="red"
                label={t.logout}
                destructive
                onClick={() => void handleSignOut()}
              />
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <SettingsRow
                    icon={Trash2}
                    iconColor="red"
                    label={t.deleteAccount}
                    destructive
                  />
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
          </motion.div>

        </motion.div>

        {/* ── Version footer ── */}
        <footer className="mt-auto pt-10 pb-6 flex flex-col items-center gap-1">
          <p className="text-[11px] text-[#6B7280]/50 font-medium tracking-wide">
            Frigy v{APP_VERSION} ({APP_BUILD})
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ProfilePage;
