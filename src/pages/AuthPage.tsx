import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Leaf } from 'lucide-react';
import frigLogo from '@/assets/frig-logo.png';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (!error) {
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (!error) {
          setIsLogin(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <img src={frigLogo} alt="Frig AI" className="h-12 w-12 mx-auto mb-4 rounded-xl animate-pulse" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-primary safe-area-inset">
      {/* Back Button Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 safe-top">
        <div className="container mx-auto px-3 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="touch-target h-10 w-10"
          >
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
          <div className="bg-card/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-neon p-6 sm:p-8 border border-primary/20">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <img src={frigLogo} alt="Frig AI" className="h-12 w-12 rounded-xl" />
              <h1 className="text-2xl sm:text-3xl font-bold ml-3 neon-text">Frig AI</h1>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
              {isLogin ? 'Anmelden' : 'Registrieren'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background/50 h-12 text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full glow-button h-12 sm:h-14 text-base touch-target"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Laden...' : (isLogin ? 'Anmelden' : 'Registrieren')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors touch-target py-2"
              >
                {isLogin
                  ? 'Noch kein Konto? Jetzt registrieren'
                  : 'Bereits registriert? Jetzt anmelden'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;