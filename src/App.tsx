import { lazy, Suspense, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
// Force rebuild to clear Vite cache
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MealPlanProvider } from "@/contexts/MealPlanContext";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ThemeProvider } from "next-themes";
import { PageLoader } from "@/components/PageLoader";
import { FreeTrialReminder } from "@/components/FreeTrialReminder";
import { ReEngagementBanner } from "@/components/ReEngagementBanner";
import { SplashScreen } from "@/components/SplashScreen";

// Lazy load all pages for better performance
const Index = lazy(() => import("./pages/Index"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const ManualPage = lazy(() => import("./pages/ManualPage"));
const RecipesPage = lazy(() => import("./pages/RecipesPage"));
const RecipeDetailPage = lazy(() => import("./pages/RecipeDetailPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const PremiumPage = lazy(() => import("./pages/PremiumPage"));
const MealPlansPage = lazy(() => import("./pages/MealPlansPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const UpdatePasswordPage = lazy(() => import("./pages/UpdatePasswordPage"));
const EmailConfirmationPage = lazy(() => import("./pages/EmailConfirmationPage"));
const PlanSelectionPage = lazy(() => import("./pages/PlanSelectionPage"));
const PremiumPricingPage = lazy(() => import("./pages/PremiumPricingPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const FoodEntryDetailPage = lazy(() => import("./pages/FoodEntryDetailPage"));

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
  return (
    <>
      <OfflineIndicator />
      <FreeTrialReminder />
      <ReEngagementBanner />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/manual" element={<ManualPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/meal-plans" element={<MealPlansPage />} />
          <Route path="/profile" element={<ProfilePage />} />
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
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AuthProvider>
                  <MealPlanProvider>
                    <AppContent />
                  </MealPlanProvider>
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
};

export default App;
