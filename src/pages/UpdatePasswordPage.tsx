import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import frigLogo from "@/assets/frigy-mascot.png";
import { getPublicErrorMessage } from "@/lib/publicErrorMessage";

const UpdatePasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check if user came from password reset email
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (type === "recovery" && accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get("refresh_token") || "",
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t.error,
        description: "Passwörter stimmen nicht überein",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t.error,
        description: "Passwort muss mindestens 6 Zeichen lang sein",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: t.success,
        description: "Dein Passwort wurde erfolgreich geändert!",
      });
    } catch (error: unknown) {
      toast({
        title: t.error,
        description: getPublicErrorMessage(error, "Das Passwort konnte gerade nicht geändert werden. Bitte versuche es erneut."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-neon p-8 border border-primary/20 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Passwort geändert!</h2>
            <p className="text-muted-foreground mb-6">
              Du kannst dich jetzt mit deinem neuen Passwort anmelden.
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full glow-button">
              Zur Anmeldung
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-neon p-6 sm:p-8 border border-primary/20">
          <div className="flex items-center justify-center mb-6">
            <img src={frigLogo} alt="Frigy" className="h-12 w-12 rounded-xl" />
            <h1 className="text-2xl font-bold ml-3 neon-text">Frigy</h1>
          </div>

          <h2 className="text-xl font-bold text-center mb-2">Neues Passwort</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Wähle ein neues, sicheres Passwort für dein Konto.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background/50 h-12 pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background/50 h-12 pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full glow-button h-12"
              disabled={isSubmitting}
            >
              {isSubmitting ? t.loading : "Passwort ändern"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default UpdatePasswordPage;
