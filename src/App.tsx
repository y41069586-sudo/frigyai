import { Suspense, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { getPageTransition } from "@/lib/motionPresets";
import { Toaster } from "@/components/ui/toaster";
// Force rebuild to clear Vite cache
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MealPlanProvider } from "@/contexts/MealPlanContext";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ThemeProvider } from "next-themes";
import { PageLoader } from "@/components/PageLoader";
import { SupabaseErrorBoundary } from "@/components/SupabaseErrorBoundary";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { lazyWithReload } from "@/lib/lazyWithReload";
import { isMainNavRoute } from "@/lib/routeTransitions";
import { NotificationBootstrap } from "@/components/NotificationBootstrap";
import { AppDeepLinkListener } from "@/components/AppDeepLinkListener";
import { ReferralAttributionBootstrap } from "@/components/ReferralAttributionBootstrap";
import { StoreBillingBootstrap } from "@/components/StoreBillingBootstrap";
import { BadgeUnlockCelebration } from "@/components/BadgeUnlockCelebration";
import MealPlansPage from "./pages/MealPlansPage";
// Lazy load all pages for better performance
const Index = lazyWithReload(() => import("./pages/Index"));
const ScanPage = lazyWithReload(() => import("./pages/ScanPage"));
const ManualPage = lazyWithReload(() => import("./pages/ManualPage"));
const RecipesPage = lazyWithReload(() => import("./pages/RecipesPage"));
const RecipeDetailPage = lazyWithReload(() => import("./pages/RecipeDetailPage"));
const FavoritesPage = lazyWithReload(() => import("./pages/FavoritesPage"));
const NotFound = lazyWithReload(() => import("./pages/NotFound"));
const AuthPage = lazyWithReload(() => import("./pages/AuthPage"));
const PremiumPage = lazyWithReload(() => import("./pages/PremiumPage"));
const ProfilePage = lazyWithReload(() => import("./pages/ProfilePage"));
const ResetPasswordPage = lazyWithReload(() => import("./pages/ResetPasswordPage"));
const UpdatePasswordPage = lazyWithReload(() => import("./pages/UpdatePasswordPage"));
const EmailConfirmationPage = lazyWithReload(() => import("./pages/EmailConfirmationPage"));
const PlanSelectionPage = lazyWithReload(() => import("./pages/PlanSelectionPage"));
const PremiumPricingPage = lazyWithReload(() => import("./pages/PremiumPricingPage"));
const LandingPage = lazyWithReload(() => import("./pages/LandingPage"));
const AdminPage = lazyWithReload(() => import("./pages/AdminPage"));
const LegalPage = lazyWithReload(() => import("./pages/LegalPage"));
const FoodEntryDetailPage = lazyWithReload(() => import("./pages/FoodEntryDetailPage"));
const OnboardingPreviewPage = lazyWithReload(() => import("./pages/OnboardingPreviewPage"));
const SignupDeepLinkPage = lazyWithReload(() => import("./pages/SignupDeepLinkPage"));
const BadgesPage = lazyWithReload(() => import("./pages/BadgesPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


const AppContent = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const pageTransition = useMemo(
    () => getPageTransition(isMobile, isMainNavRoute(location.pathname)),
    [isMobile, location.pathname],
  );

  return (
    <>
      <OfflineIndicator />
      <RouteErrorBoundary resetKey={`${location.pathname}${location.search}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransition.transition}
            className="min-h-screen bg-background"
          >
            <Suspense fallback={<PageLoader />}>
              <Routes location={location}>
                <Route path="/" element={<Index />} />
                <Route path="/onboarding-preview" element={<OnboardingPreviewPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/signup" element={<SignupDeepLinkPage />} />
                <Route path="/invite" element={<SignupDeepLinkPage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/manual" element={<ManualPage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/recipe/:id" element={<RecipeDetailPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/meal-plans" element={<MealPlansPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/badges" element={<BadgesPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />
                <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
                <Route path="/plan-selection" element={<PlanSelectionPage />} />
                <Route path="/premium-pricing" element={<PremiumPricingPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/legal/:type" element={<LegalPage />} />
                <Route path="/food-entry/:id" element={<FoodEntryDetailPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </RouteErrorBoundary>
    </>
  );
};

const App = () => {
  return (
    <SupabaseErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AuthProvider>
                  <MealPlanProvider>
                    <AppDeepLinkListener />
                    <ReferralAttributionBootstrap />
              <StoreBillingBootstrap />
                    <NotificationBootstrap />
                    <BadgeUnlockCelebration />
                    <AppContent />
                  </MealPlanProvider>
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SupabaseErrorBoundary>
  );
};

export default App;
