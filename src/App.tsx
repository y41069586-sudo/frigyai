import { Suspense, type ReactNode } from "react";
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
import { NotificationBootstrap } from "@/components/NotificationBootstrap";
import { AppDeepLinkListener } from "@/components/AppDeepLinkListener";
import { AuthFlowBootstrap, AuthFlowOverlay, AuthFlowRouter } from "@/components/AuthFlowBootstrap";
import { PremiumGateProvider } from "@/contexts/PremiumGateContext";
import { ReferralAttributionBootstrap } from "@/components/ReferralAttributionBootstrap";
import { AuthOAuthCallbackBootstrap } from "@/components/AuthOAuthCallbackBootstrap";
import { StoreBillingBootstrap } from "@/components/StoreBillingBootstrap";
import { BadgeUnlockCelebration } from "@/components/BadgeUnlockCelebration";
import MealPlansPage from "./pages/MealPlansPage";
// Lazy load secondary pages — main nav (/meal-plans) stays eager so navigation never hangs on Suspense
const Index = lazyWithReload(() => import("./pages/Index"));
const ScanPage = lazyWithReload(() => import("./pages/ScanPage"));
const ManualPage = lazyWithReload(() => import("./pages/ManualPage"));
const RecipesPage = lazyWithReload(() => import("./pages/RecipesPage"));
const RecipeDetailPage = lazyWithReload(() => import("./pages/RecipeDetailPage"));
const FavoritesPage = lazyWithReload(() => import("./pages/FavoritesPage"));
const NotFound = lazyWithReload(() => import("./pages/NotFound"));
import AuthPage from "./pages/AuthPage";
const PremiumPage = lazyWithReload(() => import("./pages/PremiumPage"));
const ProfilePage = lazyWithReload(() => import("./pages/ProfilePage"));
const ResetPasswordPage = lazyWithReload(() => import("./pages/ResetPasswordPage"));
const UpdatePasswordPage = lazyWithReload(() => import("./pages/UpdatePasswordPage"));
const EmailConfirmationPage = lazyWithReload(() => import("./pages/EmailConfirmationPage"));
const PlanSelectionPage = lazyWithReload(() => import("./pages/PlanSelectionPage"));
const PremiumPricingPage = lazyWithReload(() => import("./pages/PremiumPricingPage"));
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

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const AppContent = () => {
  const location = useLocation();
  const routeResetKey = `${location.pathname}${location.search}`;

  return (
    <>
      <OfflineIndicator />
      <RouteErrorBoundary resetKey={routeResetKey}>
        <div className="min-h-screen bg-background">
          <Routes location={location}>
            <Route path="/" element={<LazyRoute><Index /></LazyRoute>} />
            <Route path="/meal-plans" element={<MealPlansPage />} />
            <Route path="/onboarding-preview" element={<LazyRoute><OnboardingPreviewPage /></LazyRoute>} />
            <Route path="/signup" element={<LazyRoute><SignupDeepLinkPage /></LazyRoute>} />
            <Route path="/invite" element={<LazyRoute><SignupDeepLinkPage /></LazyRoute>} />
            <Route path="/scan" element={<LazyRoute><ScanPage /></LazyRoute>} />
            <Route path="/manual" element={<LazyRoute><ManualPage /></LazyRoute>} />
            <Route path="/recipes" element={<LazyRoute><RecipesPage /></LazyRoute>} />
            <Route path="/recipe/:id" element={<LazyRoute><RecipeDetailPage /></LazyRoute>} />
            <Route path="/favorites" element={<LazyRoute><FavoritesPage /></LazyRoute>} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/premium" element={<LazyRoute><PremiumPage /></LazyRoute>} />
            <Route path="/profile" element={<LazyRoute><ProfilePage /></LazyRoute>} />
            <Route path="/badges" element={<LazyRoute><BadgesPage /></LazyRoute>} />
            <Route path="/reset-password" element={<LazyRoute><ResetPasswordPage /></LazyRoute>} />
            <Route path="/update-password" element={<LazyRoute><UpdatePasswordPage /></LazyRoute>} />
            <Route path="/email-confirmation" element={<LazyRoute><EmailConfirmationPage /></LazyRoute>} />
            <Route path="/plan-selection" element={<LazyRoute><PlanSelectionPage /></LazyRoute>} />
            <Route path="/premium-pricing" element={<LazyRoute><PremiumPricingPage /></LazyRoute>} />
            <Route path="/admin" element={<LazyRoute><AdminPage /></LazyRoute>} />
            <Route path="/legal/:type" element={<LazyRoute><LegalPage /></LazyRoute>} />
            <Route path="/food-entry/:id" element={<LazyRoute><FoodEntryDetailPage /></LazyRoute>} />
            <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
          </Routes>
        </div>
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
                  <PremiumGateProvider>
                    <MealPlanProvider>
                    <AppDeepLinkListener />
                    <AuthFlowBootstrap />
                    <AuthFlowRouter />
                    <AuthFlowOverlay />
                    <ReferralAttributionBootstrap />
                    <AuthOAuthCallbackBootstrap />
                    <StoreBillingBootstrap />
                    <NotificationBootstrap />
                    <BadgeUnlockCelebration />
                    <AppContent />
                    </MealPlanProvider>
                  </PremiumGateProvider>
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
