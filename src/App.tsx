import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import ScanPage from "./pages/ScanPage";
import ManualPage from "./pages/ManualPage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import PremiumPage from "./pages/PremiumPage";
import MealPlansPage from "./pages/MealPlansPage";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import PlanSelectionPage from "./pages/PlanSelectionPage";
import PremiumPricingPage from "./pages/PremiumPricingPage";
import LandingPage from "./pages/LandingPage";
import CommunityPage from "./pages/CommunityPage";
import AdminPage from "./pages/AdminPage";

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
        <Route path="/plan-selection" element={<PlanSelectionPage />} />
        <Route path="/premium-pricing" element={<PremiumPricingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
