import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import frigLogo from "@/assets/frigy-mascot.png";
import { getPublicErrorMessage } from "@/lib/publicErrorMessage";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "E-Mail gesendet!",
        description: "Überprüfe dein Postfach für den Reset-Link.",
      });
    } catch (error: unknown) {
      toast({
        title: t.error,
        description: getPublicErrorMessage(error, "Die Reset-E-Mail konnte gerade nicht gesendet werden. Bitte versuche es erneut."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-primary safe-area-inset">
        <div className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 safe-top">
          <div className="container mx-auto px-3 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-neon p-8 border border-primary/20 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">E-Mail gesendet!</h2>
              <p className="text-muted-foreground mb-6">
                Wir haben dir einen Link zum Zurücksetzen deines Passworts an{" "}
                <span className="text-foreground font-medium">{email}</span> gesendet.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Überprüfe auch deinen Spam-Ordner, falls du die E-Mail nicht findest.
              </p>
              <Button onClick={() => navigate("/auth")} className="w-full">
                Zurück zur Anmeldung
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-primary safe-area-inset">
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 safe-top">
        <div className="container mx-auto px-3 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
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

            <h2 className="text-xl font-bold text-center mb-2">{t.forgotPassword}</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50 h-12 pl-10"
                    placeholder="deine@email.de"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full glow-button h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? t.loading : "Reset-Link senden"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/auth")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Zurück zur Anmeldung
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
